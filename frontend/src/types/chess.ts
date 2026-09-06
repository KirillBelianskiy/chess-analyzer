import type { Color, Square } from 'chess.js'

export type ParseResponse = {
  headers: Record<string, string>
  initial_fen: string
  moves: string[]
}

export type ScoreValue = { centipawns: number | null; mate_in: number | null }

export type AnalysisMove = {
  ply_index: number
  move_number: number
  move: string
  best_move: string | null
  score: { best: ScoreValue; played: ScoreValue }
  is_white: boolean
  piece: string
  best_line: string[] | null
  played_line: string[] | null
}

export type AnalyzeResponse = { moves: AnalysisMove[] }

export type DisplayMove = {
  san: string
  uci: string
  color: Color
  number: number
  from: Square
  to: Square
}

export type GameModel = ParseResponse & {
  positions: string[]
  displayMoves: DisplayMove[]
}

export type AppStatus = 'idle' | 'parsing' | 'parsed' | 'analyzing' | 'analyzed' | 'error'
