import pytest


@pytest.fixture
def correct_pgn():
    return """
1. e4 e5
2. Qh5 Nc6
3. Bc4 Nf6
4. Qxf7# 1-0
"""


@pytest.fixture
def incorrect_pgn():
    return "a random text which is not a PGN"


@pytest.fixture
def pgn_without_moves():
    return """
[Event "Test Game"]
[Site "Local"]
[Date "2026.08.01"]
[Round "1"]
[White "Player A"]
[Black "Player B"]
[Result "*"]\n
*
"""


@pytest.fixture
def invalid_board_pgn():
    return """[Event "Invalid Position"]
[SetUp "1"]
[FEN "8/8/8/8/8/8/8/8 w - - 0 1"]
[Result "*"]\n
*
"""
