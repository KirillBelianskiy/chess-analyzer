from pydantic import BaseModel


class PGNGameRequest(BaseModel):
    pgn: str


class ParseResponse(BaseModel):
    headers: dict[str, str]
    initial_fen: str
    moves: list[str]
