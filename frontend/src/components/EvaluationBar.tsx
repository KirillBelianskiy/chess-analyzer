import { scoreLabel, scoreToWhitePerspective } from '../chess/gameModel'
import type { AnalysisMove } from '../types/chess'

type Props = { analysis?: AnalysisMove; analyzing: boolean }

function whiteShare(analysis?: AnalysisMove) {
  if (!analysis) return 50
  const score = scoreToWhitePerspective(analysis.score.played, analysis.is_white)
  if (score.mate_in !== null) return score.mate_in < 0 || Object.is(score.mate_in, -0) ? 6 : 94
  if (score.centipawns === null) return 50
  return Math.max(6, Math.min(94, 50 + 44 * Math.tanh(score.centipawns / 600)))
}

export function EvaluationBar({ analysis, analyzing }: Props) {
  const score = analysis ? scoreToWhitePerspective(analysis.score.played, analysis.is_white) : undefined
  const white = whiteShare(analysis)
  const label = analyzing ? '…' : score ? scoreLabel(score) : '—'

  return (
    <div className="evaluation-bar" aria-label={`Position evaluation ${label}`}>
      <div className="evaluation-black" style={{ height: `${100 - white}%` }} />
      <div className="evaluation-white" style={{ height: `${white}%` }}>
        <span>{label}</span>
      </div>
    </div>
  )
}
