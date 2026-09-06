import { Chess } from 'chess.js'
import type { DisplayMove, GameModel, ParseResponse, ScoreValue } from '../types/chess'

export function uciToMove(uci: string) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined }
}

export function buildGameModel(parsed: ParseResponse): GameModel {
  const chess = new Chess(parsed.initial_fen)
  const positions = [chess.fen()]
  const displayMoves: DisplayMove[] = []
  let moveNumber = Number(parsed.initial_fen.split(/\s+/)[5] || 1)

  parsed.moves.forEach((uci) => {
    const move = chess.move(uciToMove(uci))
    displayMoves.push({ san: move.san, uci, color: move.color, number: moveNumber, from: move.from, to: move.to })
    positions.push(chess.fen())
    if (move.color === 'b') moveNumber += 1
  })

  return { ...parsed, positions, displayMoves }
}

export function formatUciAsSan(startFen: string | undefined, uci: string | null) {
  if (!startFen || !uci) return null
  try {
    return new Chess(startFen).move(uciToMove(uci)).san
  } catch {
    return null
  }
}

export function formatLine(startFen: string | undefined, line: string[] | null) {
  if (!startFen || !line?.length) return []
  const chess = new Chess(startFen)
  let valid = true
  return line.map((uci) => {
    if (!valid) return uci
    try {
      return chess.move(uciToMove(uci)).san
    } catch {
      valid = false
      return uci
    }
  })
}

export function scoreLabel(score: ScoreValue) {
  if (score.mate_in !== null) {
    if (score.mate_in === 0) return Object.is(score.mate_in, -0) ? '-M0' : 'M0'
    return score.mate_in < 0 ? `-M${Math.abs(score.mate_in)}` : `M${score.mate_in}`
  }
  if (score.centipawns === null) return '—'
  const pawns = score.centipawns / 100
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(2)}`
}

export function scoreToWhitePerspective(score: ScoreValue, isWhiteMove: boolean): ScoreValue {
  if (isWhiteMove) return score
  return {
    centipawns: score.centipawns === null ? null : -score.centipawns,
    mate_in: score.mate_in === null ? null : -score.mate_in,
  }
}
