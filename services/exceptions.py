class PGNValidationError(Exception):
    pass

class IncorrectPGNFormatError(PGNValidationError):
    pass

class NoMovesFoundError(PGNValidationError):
    pass

class InvalidBoardError(PGNValidationError):
    pass