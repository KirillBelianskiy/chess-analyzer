# Chess Analyzer

A learning project for reviewing chess games with Stockfish and a Python API.
The goal is a complete web MVP that connects game review, persistent user data, and explanations of selected moves.

**Status:** the PGN parsing and Stockfish analysis backend is implemented. The full MVP is in progress.
The published frontend currently cannot pass its tests or build because several imported modules are missing from the repository.

## What the Completed MVP Will Do

A player will be able to register, sign in, import a PGN game, save it, run Stockfish analysis, and revisit the results.
While browsing moves, the player will ask why a move is weaker than Stockfish's alternative and receive an explanation in one shared conversation for that game.

The planned end-to-end flow is:

`Sign up → Sign in → Import PGN → Save game → Analyze → Select a move → Ask a question → Revisit the saved conversation`

| Area | Target MVP behavior | Current public implementation |
| --- | --- | --- |
| Game input | Validate a PGN and create an owned, saved game | Parsing and validation API implemented; persistence pending |
| Engine review | Analyze moves and save one result per game | Synchronous Stockfish analysis implemented; saved results pending |
| Interactive review | Browse positions, evaluations, and engine lines | React UI source present; tests and build blocked by missing modules |
| Accounts | Registration, password hashing, sign-in, and JWT authentication | Planned; no authentication endpoints |
| Storage | PostgreSQL stores users, PGN games, analysis, and chat messages | Dependencies declared; application storage not implemented |
| Move explanations | Game-level chat grounded in stored engine analysis | Planned; no LLM endpoint or provider integration |
| Async I/O | Async database, LLM, and engine communication | Planned; current engine calls use synchronous `SimpleEngine` |
| Packaging | Frontend, backend, and PostgreSQL start through Docker Compose | Planned; no application Docker/Compose setup in public main |

These are completion criteria, not claims that the full MVP is already available.

## Already Implemented

### Backend

- FastAPI routes for service availability, PGN parsing, and game analysis.
- Validation of exactly one game, a legal starting position, a non-empty move sequence, and a valid main line.
- Support for custom starting positions through PGN `SetUp`/`FEN` headers.
- Parsing of headers and main-line moves into an initial FEN and ordered UCI moves. Comments and side variations are accepted but not included in the review timeline.
- Stockfish evaluations before and after each ply, the best move, and principal variations.
- Win/draw/loss estimates, expected score, centipawn loss, and move classifications:
  `best`, `excellent`, `good`, `inaccuracy`, `mistake`, and `blunder`.
- Structured Pydantic responses; HTTP `400` for invalid PGN and `422` for invalid request bodies.
- Tests for parsing, response mapping, engine analysis, and API behavior.

### Frontend Source

The committed React source includes PGN text/file input, board reconstruction with `chess.js`, SAN move lists, keyboard navigation, board flipping, light/dark themes, move highlighting, engine arrows, and an analysis inspector.

However, the public checkout imports files that are not committed:

- `frontend/src/chess/moveQuality.ts`
- `frontend/src/components/ExpectationChart.tsx`
- `frontend/src/components/MoveGrade.tsx`
- `frontend/src/components/WdlBar.tsx`

Until these files are restored, the frontend is not reproducibly runnable from the public repository.
The evaluation chart, move-grade markers, and WDL display must not be treated as verified working features of this checkout.

## Planned MVP Design

### Persistence

The intended data model has four entities:

| Entity | Purpose |
| --- | --- |
| User | Identity, unique login/email, and a password hash |
| Game | Owner, original PGN, and creation time |
| Analysis | One saved Stockfish result per game, stored as JSONB with engine settings |
| Chat message | Game, role, text, selected ply, and creation time |

The original PGN will remain the source of truth; headers, the initial FEN, and moves can be reconstructed by the parser.
The analysis result is an intentional document snapshot, rather than a claim of fully normalized per-move storage.
Chat messages will be separate rows, forming one conversation per game.

### Explanations Grounded in Engine Output

For a question about a selected move, the backend will collect the position, the previous/current/next plies where available, their evaluations, and Stockfish's recommended continuation.
It will attach that context to the LLM request and save the question and answer in the game's conversation.

