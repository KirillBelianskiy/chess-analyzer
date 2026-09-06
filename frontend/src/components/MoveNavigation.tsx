type Props = { currentMoveIndex: number; totalMoves: number; onChange: (index: number) => void }

function NavigationIcon({ type }: { type: 'first' | 'previous' | 'next' | 'last' }) {
  if (type === 'first') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M18 6l-8 6 8 6" /></svg>
  if (type === 'previous') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-8 6 8 6" /></svg>
  if (type === 'next') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l8 6-8 6" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14M6 6l8 6-8 6" /></svg>
}

export function MoveNavigation({ currentMoveIndex, totalMoves, onChange }: Props) {
  return (
    <div className="board-controls" aria-label="Move navigation">
      <button onClick={() => onChange(0)} disabled={currentMoveIndex === 0} aria-label="Start position"><NavigationIcon type="first" /></button>
      <button onClick={() => onChange(Math.max(0, currentMoveIndex - 1))} disabled={currentMoveIndex === 0} aria-label="Previous move"><NavigationIcon type="previous" /></button>
      <button onClick={() => onChange(Math.min(totalMoves, currentMoveIndex + 1))} disabled={currentMoveIndex === totalMoves} aria-label="Next move"><NavigationIcon type="next" /></button>
      <button onClick={() => onChange(totalMoves)} disabled={currentMoveIndex === totalMoves} aria-label="Final position"><NavigationIcon type="last" /></button>
    </div>
  )
}
