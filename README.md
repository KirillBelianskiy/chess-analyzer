# Moves analyzer

Локальное веб-приложение для разбора шахматных партий в PGN и пошагового
анализа ходов через Stockfish. Проект разделён на два независимых приложения:
`backend/` с API и `frontend/` с интерфейсом.

## Что реализовано

### Backend

- FastAPI API с `GET /`, `POST /parse` и `POST /analyze`.
- Проверка PGN: одна партия, корректная позиция, наличие ходов и корректный
  основной вариант партии.
- Поддержка начальной позиции из заголовков `SetUp`/`FEN`, комментариев и
  вариантов PGN; для интерфейса используется только mainline.
- Преобразование ходов в UCI и возврат исходного FEN, заголовков и ходов.
- Синхронный Stockfish-анализ до и после каждого полухода: оценка,
  лучший ход, лучшая линия и линия после сыгранного хода.
- WDL-вероятности, expectation, centipawn loss и готовая классификация каждого
  хода: `best`, `excellent`, `good`, `inaccuracy`, `mistake` или `blunder`.
- HTTP-ошибки для некорректного PGN (`400`) и некорректного тела запроса
  (`422`).
- Тесты parser, mapper, analyzer и API.

### Frontend

- Вставка PGN в поле или загрузка `.pgn`-файла.
- Светлая и тёмная темы с адаптивной трёхпанельной компоновкой рабочего экрана.
- Доска с SVG-фигурами cburnett, одинаковыми клетками и восстановлением
  позиции из FEN и UCI-ходов через `chess.js`.
- Навигация по ходам кнопками, кликом по списку, а также клавишами
  `←`, `→`, `Home` и `End`.
- SAN-представление ходов, evaluation bar, WDL и блок с сыгранным и лучшим
  ходом.
- Цветной глиф качества в системе Lichess над фигурой, сделавшей выбранный ход,
  и интерактивный график ожидаемого результата белых в стиле chess.com с
  отметками значимых ходов и переходом к любому полуходу.
- Жёлтая подсветка последнего хода, зелёная клетка назначения следующего хода,
  светло-серая стрелка PGN и светло-синяя стрелка лучшего хода Stockfish.
- Переворот доски для просмотра партии со стороны белых или чёрных.
- Состояния загрузки и понятные сообщения о сетевых и HTTP-ошибках.
- Интерфейс намеренно не показывает фиктивный LLM-чат: backend пока не
  предоставляет endpoint для него.
- Тесты frontend-логики: рокировка, превращение, взятие на проходе,
  FEN, оценки и ошибки API.

## Технологии

| Часть | Технологии |
| --- | --- |
| Backend | Python 3.14+, FastAPI, Uvicorn, Pydantic Settings, python-chess, Stockfish, pytest, uv |
| Frontend | React 19, TypeScript, Vite, chess.js, CSS |
| Интеграция | Vite development proxy для `/parse` и `/analyze` |

В `backend/pyproject.toml` также объявлены PostgreSQL/Redis-зависимости для
будущего развития, но текущая версия не использует базу данных, Redis,
авторизацию или LLM.

## Контракт анализа

`POST /analyze` принимает тот же JSON, что и `/parse`:

```json
{
  "pgn": "1. e4 e5 2. Nf3 *"
}
```

Каждый элемент `moves` содержит UCI-ход в `played_move`, `best_move`, оценки
`score.best` и `score.played`, варианты `best_line` и `played_line`, а также
объект `quality`:

```json
{
  "played_move": "g1f3",
  "quality": {
    "best_wdl": { "win": 0.42, "draw": 0.43, "loss": 0.15 },
    "played_wdl": { "win": 0.4, "draw": 0.44, "loss": 0.16 },
    "best_expectation": 0.635,
    "played_expectation": 0.62,
    "expectation_loss": 0.015,
    "cp_loss": 8,
    "classification": "excellent"
  }
}
```

WDL и expectation приходят с точки зрения игрока, сделавшего ход. Интерфейс
нормализует их к перспективе белых. `cp_loss` может быть `null` при матовой
оценке; frontend не пересчитывает оценки и классификацию самостоятельно.

## Требования

- Python 3.14 или новее;
- [uv](https://docs.astral.sh/uv/);
- Node.js 22.18 или новее и npm;
- Stockfish, доступный в `PATH` под именем `stockfish`.

На macOS с Homebrew Stockfish устанавливается так:

```bash
brew install stockfish
```

Проверить установку можно командой:

```bash
stockfish
```

Для выхода из интерактивного Stockfish введите `quit`.

## Запуск проекта

Откройте два терминала из корня репозитория.

### 1. Запустите backend

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API будет доступен по адресу [http://127.0.0.1:8000](http://127.0.0.1:8000),
а Swagger/OpenAPI — по адресу [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 2. Запустите frontend

```bash
cd frontend
npm ci
npm run dev
```

Откройте [http://127.0.0.1:5173](http://127.0.0.1:5173).

Vite перенаправляет запросы `/parse` и `/analyze` на
`http://127.0.0.1:8000`, поэтому CORS-настройка для локальной разработки не
нужна.

Чтобы остановить серверы, нажмите `Ctrl+C` в каждом терминале.

## Проверки и production-сборка

Backend:

```bash
cd backend
uv run pytest -q
```

Frontend:

```bash
cd frontend
npm test
npm run build
```

Production-сборка появится в `frontend/dist/`. Эта папка не должна попадать в
Git: она уже добавлена в `.gitignore`.

## API

| Метод | Путь | Назначение |
| --- | --- | --- |
| `GET` | `/` | Проверка доступности API |
| `POST` | `/parse` | Валидация PGN и построение таймлайна партии |
| `POST` | `/analyze` | Анализ всех полуходов через Stockfish |

Оба POST-запроса принимают JSON:

```json
{
  "pgn": "1. e4 e5 2. Nf3 Nc6 *"
}
```

`/parse` возвращает `headers`, `initial_fen` и массив UCI-ходов `moves`.
`/analyze` возвращает массив `moves`; для каждого полухода есть UCI сыгранного
и лучшего хода, оценка до и после, сторона, фигура и principal variations.

Анализ синхронный. Длинная партия выполняется дольше, потому что Stockfish
оценивает позиции перед и после каждого хода.

## Структура репозитория

```text
chess-analyzer/
├── backend/
│   ├── api/          # FastAPI маршруты и мапперы ответов
│   ├── core/         # настройки приложения
│   ├── schemas/      # Pydantic-схемы запросов и ответов
│   ├── services/     # PGN parser и Stockfish analyzer
│   └── tests/        # backend-тесты
├── frontend/
│   ├── public/       # SVG-фигуры cburnett и лицензия
│   ├── src/          # React-компоненты, API-клиент, chess-логика и стили
│   └── tests/        # frontend-тесты
└── README.md
```
