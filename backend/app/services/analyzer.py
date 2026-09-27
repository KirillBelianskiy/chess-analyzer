import math
from collections.abc import Mapping
from typing import Any

import chess.engine
from chess import Board, Move
from chess.engine import Cp, Mate, MateGiven, PovScore, PovWdl, Score, Wdl

DEFAULT_ANALYSIS_NODES = 100_000
MAX_PV_MOVES = 8
MATE_SCORE = 100_000


class EngineAnalysisError(RuntimeError):
    """Raised when Stockfish omits data required by the API contract."""


def terminal_wdl(board: Board, mover: chess.Color) -> Wdl:
    outcome = board.outcome()

    if outcome is None:
        raise ValueError("Position is not terminal")

    if outcome.winner is None:
        return Wdl(0, 1000, 0)

    if outcome.winner == mover:
        return Wdl(1000, 0, 0)

    return Wdl(0, 0, 1000)


def terminal_score(board: Board, mover: chess.Color) -> Score:
    outcome = board.outcome()
    if outcome is None:
        raise ValueError("Position is not terminal")
    if outcome.winner is None:
        return Cp(0)
    return MateGiven if outcome.winner == mover else Mate(0)


def _required_score(info: Mapping[str, Any], mover: chess.Color) -> Score:
    score = info.get("score")
    if not isinstance(score, PovScore):
        raise EngineAnalysisError("Stockfish analysis is missing a valid 'score'.")
    return score.pov(mover)


def _required_wdl(info: Mapping[str, Any], mover: chess.Color) -> Wdl:
    wdl = info.get("wdl")
    if not isinstance(wdl, PovWdl):
        raise EngineAnalysisError(
            "Stockfish analysis is missing WDL data; enable UCI_ShowWDL."
        )
    return wdl.pov(mover)


def _pv(info: Mapping[str, Any], limit: int) -> list[Move] | None:
    pv = info.get("pv")
    if not isinstance(pv, list) or not all(isinstance(move, Move) for move in pv):
        return None
    return pv[:limit]


def step_by_step_analyzer(
    board: Board,
    moves: list[Move],
    engine: chess.engine.SimpleEngine,
    nodes: int = DEFAULT_ANALYSIS_NODES,
) -> list[dict[str, Any]]:
    """Analyzes moves synchronously and mutates ``board``."""
    if not moves:
        return []

    limit = chess.engine.Limit(nodes=nodes)
    analyse_before = engine.analyse(board, limit)
    analyzed_game: list[dict[str, Any]] = []

    for ply_index, move in enumerate(moves):
        mover = board.turn
        piece = board.piece_at(move.from_square)
        if piece is None:
            raise ValueError(f"No piece on the source square for move {move.uci()}.")
        if move not in board.legal_moves:
            raise ValueError(f"Illegal move in analysis input: {move.uci()}.")

        best_score = _required_score(analyse_before, mover)
        best_wdl = _required_wdl(analyse_before, mover)
        best_pv = _pv(analyse_before, MAX_PV_MOVES)
        best_move = best_pv[0].uci() if best_pv else None
        best_line = [pv_move.uci() for pv_move in best_pv] if best_pv else None
        move_number = board.fullmove_number
        played_move = move.uci()

        board.push(move)
        if board.is_game_over():
            analyse_after = None
            played_score = terminal_score(board, mover)
            played_wdl = terminal_wdl(board, mover)
            played_line = None
        else:
            analyse_after = engine.analyse(board, limit)
            played_score = _required_score(analyse_after, mover)
            played_wdl = _required_wdl(analyse_after, mover)
            continuation = _pv(analyse_after, MAX_PV_MOVES - 1)
            played_line = (
                [played_move, *(pv_move.uci() for pv_move in continuation)]
                if continuation
                else None
            )

        best_expectation = best_wdl.expectation()
        played_expectation = played_wdl.expectation()
        analyzed_game.append(
            {
                "ply_index": ply_index,
                "move_number": move_number,
                "played_move": played_move,
                "wdl": (best_wdl, played_wdl),
                "expectation": (best_expectation, played_expectation),
                "score": (best_score, played_score),
                "best_move": best_move,
                "best_line": best_line,
                "played_line": played_line,
                "is_white": mover,
                "piece": piece.symbol(),
            }
        )

        if analyse_after is not None:
            analyse_before = analyse_after

    return analyzed_game


