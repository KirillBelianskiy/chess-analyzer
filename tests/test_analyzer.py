from unittest.mock import MagicMock

import chess
from chess.engine import Cp, MateGiven, PovScore

from services.analyzer import step_by_step_analyzer


def test_single_move(engine_mock: MagicMock) -> None:
    analyse_before = {
        "score": PovScore(Cp(50), chess.WHITE),
        "pv": [
            chess.Move.from_uci("e2e4"),
            chess.Move.from_uci("e7e5"),
        ],
    }

    analyse_after = {
        "score": PovScore(Cp(-30), chess.BLACK),
        "pv": [
            chess.Move.from_uci("g8f6"),
            chess.Move.from_uci("c2c4"),
        ],
    }

    engine_mock.analyse.side_effect = [
        analyse_before,
        analyse_after,
    ]

    board = chess.Board()
    moves = [
        chess.Move.from_uci("d2d4"),
    ]

    result = step_by_step_analyzer(board, moves, engine_mock)

    assert len(result) == 1

    analyzed_move = result[0]

    assert analyzed_move["ply_index"] == 0
    assert analyzed_move["move_number"] == 1
    assert analyzed_move["move"] == "d2d4"
    assert analyzed_move["is_white"] is True
    assert analyzed_move["piece"] == "P"

    assert analyzed_move["best_move"] == "e2e4"
    assert analyzed_move["best_line"] == ["e2e4", "e7e5"]
    assert analyzed_move["played_line"] == ["d2d4", "g8f6", "c2c4"]

    assert analyzed_move["score"] == (
        Cp(50),
        Cp(30),
    )


def test_two_moves_switches_pov(engine_mock: MagicMock) -> None:
    analyse_before_1st_move = {
        "score": PovScore(Cp(50), chess.WHITE),
        "pv": [
            chess.Move.from_uci("b1c3"),
            chess.Move.from_uci("g8f6"),
        ],
    }

    analyse_after_1st_move = {
        "score": PovScore(Cp(-30), chess.BLACK),
        "pv": [
            chess.Move.from_uci("g8f6"),
            chess.Move.from_uci("b1c3"),
        ],
    }

    analyse_after_2nd_move = {
        "score": PovScore(Cp(70), chess.WHITE),
        "pv": [
            chess.Move.from_uci("g1f3"),
            chess.Move.from_uci("b8c6"),
        ],
    }

    moves = [
        chess.Move.from_uci("e2e4"),
        chess.Move.from_uci("e7e5"),
    ]

    board = chess.Board()
    engine_mock.analyse.side_effect = [
        analyse_before_1st_move,
        analyse_after_1st_move,
        analyse_after_2nd_move,
    ]

    result = step_by_step_analyzer(board, moves, engine_mock)

    assert len(result) == 2

    analyzed_move1 = result[0]
    assert analyzed_move1["ply_index"] == 0
    assert analyzed_move1["move_number"] == 1
    assert analyzed_move1["move"] == "e2e4"
    assert analyzed_move1["is_white"] is True
    assert analyzed_move1["best_move"] == "b1c3"
    assert analyzed_move1["best_line"] == ["b1c3", "g8f6"]
    assert analyzed_move1["played_line"] == ["e2e4", "g8f6", "b1c3"]

    assert analyzed_move1["score"] == (
        Cp(50),
        Cp(30),
    )

    analyzed_move2 = result[1]
    assert analyzed_move2["ply_index"] == 1
    assert analyzed_move2["move_number"] == 1
    assert analyzed_move2["move"] == "e7e5"
    assert analyzed_move2["is_white"] is False
    assert analyzed_move2["best_move"] == "g8f6"
    assert analyzed_move2["best_line"] == ["g8f6", "b1c3"]
    assert analyzed_move2["played_line"] == ["e7e5", "g1f3", "b8c6"]

    assert analyzed_move2["score"] == (
        Cp(-30),
        Cp(-70),
    )


def test_custom_initial_position(engine_mock: MagicMock) -> None:
    board = chess.Board("4k3/8/8/8/8/8/8/4K3 b - - 0 42")
    moves = [chess.Move.from_uci("e8e7")]
    engine_mock.analyse.side_effect = [
        {"score": PovScore(Cp(15), chess.BLACK), "pv": [moves[0]]},
        {"score": PovScore(Cp(10), chess.WHITE), "pv": [chess.Move.from_uci("e1e2")]},
    ]

    result = step_by_step_analyzer(board, moves, engine_mock)

    assert result[0]["move_number"] == 42
    assert result[0]["is_white"] is False
    assert result[0]["piece"] == "k"
    assert result[0]["score"] == (Cp(15), Cp(-10))


def test_mate_given_without_pv_after_checkmate(engine_mock: MagicMock) -> None:
    board = chess.Board(
        "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4"
    )
    moves = [chess.Move.from_uci("h5f7")]
    engine_mock.analyse.side_effect = [
        {"score": PovScore(Cp(800), chess.WHITE), "pv": [moves[0]]},
        {"score": PovScore(MateGiven, chess.WHITE)},
    ]

    result = step_by_step_analyzer(board, moves, engine_mock)

    assert board.is_checkmate()
    assert result[0]["score"] == (Cp(800), MateGiven)
    assert result[0]["played_line"] is None


def test_without_pv(engine_mock: MagicMock) -> None:
    board = chess.Board()
    moves = [chess.Move.from_uci("e2e4")]
    engine_mock.analyse.side_effect = [
        {"score": PovScore(Cp(10), chess.WHITE)},
        {"score": PovScore(Cp(-5), chess.BLACK)},
    ]

    result = step_by_step_analyzer(board, moves, engine_mock)

    assert result[0]["best_move"] is None
    assert result[0]["best_line"] is None
    assert result[0]["played_line"] is None


def test_truncates_pv(engine_mock: MagicMock) -> None:
    board = chess.Board()
    move = chess.Move.from_uci("e2e4")
    long_pv = [chess.Move.from_uci("a2a3")] * 9
    engine_mock.analyse.side_effect = [
        {"score": PovScore(Cp(10), chess.WHITE), "pv": long_pv},
        {"score": PovScore(Cp(-5), chess.BLACK), "pv": long_pv},
    ]

    result = step_by_step_analyzer(board, [move], engine_mock)

    assert len(result[0]["best_line"]) == 8
    assert len(result[0]["played_line"]) == 8
    assert result[0]["played_line"][0] == "e2e4"


def test_mutates_board(engine_mock: MagicMock) -> None:
    board = chess.Board()
    expected_board = board.copy()
    moves = [chess.Move.from_uci("e2e4"), chess.Move.from_uci("e7e5")]
    for move in moves:
        expected_board.push(move)

    engine_mock.analyse.side_effect = [
        {"score": PovScore(Cp(0), chess.WHITE), "pv": [moves[0]]},
        {"score": PovScore(Cp(0), chess.BLACK), "pv": [moves[1]]},
        {"score": PovScore(Cp(0), chess.WHITE), "pv": [chess.Move.from_uci("g1f3")]},
    ]

    step_by_step_analyzer(board, moves, engine_mock)

    assert board.fen() == expected_board.fen()
