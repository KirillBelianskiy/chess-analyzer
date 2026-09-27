import type { Color, Square } from 'chess.js'

export type ParseResponse = {
  headers: Record<string, string>
  initial_fen: string
  moves: string[]
}

export type ScoreValue = { centipawns: number | null; mate_in: number | null }

export type WDL = { win: number; draw: number; loss: number }

export type MoveQuality = {
  best_wdl: WDL
  played_wdl: WDL
  played_expectation: number
  best_expectation: number
  expectation_loss: number
  win_probability_loss: number
  cp_loss: number | null
  classification: string
}

export type AnalysisMove = {
  ply_index: number
  move_number: number
  played_move: string
  best_move: string | null
  score: { best: ScoreValue; played: ScoreValue }
  quality: MoveQuality
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
