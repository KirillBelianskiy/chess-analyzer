from unittest.mock import MagicMock

import chess
from chess.engine import Cp
from fastapi.testclient import TestClient

import api.router as router_module


def test_healthcheck(client: TestClient) -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_parse_correct_pgn_returns_parsed_game(client: TestClient, correct_pgn: str) -> None:
    response = client.post("/parse", json={"pgn": correct_pgn})

    assert response.status_code == 200
    assert response.json() == {
        "headers": {
            "Event": "Scholar's Mate",
            "Site": "Local",
            "Date": "2026.08.01",
            "Round": "1",
            "White": "Player A",
            "Black": "Player B",
            "Result": "1-0",
        },
        "initial_fen": chess.STARTING_FEN,
        "moves": [
            "e2e4",
            "e7e5",
            "d1h5",
            "b8c6",
            "f1c4",
            "g8f6",
            "h5f7",
        ],
    }


def test_parse_empty_pgn_returns_400(client: TestClient, empty_pgn: str) -> None:
    response = client.post("/parse", json={"pgn": empty_pgn})

    assert response.status_code == 400
    assert response.json() == {"detail": "PGN was not found."}


def test_parse_incorrect_pgn_returns_400(client: TestClient, incorrect_pgn: str) -> None:
    response = client.post("/parse", json={"pgn": incorrect_pgn})

    assert response.status_code == 400
    assert response.json() == {"detail": "Incorrect PGN format."}


def test_parse_pgn_without_moves_returns_400(client: TestClient, pgn_without_moves: str) -> None:
    response = client.post("/parse", json={"pgn": pgn_without_moves})

    assert response.status_code == 400
    assert response.json() == {"detail": "No moves found."}


def test_parse_invalid_board_returns_400(client: TestClient, invalid_board_pgn: str) -> None:
    response = client.post("/parse", json={"pgn": invalid_board_pgn})

    assert response.status_code == 400
    assert response.json() == {"detail": "Board has incorrect format."}


def test_parse_without_pgn_field_returns_422(client: TestClient) -> None:
    response = client.post("/parse", json={})

    assert response.status_code == 422


def test_analyze_correct_pgn_returns_analyzed_game(client: TestClient, monkeypatch) -> None:
    analyzer_mock = MagicMock(
        return_value=[
            {
                "ply_index": 0,
                "move_number": 1,
                "move": "e2e4",
                "best_move": "d2d4",
                "score": (Cp(30), Cp(10)),
                "is_white": True,
                "piece": "P",
                "best_line": ["d2d4", "d7d5"],
                "played_line": ["e2e4", "e7e5"],
            }
        ]
    )
    monkeypatch.setattr(router_module, "analyzer", analyzer_mock)

    response = client.post("/analyze", json={"pgn": "1. e4 *"})

    assert response.status_code == 200
    assert response.json() == {
        "moves": [
            {
                "ply_index": 0,
                "move_number": 1,
                "move": "e2e4",
                "best_move": "d2d4",
                "score": {
                    "best": {"centipawns": 30, "mate_in": None},
                    "played": {"centipawns": 10, "mate_in": None},
                },
                "is_white": True,
                "piece": "P",
                "best_line": ["d2d4", "d7d5"],
                "played_line": ["e2e4", "e7e5"],
            }
        ]
    }
    analyzer_mock.assert_called_once()
    board, moves = analyzer_mock.call_args.args
    assert board.fen() == chess.STARTING_FEN
    assert [move.uci() for move in moves] == ["e2e4"]


def test_analyze_empty_pgn_returns_400(client: TestClient, empty_pgn: str) -> None:
    response = client.post("/analyze", json={"pgn": empty_pgn})

    assert response.status_code == 400
    assert response.json() == {"detail": "PGN was not found."}


def test_analyze_incorrect_pgn_returns_400(client: TestClient, incorrect_pgn: str) -> None:
    response = client.post("/analyze", json={"pgn": incorrect_pgn})

    assert response.status_code == 400
    assert response.json() == {"detail": "Incorrect PGN format."}


def test_analyze_pgn_without_moves_returns_400(client: TestClient, pgn_without_moves: str) -> None:
    response = client.post("/analyze", json={"pgn": pgn_without_moves})

    assert response.status_code == 400
    assert response.json() == {"detail": "No moves found."}


def test_analyze_invalid_board_returns_400(client: TestClient, invalid_board_pgn: str) -> None:
    response = client.post("/analyze", json={"pgn": invalid_board_pgn})

    assert response.status_code == 400
    assert response.json() == {"detail": "Board has incorrect format."}


def test_analyze_without_pgn_field_returns_422(client: TestClient) -> None:
    response = client.post("/analyze", json={})

    assert response.status_code == 422
