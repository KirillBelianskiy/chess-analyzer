from fastapi import APIRouter, HTTPException

from api.mappers import map_analyzed_game, map_parse_response
from schemas.analysis import AnalyzedGame
from schemas.parse import ParseResponse, PGNGameRequest
from services import exceptions
from services.analyzer import analyzer, wdl_counting
from services.parser import process_and_validate_pgn


def check_and_validate_pgn(pgn: str) -> dict:
    try:
        parse_pgn = process_and_validate_pgn(pgn)
    except exceptions.GameNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except exceptions.IncorrectPGNFormatError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except exceptions.NoMovesFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except exceptions.InvalidBoardError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return parse_pgn


router = APIRouter()


@router.get("/")
def main_page() -> dict:
    return {"status": "ok"}


@router.post("/parse")
def parse(body: PGNGameRequest) -> ParseResponse:
    pgn = body.pgn
    parsed_pgn = check_and_validate_pgn(pgn)

    return map_parse_response(parsed_pgn)


@router.post("/analyze")
def analyze(body: PGNGameRequest) -> AnalyzedGame:
    pgn = body.pgn
    parsed_pgn = check_and_validate_pgn(pgn)

    analyzed_game = analyzer(parsed_pgn["initial_board"], parsed_pgn["moves"])
    analyzed_game_with_wdl = wdl_counting(analyzed_game)
    return map_analyzed_game(analyzed_game_with_wdl)
