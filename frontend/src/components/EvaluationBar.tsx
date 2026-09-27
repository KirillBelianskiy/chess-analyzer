import { scoreLabel, scoreToWhitePerspective } from '../chess/gameModel'
import { whiteExpectation } from '../chess/moveQuality'
import type { AnalysisMove } from '../types/chess'

type Props = { analysis?: AnalysisMove }

function whiteShare(analysis?: AnalysisMove) {
  if (!analysis) return 50
  return whiteExpectation(analysis.quality.played_expectation, analysis.is_white) * 100
}

export function EvaluationBar({ analysis }: Props) {
  const score = analysis ? scoreToWhitePerspective(analysis.score.played, analysis.is_white) : undefined
  const white = whiteShare(analysis)
  const label = score ? scoreLabel(score) : '—'

  return (
    <div className="evaluation-bar" aria-label={`Position evaluation ${label}`}>
      <div className="evaluation-black" style={{ height: `${100 - white}%` }} />
      <div className="evaluation-white" style={{ height: `${white}%` }}>
        <span>{label}</span>
      </div>
    </div>
  )
}
