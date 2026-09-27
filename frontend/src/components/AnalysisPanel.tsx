import { formatLine, formatUciAsSan, scoreLabel, scoreToWhitePerspective } from '../chess/gameModel'
import { expectationToWhitePerspective, percentLabel, percentagePointLabel, wdlToWhitePerspective } from '../chess/moveQuality'
import type { AnalysisMove } from '../types/chess'
import { MoveGrade } from './MoveGrade'
import { WdlBar } from './WdlBar'

type Props = { analysis?: AnalysisMove; fen?: string; san?: string; analyzing: boolean; analyzed: boolean }

export function AnalysisPanel({ analysis, fen, san, analyzing, analyzed }: Props) {
  if (!analysis) return (
    <section className="analysis-empty" aria-live="polite">
      <span className="analysis-mark" aria-hidden="true">♞</span>
      <h2>{analyzing ? 'Analyzing the game' : analyzed ? 'Choose a move' : 'Engine review'}</h2>
      <p>{analyzing
        ? 'You can keep moving through the game while Stockfish works.'
        : analyzed
          ? 'Select any move to compare it with Stockfish’s choice.'
          : 'Run the analysis to see move quality, evaluation and engine lines.'}</p>
    </section>
  )
  const bestSan = formatUciAsSan(fen, analysis.best_move)
  const bestWdl = wdlToWhitePerspective(analysis.quality.best_wdl, analysis.is_white)
  const playedWdl = wdlToWhitePerspective(analysis.quality.played_wdl, analysis.is_white)
  const bestExpectation = expectationToWhitePerspective(analysis.quality.best_expectation, analysis.is_white)
  const playedExpectation = expectationToWhitePerspective(analysis.quality.played_expectation, analysis.is_white)
  const cpLoss = analysis.quality.cp_loss === null
    ? '— (mate evaluation)'
    : `${Number.isInteger(analysis.quality.cp_loss) ? analysis.quality.cp_loss : analysis.quality.cp_loss.toFixed(1)} cp`
  return <section className="move-analysis" aria-label="Selected move analysis">
    <div className="analysis-heading">
      <div><span>Move {analysis.move_number}</span><h2>{san}</h2></div>
      <MoveGrade classification={analysis.quality.classification} />
    </div>
    <dl className="analysis-metrics">
      <div><dt>Played</dt><dd>{san} <code>{analysis.played_move}</code></dd></div>
      <div><dt>Best move</dt><dd>{bestSan ?? '—'} <code>{analysis.best_move}</code></dd></div>
      <div><dt>Evaluation before</dt><dd>{scoreLabel(scoreToWhitePerspective(analysis.score.best, analysis.is_white))}</dd></div>
      <div><dt>Evaluation after</dt><dd>{scoreLabel(scoreToWhitePerspective(analysis.score.played, analysis.is_white))}</dd></div>
    </dl>
    <div className="quality-details">
      <h3>Win / draw / loss</h3>
      <WdlBar label="Best" wdl={bestWdl} />
      <WdlBar label="Played" wdl={playedWdl} />
      <dl className="quality-metrics">
        <div><dt>Best expectation</dt><dd>{percentLabel(bestExpectation)}</dd></div>
        <div><dt>Played expectation</dt><dd>{percentLabel(playedExpectation)}</dd></div>
        <div><dt>Expectation loss</dt><dd>{percentagePointLabel(analysis.quality.expectation_loss)}</dd></div>
        <div><dt>Win probability loss</dt><dd>{percentagePointLabel(analysis.quality.win_probability_loss)}</dd></div>
        <div><dt>Centipawn loss</dt><dd>{cpLoss}</dd></div>
      </dl>
    </div>
    <p className="analysis-note">Values use White’s perspective. Gray shows the next PGN move; blue shows Stockfish’s choice.</p>
    <details><summary>Engine lines</summary>
      <p><strong>Best line:</strong> {formatLine(fen, analysis.best_line).join(' ') || 'No continuation'}</p>
      <p><strong>Played line:</strong> {formatLine(fen, analysis.played_line).join(' ') || 'No continuation'}</p>
    </details>
  </section>
}
