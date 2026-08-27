# Chess PGN Analyzer

Backend API for parsing one chess game in PGN format and analysing every played
move with Stockfish.

The project exposes a synchronous FastAPI API. It does not require LLM, Redis,
Docker, a database, or authentication.

## Requirements

- Python 3.14 or newer;
- [uv](https://docs.astral.sh/uv/) to install the locked dependencies;
- Stockfish installed and available as the `stockfish` command in `PATH`.

For macOS with Homebrew:

```bash
brew install stockfish
```

## Run locally

```bash
uv sync
uv run fastapi dev main.py
```

The API starts at `http://127.0.0.1:8000`.

Interactive OpenAPI documentation is available at:

```text
http://127.0.0.1:8000/docs
```

Run the tests:

```bash
uv run pytest -q
```

## API overview

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Health check |
| `POST` | `/parse` | Parse and validate a PGN without starting Stockfish |
| `POST` | `/analyze` | Parse a PGN and analyse each mainline move with Stockfish |

All `POST` endpoints accept the same JSON body:

```json
{
  "pgn": "1. e4 e5 2. Nf3 Nc6 *"
}
```

The submitted PGN must contain exactly one game. Comments and side variations
are accepted, but only the main line is returned and analysed.

## `GET /`

Response:

```json
{
  "status": "ok"
}
```

## `POST /parse`

Parses a game and returns data required to reconstruct it on a chessboard.

Successful response (`200`):

```json
{
  "headers": {
    "Event": "Casual Game",
    "Site": "Internet",
    "Date": "2026.08.27",
    "Round": "1",
    "White": "Alice",
    "Black": "Bob",
    "Result": "*"
  },
  "initial_fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "moves": ["e2e4", "e7e5", "g1f3", "b8c6"]
}
```

Field meanings:

- `headers`: PGN headers. `Result` is a chess result such as `1-0`, `0-1`,
  `1/2-1/2`, or `*`; it is not a player name.
- `initial_fen`: the position before the first move, in FEN format. It can be
  a custom position from PGN `SetUp` and `FEN` headers.
- `moves`: mainline moves in [UCI notation](https://www.chessprogramming.org/Algebraic_Chess_Notation#UCI_Notation), for example `e2e4`. A promotion has a
  fifth character, for example `e7e8q`.

## `POST /analyze`

Runs Stockfish before and after each played move. This endpoint is synchronous:
long games take longer because every position is analysed for 0.5 seconds.

Successful response (`200`):

```json
{
  "moves": [
    {
      "ply_index": 0,
      "move_number": 1,
      "move": "e2e4",
      "best_move": "d2d4",
      "score": {
        "best": {"centipawns": 30, "mate_in": null},
        "played": {"centipawns": 10, "mate_in": null}
      },
      "is_white": true,
      "piece": "P",
      "best_line": ["d2d4", "d7d5"],
      "played_line": ["e2e4", "e7e5"]
    }
  ]
}
```

Each item in `moves` describes one played half-move:

- `ply_index`: zero-based index matching the same element in `/parse` →
  `moves`.
- `move_number`: human chess move number. White and Black moves of the same
  turn share this number.
- `move`: the played move in UCI notation.
- `is_white`: `true` for a White move and `false` for a Black move.
- `piece`: moving piece in `python-chess` notation: uppercase for White
  (`P`, `N`, `B`, `R`, `Q`, `K`) and lowercase for Black.
- `best_move`: Stockfish's first recommended UCI move in the position before
  the played move. It can be `null` when Stockfish provides no principal
  variation.
- `best_line`: Stockfish principal variation before the played move, limited
  to eight UCI moves. It can be `null`.
- `played_line`: the actual move followed by Stockfish's principal variation
  after it, limited to eight UCI moves in total. It can be `null`, for example
  after a checkmate.
- `score.best`: Stockfish evaluation before the played move, from the point of
  view of the player who is about to move. It represents the position's best
  available outcome under optimal play.
- `score.played`: evaluation after the actual move, from the point of view of
  the player who made that move.
- `centipawns`: positional evaluation in hundredths of a pawn. A positive
  value is favourable to that item's player; a negative value is unfavourable.
- `mate_in`: forced mate distance. It is used instead of `centipawns` for a
  mating score. `0` means the checkmate has already been delivered.

For both score objects, exactly one of `centipawns` and `mate_in` is normally
present; the other is `null`.

## Error responses

Both `POST` endpoints return these validation errors:

| Status | Meaning | Example `detail` |
| --- | --- | --- |
| `400` | Empty or whitespace-only PGN | `PGN was not found.` |
| `400` | Invalid PGN syntax or more than one game | `Incorrect PGN format.` or `Only one PGN game is supported.` |
| `400` | PGN has no moves | `No moves found.` |
| `400` | Invalid initial board/FEN | `Board has incorrect format.` |
| `422` | Missing or invalid JSON field `pgn` | Standard FastAPI validation response |

If Stockfish is missing or cannot start, `/analyze` currently returns a server
error. Install Stockfish before running the API.

## Frontend integration

The API is designed for a frontend that owns board navigation:

1. Call `/parse` to receive `initial_fen` and UCI moves.
2. Create the board from `initial_fen`.
3. Apply the UCI moves in order with a chess library such as `chess.js`.
4. Call `/analyze` when move-by-move Stockfish data is needed.
5. Match an analysis item to the played move via `ply_index`.

The backend does not return a FEN for every move and does not return SAN
notation (`e4`, `Nf3`). The frontend should derive those with its chess library
if it needs to display them.

The backend does not currently configure CORS. A frontend served from another
origin, such as a Vite development server on another port, needs a development
proxy or a backend CORS configuration before browser requests will work.
