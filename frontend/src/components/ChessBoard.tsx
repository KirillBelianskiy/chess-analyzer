import { Chess, type Square } from 'chess.js'
import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react'
import type { DisplayMove } from '../types/chess'
import { MoveArrows } from './MoveArrows'
import { MoveGrade } from './MoveGrade'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const

type Orientation = 'white' | 'black'

type Props = {
  fen: string
  moveIndex: number
  playedMove?: DisplayMove
  nextMove?: DisplayMove
  nextBestMove?: string | null
  moveClassification?: string
  orientation: Orientation
}

type PieceMovement = { from: Square; to: Square }

const CASTLING_ROOK_MOVES: Record<string, PieceMovement> = {
  e1g1: { from: 'h1', to: 'f1' },
  g1e1: { from: 'f1', to: 'h1' },
  e1c1: { from: 'a1', to: 'd1' },
  c1e1: { from: 'd1', to: 'a1' },
  e8g8: { from: 'h8', to: 'f8' },
  g8e8: { from: 'f8', to: 'h8' },
  e8c8: { from: 'a8', to: 'd8' },
  c8e8: { from: 'd8', to: 'a8' },
}

function screenPosition(square: Square, orientation: Orientation) {
  const file = square.charCodeAt(0) - 97
  const rank = 8 - Number(square[1])
  return orientation === 'white' ? [file, rank] : [7 - file, 7 - rank]
}

function movementStyle({ from, to }: PieceMovement, orientation: Orientation) {
  const [sourceFile, sourceRank] = screenPosition(from, orientation)
  const [targetFile, targetRank] = screenPosition(to, orientation)
  const squareToPieceRatio = 100 / 0.88
  return {
    '--piece-move-x': `${(sourceFile - targetFile) * squareToPieceRatio}%`,
    '--piece-move-y': `${(sourceRank - targetRank) * squareToPieceRatio}%`,
  } as CSSProperties
}

export function ChessBoard({ fen, moveIndex, playedMove, nextMove, nextBestMove, moveClassification, orientation }: Props) {
  const chess = useMemo(() => new Chess(fen), [fen])
  const files = orientation === 'white' ? FILES : [...FILES].reverse()
  const ranks = orientation === 'white' ? RANKS : [...RANKS].reverse()
  const previousMoveIndex = useRef(moveIndex)
  const previousIndex = previousMoveIndex.current
  const isJump = Math.abs(moveIndex - previousIndex) > 1
  const primaryMovement = moveIndex === previousIndex + 1 && playedMove
    ? { from: playedMove.from, to: playedMove.to }
    : moveIndex === previousIndex - 1 && nextMove
      ? { from: nextMove.to, to: nextMove.from }
      : undefined
  const movements = primaryMovement
    ? [primaryMovement, CASTLING_ROOK_MOVES[`${primaryMovement.from}${primaryMovement.to}`]].filter((move): move is PieceMovement => Boolean(move))
    : []

  useLayoutEffect(() => {
    previousMoveIndex.current = moveIndex
  }, [moveIndex])

  return (
    <div className="board-shell">
      <div className={`board${isJump ? ' position-jump' : ''}`} aria-label={`Chess board, ${orientation} side`} key={`${moveIndex}-${orientation}`}>
      {ranks.flatMap((rank, rankIndex) => files.map((file, fileIndex) => {
        const square = `${file}${rank}` as Square
        const piece = chess.get(square)
        const isPlayed = playedMove && (playedMove.from === square || playedMove.to === square)
        const isNext = nextMove?.to === square
        const movement = movements.find((item) => item.to === square)
        return (
          <div className={`square ${(rankIndex + fileIndex) % 2 === 0 ? 'light' : 'dark'} ${isPlayed ? 'played-square' : ''} ${isNext ? 'next-square' : ''}`} key={square}>
            {piece && (
              <img
                className={`piece${movement ? ' moving-piece' : ''}`}
                style={movement ? movementStyle(movement, orientation) : undefined}
                src={`/pieces/cburnett/${piece.color}${piece.type.toUpperCase()}.svg`}
                alt=""
                aria-label={`${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}`}
                draggable={false}
              />
            )}
            {moveClassification && playedMove?.to === square && (
              <span className="board-move-grade"><MoveGrade classification={moveClassification} compact /></span>
            )}
          </div>
        )
      }))}
      </div>
      <MoveArrows pgnMove={nextMove?.uci} bestMove={nextBestMove} orientation={orientation} />
    </div>
  )
}
