import { useMemo } from 'react'
import type { DisplayMove } from '../types/chess'

type Props = {
  moves: DisplayMove[]
  currentMoveIndex: number
  onSelect: (index: number) => void
}

export function MoveList({ moves, currentMoveIndex, onSelect }: Props) {
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
          return (
            <button aria-current={currentMoveIndex === index + 1 ? 'step' : undefined} className={currentMoveIndex === index + 1 ? 'active' : ''} onClick={() => onSelect(index + 1)} title={move.uci} key={side}>
              <span className="move-san">{move.san}</span>
            </button>
          )
        })}
      </div>)}
    </div>
  )
}
