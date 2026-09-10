import chess.engine

from schemas.analysis import AnalyzedGame, AnalyzedMove, MoveScore, ScoreValue, Quality, WDL
from schemas.parse import ParseResponse


def map_score(score: chess.engine.Score) -> ScoreValue:
    return ScoreValue(
        centipawns=score.score(),
        mate_in=score.mate()
    )


def map_move_score(best: ScoreValue, played: ScoreValue) -> MoveScore:
    return MoveScore(
        best=best,
        played=played
    )

def map_wdl(wdl) -> WDL:
    return WDL(
        win=wdl["win"],
        draw=wdl["draw"],
        loss=wdl["loss"],
    )

def map_quality(quality: dict) -> Quality:
    return Quality(
        best_wdl=map_wdl(quality["best_wdl"]),
        played_wdl=map_wdl(quality["played_wdl"]),
        played_expectation=quality["played_expectation"],
        best_expectation=quality["best_expectation"],
        expectation_loss=quality["expectation_loss"],
        cp_loss=quality["cp_loss"],
        classification=quality["classification"],
    )

def map_analyzed_move(analyzed_move: dict) -> AnalyzedMove:
    return AnalyzedMove(
        ply_index=analyzed_move["ply_index"],
        move_number=analyzed_move["move_number"],
        played_move=analyzed_move["played_move"],
        best_move=analyzed_move["best_move"],
        score=map_move_score(map_score(analyzed_move["score"][0]), map_score(analyzed_move["score"][1])),
        quality=map_quality(analyzed_move["quality"]),
        is_white=analyzed_move["is_white"],
        piece=analyzed_move["piece"],
        best_line=analyzed_move["best_line"],
        played_line=analyzed_move["played_line"]
    )

def map_analyzed_game(analyzed_game: list[dict]) -> AnalyzedGame:
    processed_moves = []
    for move in analyzed_game:
        analyzed_move = map_analyzed_move(move)
        processed_moves.append(analyzed_move)

    return AnalyzedGame(
        moves=processed_moves
    )


def map_moves(moves: list[chess.Move]) -> list[str]:
    processed_moves = []
    for move in moves:
        processed_moves.append(move.uci())
    return processed_moves


def map_board(board: chess.Board) -> str:
    return board.fen()

def map_parse_response(response: dict) -> ParseResponse:
    return ParseResponse(
        headers=response["headers"],
        initial_fen=map_board(response["initial_board"]),
        moves=map_moves(response["moves"])
    )


