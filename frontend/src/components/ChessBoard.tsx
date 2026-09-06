import { Chess, type Square } from 'chess.js'
import { useMemo } from 'react'
import type { DisplayMove } from '../types/chess'
import { MoveArrows } from './MoveArrows'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const

type Props = { fen: string; playedMove?: DisplayMove; arrowMove?: string; arrowBest?: string | null }

export function ChessBoard({ fen, playedMove, arrowMove, arrowBest }: Props) {
  const chess = useMemo(() => new Chess(fen), [fen])
  return (
    <div className="board-shell"><div className="board" aria-label="Chess board">
      {RANKS.flatMap((rank, rankIndex) => FILES.map((file, fileIndex) => {
        const square = `${file}${rank}` as Square
        const piece = chess.get(square)
        const isPlayed = playedMove && (playedMove.from === square || playedMove.to === square)
        return (
          <div className={`square ${(rankIndex + fileIndex) % 2 === 0 ? 'light' : 'dark'} ${isPlayed ? 'played-square' : ''}`} key={square}>
            {piece && (
              <img
                className="piece"
                src={`/pieces/cburnett/${piece.color}${piece.type.toUpperCase()}.svg`}
                alt=""
                aria-label={`${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}`}
                draggable={false}
              />
            )}
          </div>
        )
      }))}
    </div>{(arrowMove || arrowBest) && <MoveArrows played={arrowMove} best={arrowBest} />}</div>
  )
}
