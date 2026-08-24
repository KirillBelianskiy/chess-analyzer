import io

import chess
import chess.pgn

from services.exceptions import (
    GameNotFoundError,
    IncorrectPGNFormatError,
    InvalidBoardError,
    NoMovesFoundError,
)


def process_and_validate_pgn(pgn: str) -> dict:
    """Parse and validate a PGN containing exactly one game."""
    pgn_io = io.StringIO(pgn)
    game = chess.pgn.read_game(pgn_io)

    if game is None:
        raise GameNotFoundError("PGN was not found.")

    if chess.pgn.read_game(pgn_io) is not None:
        raise IncorrectPGNFormatError("Only one PGN game is supported.")

    default_game = chess.pgn.Game()
    is_default_headers = dict(game.headers) == dict(default_game.headers)
    moves = list(game.mainline_moves())

    if game.errors or (not moves and is_default_headers):
        raise IncorrectPGNFormatError("Incorrect PGN format.")

    board = game.board()
    if not board.is_valid():
        raise InvalidBoardError("Board has incorrect format.")

    if not moves:
        raise NoMovesFoundError("No moves found.")

    return {
        "headers": dict(game.headers),
        "initial_board": board,
        "moves": moves,
    }
