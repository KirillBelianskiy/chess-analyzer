import { useMemo } from 'react'
import { scoreLabel, scoreToWhitePerspective } from '../chess/gameModel'
import type { AnalysisMove, AppStatus, DisplayMove } from '../types/chess'

type Props = {
  moves: DisplayMove[]
  analysis: AnalysisMove[]
  status: AppStatus
  currentMoveIndex: number
  onSelect: (index: number) => void
}

export function MoveList({ moves, analysis, status, currentMoveIndex, onSelect }: Props) {
  const rows = useMemo(() => {
    const grouped = new Map<number, { white?: [DisplayMove, number]; black?: [DisplayMove, number] }>()
    moves.forEach((move, index) => {
      const row = grouped.get(move.number) ?? {}
      row[move.color === 'w' ? 'white' : 'black'] = [move, index]
      grouped.set(move.number, row)
    })
    return [...grouped.entries()]
  }, [moves])
  return (
    <div className="move-list" aria-label="Game moves">
      {rows.map(([number, row]) => <div className="move-row" key={number}>
        <span className="move-number">{number}.</span>
        {(['white', 'black'] as const).map((side) => {
          const entry = row[side]
          if (!entry) return <span key={side} />
          const [move, index] = entry
          const result = analysis.find((item) => item.ply_index === index)
          const evaluation = result
            ? scoreLabel(scoreToWhitePerspective(result.score.played, result.is_white))
            : status === 'analyzing' && currentMoveIndex === index + 1 ? '…' : '—'
          return (
            <button aria-current={currentMoveIndex === index + 1 ? 'step' : undefined} className={currentMoveIndex === index + 1 ? 'active' : ''} onClick={() => onSelect(index + 1)} title={move.uci} key={side}>
              <span className="move-san">{move.san}</span>
              <span className="move-score">{evaluation}</span>
            </button>
          )
        })}
      </div>)}
    </div>
  )
}
