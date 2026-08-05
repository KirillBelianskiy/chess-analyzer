import pytest

from services.exceptions import (
    IncorrectPGNFormatError,
    InvalidBoardError,
    NoMovesFoundError,
    PGNValidationError,
)
from services.parser import process_and_validate_pgn


def test_correct_png_format(correct_pgn):
    result = process_and_validate_pgn(correct_pgn)

    assert "headers" in result
    assert "initial_board" in result
    assert len(result["moves"]) > 0


def test_invalid_pgn_format(incorrect_pgn):
    with pytest.raises(IncorrectPGNFormatError) as exc_info:
        process_and_validate_pgn(incorrect_pgn)

    assert str(exc_info.value).startswith("Incorrect PGN format.")


def test_pgn_no_moves(pgn_without_moves):
    with pytest.raises(NoMovesFoundError) as exc_info:
        process_and_validate_pgn(pgn_without_moves)

    assert str(exc_info.value).startswith("No moves found.")


def test_invalid_board_position(invalid_board_pgn):
    with pytest.raises(InvalidBoardError) as exc_info:
        process_and_validate_pgn(invalid_board_pgn)

    assert str(exc_info.value).startswith("Board has incorrect format.")
