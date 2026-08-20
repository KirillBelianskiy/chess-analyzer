import chess.engine
from chess import Board, Move


def step_by_step_analyzer(board: Board, moves: list[Move]) -> list[dict]:
    """This function mutates the board. Synchronous function"""
    with chess.engine.SimpleEngine.popen_uci("stockfish") as engine:
        analyse_before = engine.analyse(board, chess.engine.Limit(time=0.5))

        best_score = analyse_before["score"].pov(board.turn)
        analyzed_game = []
        for i, move in enumerate(moves):
            color = board.turn == chess.WHITE
            piece_move = move.uci()
            piece = board.piece_at(move.from_square).symbol()

            best_move = (
                analyse_before["pv"][0].uci() if "pv" in analyse_before else None
            )
            if "pv" in analyse_before:
                best_line_raw = (
                    analyse_before["pv"]
                    if len(analyse_before["pv"]) < 8
                    else analyse_before["pv"][:8]
                )
                best_line = [m.uci() for m in best_line_raw]
            else:
                best_line = None

            move_number = board.fullmove_number

            board.push(move)

            analyse_after = engine.analyse(board, chess.engine.Limit(time=0.5))

            if "pv" in analyse_after:
                played_line_raw = (
                    analyse_after["pv"]
                    if len(analyse_after["pv"]) < 7
                    else analyse_after["pv"][:7]
                )
                played_line = [move.uci()] + [m.uci() for m in played_line_raw]
            else:
                played_line = None
            played_score = analyse_after["score"].pov(color)

            analyzed_move = {
                "ply_index": i,
                "move_number": move_number,
                "move": piece_move,
                "score": (best_score, played_score),
                "is_white": color,
                "best_move": best_move,
                "best_line": best_line,
                "played_line": played_line,
                "piece": piece,
            }
            analyse_before = analyse_after
            best_score = analyse_after["score"].pov(not color)
            analyzed_game.append(analyzed_move)

        return analyzed_game
