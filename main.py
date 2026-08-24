from fastapi import FastAPI, HTTPException

from api.mappers import map_analyzed_game, map_parse_response
from schemas.analysis import AnalyzedGame
from schemas.parse import ParseResponse, PGNGameRequest
from services import exceptions
from services.analyzer import step_by_step_analyzer
from services.parser import process_and_validate_pgn

app = FastAPI()


@app.get("/")
def main_page() -> dict:
    return {"status": "ok"}


@app.post("/parse")
def parse(pgn: PGNGameRequest) -> ParseResponse:
    pgn = pgn.pgn
    try:
        parse_pgn = process_and_validate_pgn(pgn)
    # TODO: для каждой ошибки подумать, какой код она должна возвращать
    except exceptions.IncorrectPGNFormatError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except exceptions.NoMovesFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except exceptions.InvalidBoardError as e:
        raise HTTPException(status_code=400, detail=str(e))


    return map_parse_response(parse_pgn)


@app.post("/analyze")
def analyze(pgn: PGNGameRequest) -> AnalyzedGame:
    pgn = pgn.pgn
    try:
        parse_pgn = process_and_validate_pgn(pgn)
    # TODO: для каждой ошибки подумать, какой код она должна возвращать
    except exceptions.IncorrectPGNFormatError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except exceptions.NoMovesFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except exceptions.InvalidBoardError as e:
        raise HTTPException(status_code=400, detail=str(e))

    analyzed_game = step_by_step_analyzer(
        parse_pgn["initial_board"], parse_pgn["moves"]
    )
    return map_analyzed_game(analyzed_game)
