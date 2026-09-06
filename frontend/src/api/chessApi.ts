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

async function postPgn<T>(path: '/parse' | '/analyze', pgn: string): Promise<T> {
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

  if (!body || typeof body !== 'object' || !('moves' in body) || !Array.isArray(body.moves)) {
    throw new ChessApiError('Invalid server response. Please try again.', response.status)
  }
  return body as T
}

export function parseGame(pgn: string) {
  return postPgn<ParseResponse>('/parse', pgn)
}

export function analyzeGame(pgn: string) {
  return postPgn<AnalyzeResponse>('/analyze', pgn)
}
