from pydantic import BaseModel


class ScoreValue(BaseModel):
    centipawns: int | None = None
    mate_in: int | None = None


class MoveScore(BaseModel):
    best: ScoreValue
    played: ScoreValue

class WDL(BaseModel):
    win: float
    draw: float
    loss: float
    
class Quality(BaseModel):
    best_wdl: WDL
    played_wdl: WDL
    played_expectation: int | float
    best_expectation: int | float
    expectation_loss: float
    cp_loss: float | None
    classification: str


class AnalyzedMove(BaseModel):
    ply_index: int
    move_number: int
    played_move: str
    score: MoveScore
    best_move: str | None
    best_line: list[str] | None = None
    is_white: bool
    piece: str
    played_line: list[str] | None = None
    quality: Quality


class AnalyzedGame(BaseModel):
    moves: list[AnalyzedMove]
