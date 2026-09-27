import chess
import pytest
from chess.engine import Cp, Mate, MateGiven, Score

from app.api import mappers
from app.schemas.analysis import Quality, WDL, ScoreValue, MoveScore, AnalyzedMove, AnalyzedGame
from app.schemas.parse import ParseResponse

QUALITY_DICT = {
    "best_wdl": {"win": 0.4, "draw": 0.4, "loss": 0.2},
    "played_wdl": {"win": 0.35, "draw": 0.4, "loss": 0.25},
    "played_expectation": 0.55,
    "best_expectation": 0.6,
    "expectation_loss": 0.05,
    "win_probability_loss": 0.04,
    "cp_loss": None,
    "classification": "good",
}

QUALITY_MODEL = Quality(
    best_wdl=WDL(win=0.4, draw=0.4, loss=0.2),
    played_wdl=WDL(win=0.35, draw=0.4, loss=0.25),
    played_expectation=0.55,
    best_expectation=0.6,
    expectation_loss=0.05,
    win_probability_loss=0.04,
    cp_loss=None,
    classification="good",
)


@pytest.mark.parametrize(
    ("score", "expected"),
    [
        (Cp(100), ScoreValue(centipawns=100)),
        (Cp(-250), ScoreValue(centipawns=-250)),
        (Mate(3), ScoreValue(mate_in=3)),
        (Mate(-1), ScoreValue(mate_in=-1)),
        (MateGiven, ScoreValue(mate_in=0)),
    ],
)
def test_map_score(score: Score, expected: ScoreValue) -> None:
    assert mappers.map_score(score) == expected


def test_map_move_score_preserves_best_and_played_scores() -> None:
    best = ScoreValue(centipawns=42)
    played = ScoreValue(mate_in=-2)

    assert mappers.map_move_score(best, played) == MoveScore(
        best=best,
        played=played,
    )


def test_map_analyzed_move_maps_all_fields() -> None:
    analyzed_move = {
        "ply_index": 0,
        "move_number": 1,
        "played_move": "e2e4",
        "best_move": "d2d4",
        "score": (Cp(25), Mate(-3)),
        "is_white": True,
        "piece": "P",
        "best_line": ["d2d4", "d7d5"],
        "played_line": ["e2e4", "e7e5"],
        "quality": QUALITY_DICT,
    }

    assert mappers.map_analyzed_move(analyzed_move) == AnalyzedMove(
        ply_index=0,
        move_number=1,
        played_move="e2e4",
        best_move="d2d4",
        score=MoveScore(
            best=ScoreValue(centipawns=25),
            played=ScoreValue(mate_in=-3),
        ),
        is_white=True,
        piece="P",
        best_line=["d2d4", "d7d5"],
        played_line=["e2e4", "e7e5"],
        quality=QUALITY_MODEL,
    )


def test_map_analyzed_game_preserves_move_order() -> None:
    analyzed_game = [
        {
            "ply_index": 0,
            "move_number": 1,
            "played_move": "e2e4",
            "best_move": None,
            "score": (Cp(20), Cp(10)),
            "is_white": True,
            "piece": "P",
            "best_line": None,
            "played_line": None,
            "quality": QUALITY_DICT,
        },
        {
            "ply_index": 1,
            "move_number": 1,
            "played_move": "e7e5",
            "best_move": "c7c5",
            "score": (Cp(-10), Cp(-30)),
            "is_white": False,
            "piece": "p",
            "best_line": ["c7c5"],
            "played_line": ["e7e5"],
            "quality": QUALITY_DICT,
        },
    ]

    result = mappers.map_analyzed_game(analyzed_game)

    assert isinstance(result, AnalyzedGame)
    assert [move.played_move for move in result.moves] == ["e2e4", "e7e5"]
    assert result.moves[1].score.played == ScoreValue(centipawns=-30)


def test_map_moves_and_board() -> None:
    board = chess.Board()
    moves = [chess.Move.from_uci("e2e4"), chess.Move.from_uci("e7e5")]

    assert mappers.map_moves(moves) == ["e2e4", "e7e5"]
    assert mappers.map_board(board) == chess.STARTING_FEN


def test_map_parse_response_maps_headers_initial_position_and_moves() -> None:
    board = chess.Board()
    response = {
        "headers": {"Event": "Test game", "Result": "*"},
        "initial_board": board,
        "moves": [chess.Move.from_uci("e2e4"), chess.Move.from_uci("e7e5")],
    }

    assert mappers.map_parse_response(response) == ParseResponse(
        headers={"Event": "Test game", "Result": "*"},
        initial_fen=chess.STARTING_FEN,
        moves=["e2e4", "e7e5"],
    )