Stockfish will supply the chess evaluation; the LLM will explain it.
Providing engine context is intended to reduce unsupported explanations, but does not guarantee that a language model is correct.
The provider and model are not yet selected.

### Async and Deployment

The target is async communication with PostgreSQL, the LLM service, and the Stockfish process.
For the initial MVP, analysis will remain a request that waits for the result; a background job queue is not part of the agreed scope.

The planned Compose setup runs the frontend, backend, and PostgreSQL.
A local model, if selected, may run as a separate host service.
Authentication and ownership checks must protect each user's games, analysis, and messages.

## Current Tech Stack

| Layer | Implemented tools |
| --- | --- |
| Backend | Python 3.13+, FastAPI, Pydantic, Uvicorn |
| Chess analysis | python-chess, Stockfish |
| Frontend source | React 19, TypeScript, Vite, chess.js, CSS |
| Tests and tooling | pytest, Node.js test runner, uv, npm |

PostgreSQL drivers, SQLAlchemy, and Alembic are declared dependencies, but are not integrated into the current public application.
Docker, authentication, and LLM integration belong to the planned MVP.

## Run the Analysis Backend

Requirements: Python 3.13+, [uv](https://docs.astral.sh/uv/), and a Stockfish executable on `PATH` named `stockfish`.
The analyzer currently uses that executable name directly.

On macOS with Homebrew:

```bash
brew install stockfish
```

From the repository root:

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API: [http://127.0.0.1:8000](http://127.0.0.1:8000)
OpenAPI documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Frontend Development

The following commands become usable after restoring the missing frontend modules.
Use Node.js 22.18+ and npm.

```bash
cd frontend
npm ci
npm run dev
```

The development UI uses [http://127.0.0.1:5173](http://127.0.0.1:5173).
Vite proxies `/parse` and `/analyze` to the local backend; this is development routing, not a production deployment configuration.

## Current API

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/` | Returns service availability |
| POST | `/parse` | Validates PGN; returns headers, initial FEN, and UCI moves |
| POST | `/analyze` | Returns Stockfish analysis for the main-line plies |

Example request:

```bash
curl -X POST http://127.0.0.1:8000/analyze \
  -H 'Content-Type: application/json' \
  --data '{"pgn":"1. e4 e5 2. Nf3 *"}'
```

Each analyzed move includes `ply_index`, `played_move`, `best_move`, `score.best`, `score.played`, `best_line`, `played_line`, and `quality`.
The quality object contains WDL, expected-score measures, win-probability loss, centipawn loss, and classification.
Values are relative to the player who made the move; the UI source converts display values to White's perspective.
Centipawn loss may be `null` for mate evaluations. Actual engine results depend on the engine version and analysis settings.

## Validation and Known Limits

```bash
cd backend
uv run pytest -q
```

Frontend checks, after restoring the missing modules:

```bash
cd frontend
npm test
npm run build
```

On 13 October 2026, the public source was checked in an isolated checkout using existing local dependency environments:
backend tests passed and a short PGN was successfully analyzed through the API with a real Stockfish process.
Frontend tests and the TypeScript build failed on the missing modules listed above.
This is local verification, not a clean-install guarantee or a remote CI result.

- Analysis is synchronous and performs engine work during the request. Longer games take more time; async engine integration and resource limits remain future work.
- Only one game's main line is reviewed at a time.
- There is no user authentication, persistent game library, saved analysis, or LLM chat in public main.
- The full MVP has not been completed or deployed.

## Repository Layout

```text
backend/
  app/
    api/          # Routes and response mapping
    core/         # Settings
    schemas/      # API request and response models
    services/     # PGN parser and Stockfish analysis
    db/           # Storage placeholder in public main
    main.py       # FastAPI entry point
  tests/
frontend/
  src/            # React interface, client, and chess display logic
  public/pieces/  # cburnett SVG assets and license notices
  tests/
```

## Learning Goals

This project is a way to practice Python backend engineering: API contracts, validation, engine integration, relational data modeling, authentication, async I/O, testing, and reproducible packaging.
The current implementation and the future MVP scope are kept separate so that each completed step can be demonstrated and explained.
