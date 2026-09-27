import type { AnalyzeResponse, ParseResponse } from '../types/chess'

export class ChessApiError extends Error {
  status: number | null

  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = 'ChessApiError'
    this.status = status
  }
}

function detailFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('detail' in body)) return null
  const detail = (body as { detail: unknown }).detail
  return typeof detail === 'string' ? detail : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value)
}

function isStringArrayOrNull(value: unknown): value is string[] | null {
  return value === null || (Array.isArray(value) && value.every((item) => typeof item === 'string'))
}

function isScore(value: unknown) {
  return isRecord(value) && isNullableNumber(value.centipawns) && isNullableNumber(value.mate_in)
}

function isWdl(value: unknown) {
  return isRecord(value) && isFiniteNumber(value.win) && isFiniteNumber(value.draw) && isFiniteNumber(value.loss)
}

function isQuality(value: unknown) {
  return isRecord(value)
    && isWdl(value.best_wdl)
    && isWdl(value.played_wdl)
    && isFiniteNumber(value.played_expectation)
    && isFiniteNumber(value.best_expectation)
    && isFiniteNumber(value.expectation_loss)
    && isFiniteNumber(value.win_probability_loss)
    && isNullableNumber(value.cp_loss)
    && typeof value.classification === 'string'
}

function isParseResponse(value: unknown): value is ParseResponse {
  if (!isRecord(value) || !isRecord(value.headers) || typeof value.initial_fen !== 'string') return false
  if (!Array.isArray(value.moves) || !value.moves.every((move) => typeof move === 'string')) return false
  return Object.values(value.headers).every((header) => typeof header === 'string')
}

function isAnalyzeResponse(value: unknown): value is AnalyzeResponse {
  if (!isRecord(value) || !Array.isArray(value.moves)) return false
  return value.moves.every((move) => isRecord(move)
    && Number.isInteger(move.ply_index)
    && Number.isInteger(move.move_number)
    && typeof move.played_move === 'string'
    && (move.best_move === null || typeof move.best_move === 'string')
    && isRecord(move.score)
    && isScore(move.score.best)
    && isScore(move.score.played)
    && isQuality(move.quality)
    && typeof move.is_white === 'boolean'
    && typeof move.piece === 'string'
    && isStringArrayOrNull(move.best_line)
    && isStringArrayOrNull(move.played_line))
}

async function postPgn<T>(path: '/parse' | '/analyze', pgn: string, validate: (body: unknown) => body is T): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pgn }),
    })
  } catch {
    throw new ChessApiError('Server error. Please try again.')
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    // Non-JSON errors are mapped by HTTP status below.
  }

  if (!response.ok) {
    if (response.status === 400) throw new ChessApiError(detailFromBody(body) ?? 'The PGN was rejected.', 400)
    if (response.status === 422) throw new ChessApiError('Invalid request data.', 422)
    if (response.status >= 500) throw new ChessApiError('Server error. Please try again.', response.status)
    throw new ChessApiError(`Request failed (HTTP ${response.status}).`, response.status)
  }

  if (!validate(body)) {
    throw new ChessApiError('Invalid server response. Please try again.', response.status)
  }
  return body
}

export function parseGame(pgn: string) {
  return postPgn('/parse', pgn, isParseResponse)
}

export function analyzeGame(pgn: string) {
  return postPgn('/analyze', pgn, isAnalyzeResponse)
}
