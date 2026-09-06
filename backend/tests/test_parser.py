import pytest

from services.exceptions import (
    GameNotFoundError,
    IncorrectPGNFormatError,
    InvalidBoardError,
    NoMovesFoundError,
)
from services.parser import process_and_validate_pgn


def test_correct_pgn_format(correct_pgn):
    result = process_and_validate_pgn(correct_pgn)

    assert result["headers"] == {
        "Event": "Scholar's Mate",
        "Site": "Local",
        "Date": "2026.08.01",
        "Round": "1",
        "White": "Player A",
        "Black": "Player B",
        "Result": "1-0",
    }
    assert [move.uci() for move in result["moves"]] == [
        "e2e4",
        "e7e5",
        "d1h5",
        "b8c6",
        "f1c4",
        "g8f6",
        "h5f7",
    ]


def test_invalid_pgn_format(incorrect_pgn):
    with pytest.raises(IncorrectPGNFormatError) as exc_info:
        process_and_validate_pgn(incorrect_pgn)

    assert str(exc_info.value).startswith("Incorrect PGN format.")


def test_pgn_with_error_in_middle_is_rejected(pgn_with_error_in_middle):
    with pytest.raises(IncorrectPGNFormatError):
        process_and_validate_pgn(pgn_with_error_in_middle)


def test_multiple_games_are_rejected(pgn_with_multiple_games):
    with pytest.raises(IncorrectPGNFormatError, match="Only one PGN game"):
        process_and_validate_pgn(pgn_with_multiple_games)


def test_pgn_no_moves(pgn_without_moves):
    with pytest.raises(NoMovesFoundError) as exc_info:
        process_and_validate_pgn(pgn_without_moves)

    assert str(exc_info.value).startswith("No moves found.")


def test_invalid_board_position(invalid_board_pgn):
    with pytest.raises(InvalidBoardError) as exc_info:
        process_and_validate_pgn(invalid_board_pgn)

    assert str(exc_info.value).startswith("Board has incorrect format.")


def test_custom_fen_position_is_used_as_initial_board(pgn_with_custom_fen):
    result = process_and_validate_pgn(pgn_with_custom_fen)

    assert result["initial_board"].fen() == (
        "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"
    )
    assert [move.uci() for move in result["moves"]] == ["f1b5", "a7a6"]


def test_comments_and_variations_do_not_change_mainline_moves(
    pgn_with_comments_and_variations,
):
    result = process_and_validate_pgn(pgn_with_comments_and_variations)

    assert result["headers"] == {
        "Event": "Annotated game",
        "Site": "Internet",
        "Date": "2026.08.24",
        "Round": "5",
        "White": "Alice",
        "Black": "Bob",
        "Result": "*",
    }
    assert [move.uci() for move in result["moves"]] == [
        "e2e4",
        "e7e5",
        "g1f3",
        "b8c6",
        "f1b5",
        "a7a6",
    ]


def test_empty_input_has_no_game():
    with pytest.raises(GameNotFoundError, match="PGN was not found"):
        process_and_validate_pgn("")
