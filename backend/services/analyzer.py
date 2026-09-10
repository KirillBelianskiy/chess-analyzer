import chess.engine
from chess import Board, Move
from chess.engine import Wdl


def terminal_wdl(board: Board, mover: chess.Color) -> Wdl:
    outcome = board.outcome()

    if outcome is None:
        raise ValueError("Position is not terminal")

    if outcome.winner is None:
        return Wdl(0, 1000, 0)

    if outcome.winner == mover:
        return Wdl(1000, 0, 0)

    return Wdl(0, 0, 1000)


def step_by_step_analyzer(
        board: Board, moves: list[Move], engine, time_limit: float = 0.5
) -> list[dict]:
    """This function mutates the board. Synchronous function"""
    analyse_before = engine.analyse(board, chess.engine.Limit(time=time_limit))

    analyzed_game = []

    for i, move in enumerate(moves):

        mover = board.turn

        best_score = analyse_before["score"].pov(board.turn)
        best_wdl = analyse_before["wdl"].pov(mover)
        best_expectation = best_wdl.expectation()

        played_move = move.uci()
        piece = board.piece_at(move.from_square).symbol()

        best_move = analyse_before["pv"][0].uci() if "pv" in analyse_before else None
        if "pv" in analyse_before:
            best_line_raw = (
                analyse_before["pv"]
                if len(analyse_before["pv"]) < 8
                else analyse_before["pv"][:8]
            )
            best_line = [m.uci() for m in best_line_raw]
        else:
            best_line = None

        move_number = board.fullmove_number

        board.push(move)

        analyse_after = engine.analyse(board, chess.engine.Limit(time=time_limit))

        played_score = analyse_after["score"].pov(mover)

        played_wdl = None
        if board.is_game_over():
            played_wdl = terminal_wdl(board, mover)
        else:
            played_wdl = analyse_after["wdl"].pov(mover)

        played_expectation = played_wdl.expectation()

        if "pv" in analyse_after:
            played_line_raw = (
                analyse_after["pv"]
                if len(analyse_after["pv"]) < 7
                else analyse_after["pv"][:7]
            )
            played_line = [move.uci()] + [m.uci() for m in played_line_raw]
        else:
            played_line = None

        analyzed_move = {
            "ply_index": i,
            "move_number": move_number,
            "played_move": played_move,

            "wdl": (best_wdl, played_wdl),
            # these vars aren't existed in pydantic classes because they aren't used in API functions
            "expectation": (best_expectation, played_expectation),
            # these vars aren't existed in pydantic classes because they aren't used in API functions

            "score": (best_score, played_score),

            "best_move": best_move,
            "best_line": best_line,

            "played_line": played_line,

            "is_white": mover,
            "piece": piece,
        }

        best_score = analyse_after["score"].pov(not mover)
        analyzed_game.append(analyzed_move)

        if analyse_after is not None:
            analyse_before = analyse_after

    return analyzed_game


def analyzer(board: Board, moves: list[Move], time_limit: float = 0.5) -> list[dict]:
    with chess.engine.SimpleEngine.popen_uci("stockfish") as engine:
        engine.configure({"UCI_ShowWDL": True})
        analyzed_game = step_by_step_analyzer(board, moves, engine, time_limit)

    return analyzed_game


def cp_loss_calculation(best_score: Score, played_score: Score) -> int | None:
    if best_score.is_mate() or played_score.is_mate():
        return None

    best_cp = best_score.score()
    played_cp = played_score.score()

    return max(0, best_cp - played_cp)


def classify_move(played_move: str, best_move: str, expectation_loss: float) -> str:
    if played_move == best_move:
        return "best"

    if expectation_loss >= 0.20:
        return "blunder"

    if expectation_loss >= 0.10:
        return "mistake"

    if expectation_loss >= 0.05:
        return "inaccuracy"

    if expectation_loss >= 0.02:
        return "good"

    return "excellent"


def wdl_counting(analyzed_game: list[dict]) -> list[dict]:
    for move in analyzed_game:
        best_score, played_score = move["score"][0], move["score"][1]
        best_expectation, played_expectation = move["expectation"][0], move["expectation"][1]

        expectation_loss = max(0, best_expectation - played_expectation)
        cp_loss = cp_loss_calculation(best_score, played_score)

        classification = classify_move(move["played_move"], move["best_move"], expectation_loss)

        best_wdl, played_wdl = move["wdl"][0], move["wdl"][1]
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
            "cp_loss": cp_loss,
            "classification": classification,
        }
        del move["wdl"]
        del move["expectation"]

    return analyzed_game
