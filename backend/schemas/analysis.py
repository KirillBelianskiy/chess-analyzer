from pydantic import BaseModel


class ScoreValue(BaseModel):
    centipawns: int | None = None
    mate_in: int | None = None


class MoveScore(BaseModel):
    best: ScoreValue
    played: ScoreValue


class AnalyzedMove(BaseModel):
    ply_index: int
    move_number: int
    move: str
    best_move: str | None
    score: MoveScore
    is_white: bool
    piece: str
    best_line: list[str] | None = None
    played_line: list[str] | None = None


class AnalyzedGame(BaseModel):
    moves: list[AnalyzedMove]
