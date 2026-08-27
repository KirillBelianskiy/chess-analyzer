from unittest.mock import MagicMock

import chess
import chess.engine
import pytest


@pytest.fixture
def correct_pgn():
    return """[Event "Scholar's Mate"]
[Site "Local"]
[Date "2026.08.01"]
[Round "1"]
[White "Player A"]
[Black "Player B"]
[Result "1-0"]

1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0
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


@pytest.fixture
def pgn_with_error_in_middle():
    return "1. e4 e5 2. Nf3 Nc6 3. NotAMove a6 1-0"


@pytest.fixture
def pgn_with_custom_fen():
    return """[Event "Custom position"]
[SetUp "1"]
[FEN "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"]

3. Bb5 a6 *
"""


@pytest.fixture
def pgn_with_multiple_games():
    return """[Event "First game"]

1. e4 e5 1-0

[Event "Second game"]

1. d4 d5 0-1
"""


@pytest.fixture
def pgn_with_comments_and_variations():
    return """[Event "Annotated game"]
[Site "Internet"]
[Date "2026.08.24"]
[Round "5"]
[White "Alice"]
[Black "Bob"]
[Result "*"]

1. e4 {King's pawn opening} e5 (1... c5 {Sicilian Defence})
2. Nf3 Nc6 3. Bb5 a6 *
"""


@pytest.fixture
def engine_mock() -> MagicMock:
    return MagicMock(spec=chess.engine.SimpleEngine)
