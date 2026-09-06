import { formatLine, formatUciAsSan, scoreLabel, scoreToWhitePerspective } from '../chess/gameModel'
import type { AnalysisMove } from '../types/chess'

type Props = { analysis?: AnalysisMove; fen?: string; san?: string; analyzing: boolean }

export function AnalysisPanel({ analysis, fen, san, analyzing }: Props) {
  if (!analysis) return <p className="analysis-note" role="status">{analyzing ? 'Stockfish is analyzing the game. You can keep navigating.' : 'Select an analyzed move to see its evaluation and engine lines.'}</p>
  const bestSan = formatUciAsSan(fen, analysis.best_move)
  return <section className="move-analysis" aria-label="Selected move analysis">
    <h2>Stockfish · {san}</h2>
    <dl className="analysis-metrics">
      <div><dt>Played</dt><dd>{san} <code>{analysis.move}</code></dd></div>
      <div><dt>Best move</dt><dd>{bestSan ?? '—'} <code>{analysis.best_move}</code></dd></div>
      <div><dt>Evaluation before</dt><dd>{scoreLabel(scoreToWhitePerspective(analysis.score.best, analysis.is_white))}</dd></div>
      <div><dt>Evaluation after</dt><dd>{scoreLabel(scoreToWhitePerspective(analysis.score.played, analysis.is_white))}</dd></div>
    </dl>
    <p className="analysis-note">Evaluations from White’s perspective. White arrow: PGN move; blue arrow: Stockfish best move. Yellow squares: last played move.</p>
    <details><summary>Engine lines</summary>
      <p><strong>Best line:</strong> {formatLine(fen, analysis.best_line).join(' ') || 'No continuation'}</p>
      <p><strong>Played line:</strong> {formatLine(fen, analysis.played_line).join(' ') || 'No continuation'}</p>
    </details>
  </section>
}
