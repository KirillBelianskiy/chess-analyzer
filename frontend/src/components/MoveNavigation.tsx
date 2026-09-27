type Props = {
  currentMoveIndex: number
  totalMoves: number
  orientation: 'white' | 'black'
  onChange: (index: number) => void
  onFlip: () => void
}

function NavigationIcon({ type }: { type: 'first' | 'previous' | 'next' | 'last' }) {
  if (type === 'first') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M18 6l-8 6 8 6" /></svg>
  if (type === 'previous') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-8 6 8 6" /></svg>
  if (type === 'next') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l8 6-8 6" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14M6 6l8 6-8 6" /></svg>
}

export function MoveNavigation({ currentMoveIndex, totalMoves, orientation, onChange, onFlip }: Props) {
  return (
    <div className="board-controls" aria-label="Move navigation">
      <button onClick={() => onChange(0)} disabled={currentMoveIndex === 0} aria-label="Start position"><NavigationIcon type="first" /></button>
      <button onClick={() => onChange(Math.max(0, currentMoveIndex - 1))} disabled={currentMoveIndex === 0} aria-label="Previous move"><NavigationIcon type="previous" /></button>
      <button onClick={() => onChange(Math.min(totalMoves, currentMoveIndex + 1))} disabled={currentMoveIndex === totalMoves} aria-label="Next move"><NavigationIcon type="next" /></button>
      <button onClick={() => onChange(totalMoves)} disabled={currentMoveIndex === totalMoves} aria-label="Final position"><NavigationIcon type="last" /></button>
      <button className="flip-board-button" onClick={onFlip} aria-label={`Show board from ${orientation === 'white' ? 'Black' : 'White'} side`} title="Flip board">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7zM4 9V4h5M20 15v5h-5M8 4a8 8 0 0 1 12 7M16 20A8 8 0 0 1 4 13" /></svg>
      </button>
    </div>
  )
}