def analyzer(
    board: Board,
    moves: list[Move],
    nodes: int = DEFAULT_ANALYSIS_NODES,
) -> list[dict[str, Any]]:
    with chess.engine.SimpleEngine.popen_uci("stockfish") as engine:
        engine.configure({"UCI_ShowWDL": True})
        return step_by_step_analyzer(board, moves, engine, nodes)


def cp_loss_calculation(best_score: Score, played_score: Score) -> int | None:
    if best_score.is_mate() or played_score.is_mate():
        return None
    best_cp = best_score.score()
    played_cp = played_score.score()
    if best_cp is None or played_cp is None:
        return None
    return max(0, best_cp - played_cp)


def lichess_win_probability(cp: int) -> float:
    """Converts a mover-relative centipawn score to the requested Lichess Win%."""
    clamped_cp = max(-1000, min(1000, cp))
    return 1 / (1 + math.exp(-0.00368208 * clamped_cp))


def _mate_outcome(score: Score) -> int | None:
    """Returns 1 for a forced win, -1 for a forced loss, and None for cp."""
    if not score.is_mate():
        return None
    numeric = score.score(mate_score=MATE_SCORE)
    if numeric is None:
        raise ValueError("Mate score could not be converted.")
    return 1 if numeric > 0 else -1


def score_win_probability(score: Score) -> float:
    mate_outcome = _mate_outcome(score)
    if mate_outcome is not None:
        return 1.0 if mate_outcome > 0 else 0.0
    cp = score.score()
    if cp is None:
        raise ValueError("Centipawn score is unavailable.")
    return lichess_win_probability(cp)


def _mate_transition_classification(
    best_score: Score, played_score: Score
) -> str | None:
    """Adapts Lichess MateAdvice transitions to mover-relative scores."""
    best_mate = _mate_outcome(best_score)
    played_mate = _mate_outcome(played_score)

    if best_mate == 1:
        if played_mate == 1:
            return "excellent"
        if played_mate == -1:
            return "blunder"
        played_cp = played_score.score()
        if played_cp is None:
            raise ValueError("Centipawn score is unavailable.")
        if played_cp > 999:
            return "inaccuracy"
        if played_cp > 700:
            return "mistake"
        return "blunder"

    if played_mate == -1 and best_mate is None:
        best_cp = best_score.score()
        if best_cp is None:
            raise ValueError("Centipawn score is unavailable.")
        if best_cp < -999:
            return "inaccuracy"
        if best_cp < -700:
            return "mistake"
        return "blunder"

    return None


def classify_move(
    played_move: str,
    best_move: str | None,
    win_probability_loss: float,
    best_score: Score,
    played_score: Score,
) -> str:
    if played_move == best_move:
        return "best"

    mate_classification = _mate_transition_classification(best_score, played_score)
    if mate_classification is not None:
        return mate_classification

    if win_probability_loss >= 0.15:
        return "blunder"
    if win_probability_loss >= 0.10:
        return "mistake"
    if win_probability_loss >= 0.05:
        return "inaccuracy"
    if win_probability_loss >= 0.02:
        return "good"
    return "excellent"


def wdl_counting(analyzed_game: list[dict[str, Any]]) -> list[dict[str, Any]]:
    for move in analyzed_game:
        best_score, played_score = move["score"]
        best_expectation, played_expectation = move["expectation"]
        expectation_loss = max(0.0, best_expectation - played_expectation)
        best_win_probability = score_win_probability(best_score)
        played_win_probability = score_win_probability(played_score)
        win_probability_loss = max(
            0.0, best_win_probability - played_win_probability
        )
        cp_loss = cp_loss_calculation(best_score, played_score)
        classification = classify_move(
            move["played_move"],
            move["best_move"],
            win_probability_loss,
            best_score,
            played_score,
        )

        best_wdl, played_wdl = move["wdl"]
        move["quality"] = {
            "best_wdl": {
                "win": best_wdl.wins / 1000,
                "draw": best_wdl.draws / 1000,
                "loss": best_wdl.losses / 1000,
            },
            "played_wdl": {
                "win": played_wdl.wins / 1000,
                "draw": played_wdl.draws / 1000,
                "loss": played_wdl.losses / 1000,
            },
            "played_expectation": played_expectation,
            "best_expectation": best_expectation,
            "expectation_loss": expectation_loss,
            "win_probability_loss": win_probability_loss,
            "cp_loss": cp_loss,
            "classification": classification,
        }
        del move["wdl"]
        del move["expectation"]

    return analyzed_game
