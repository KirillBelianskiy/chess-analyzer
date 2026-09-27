type Orientation = 'white' | 'black'

type Props = {
  pgnMove?: string
  bestMove?: string | null
  orientation: Orientation
}

function center(square: string, orientation: Orientation) {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  const x = orientation === 'white' ? file : 7 - file
  const y = orientation === 'white' ? 7 - rank : rank
  return [x * 100 + 50, y * 100 + 50] as const
}

function arrowPoints(uci: string, orientation: Orientation, compact: boolean) {
  const [x1, y1] = center(uci.slice(0, 2), orientation)
  const [targetX, targetY] = center(uci.slice(2, 4), orientation)
  const distance = Math.hypot(targetX - x1, targetY - y1)
  const unitX = (targetX - x1) / distance
  const unitY = (targetY - y1) / distance
  const tipInset = compact ? 9 : 7
  const headLength = compact ? 38 : 46
  const halfWidth = compact ? 16 : 21
  const tipX = targetX - unitX * tipInset
  const tipY = targetY - unitY * tipInset
  const baseX = tipX - unitX * headLength
  const baseY = tipY - unitY * headLength
  const perpendicularX = -unitY * halfWidth
  const perpendicularY = unitX * halfWidth
  return {
    x1,
    y1,
    x2: baseX,
    y2: baseY,
    head: `${tipX},${tipY} ${baseX + perpendicularX},${baseY + perpendicularY} ${baseX - perpendicularX},${baseY - perpendicularY}`,
  }
}

export function MoveArrows({ pgnMove, bestMove, orientation }: Props) {
  const arrows = [
    { key: 'pgn', move: pgnMove, label: 'Next PGN move', className: 'pgn-arrow' },
    { key: 'best', move: bestMove, label: 'Stockfish best move', className: 'best-arrow' },
  ] as const

  return (
    <svg className="move-arrows" viewBox="0 0 800 800" role="img" aria-label="Suggested move arrows">
      <title>Next move suggestions</title>
      {arrows.map(({ key, move, label, className }) => {
        if (!move || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) return null
        const { head, ...line } = arrowPoints(move, orientation, key === 'best')
        return (
          <g className={className} key={key}>
            <title>{label}: {move}</title>
            <line {...line} />
            <polygon points={head} />
          </g>
        )
      })}
    </svg>
  )
}
