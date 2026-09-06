import { useId } from 'react'

function center(square: string) {
  return [(square.charCodeAt(0) - 97) * 100 + 50, (8 - Number(square[1])) * 100 + 50]
}

export function MoveArrows({ played, best }: { played?: string; best?: string | null }) {
  const id = useId().replace(/:/g, '')
  return <svg className="move-arrows" viewBox="0 0 800 800" aria-label="Move arrows">
    <defs>{['played', 'best'].map(kind => <marker key={kind} id={`${id}-${kind}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="2.5" markerHeight="2.5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill={kind === 'played' ? '#fff3d8' : '#446ba8'} /></marker>)}</defs>
    {([['best', best], ['played', played]] as const).map(([kind, uci]) => {
      if (!uci || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return null
      const [x1, y1] = center(uci.slice(0, 2))
      const [x2, y2] = center(uci.slice(2, 4))
      return <line key={kind} x1={x1} y1={y1} x2={x2} y2={y2} stroke={kind === 'played' ? '#fff3d8' : '#446ba8'} strokeWidth={kind === 'played' ? 17 : 24} opacity=".72" markerEnd={`url(#${id}-${kind})`}><title>{kind === 'played' ? 'PGN move' : 'Stockfish best move'}: {uci}</title></line>
    })}
  </svg>
}
