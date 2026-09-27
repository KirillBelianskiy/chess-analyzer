import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Chess } from 'chess.js'
import { buildGameModel, formatUciAsSan, scoreLabel, scoreToWhitePerspective } from '../src/chess/gameModel.ts'
import { classificationMeta, expectationToWhitePerspective, percentagePointLabel, wdlToWhitePerspective, whiteExpectation } from '../src/chess/moveQuality.ts'
import { analyzeGame, parseGame } from '../src/api/chessApi.ts'

const analyzedMove = {
  ply_index: 0,
  move_number: 1,
  played_move: 'e2e4',
  best_move: 'e2e4',
  score: {
    best: { centipawns: 35, mate_in: null },
    played: { centipawns: null, mate_in: 3 },
  },
  quality: {
    best_wdl: { win: 0.45, draw: 0.4, loss: 0.15 },
    played_wdl: { win: 0.4, draw: 0.4, loss: 0.2 },
    played_expectation: 0.6,
    best_expectation: 0.65,
    expectation_loss: 0.05,
    win_probability_loss: 0.04,
    cp_loss: null,
    classification: 'best',
  },
  is_white: true,
  piece: 'P',
  best_line: ['e2e4', 'e7'],
  played_line: ['e2e4', 'e7e5'],
}

test('navigation includes the initial position and castling', () => {
  const game = buildGameModel({ headers: {}, initial_fen: new Chess().fen(), moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'e1g1'] })
  assert.equal(game.positions.length, 8)
  assert.equal(game.displayMoves.at(-1).san, 'O-O')
  assert.equal(new Chess(game.positions.at(-1)).get('f1').type, 'r')
  assert.equal(new Chess(game.positions[0]).get('e1').type, 'k')
})

test('custom FEN supports promotions and Black move numbering', () => {
  const fen = '4k3/8/8/8/8/8/p7/4K3 b - - 0 12'
  const game = buildGameModel({ headers: {}, initial_fen: fen, moves: ['a2a1q'] })
  assert.equal(game.displayMoves[0].number, 12)
  assert.equal(game.displayMoves[0].san, 'a1=Q+')
  assert.equal(new Chess(game.positions[1]).get('a1').type, 'q')
})

test('en passant is applied through chess.js', () => {
  const game = buildGameModel({ headers: {}, initial_fen: new Chess().fen(), moves: ['e2e4', 'a7a6', 'e4e5', 'd7d5', 'e5d6'] })
  const chess = new Chess(game.positions.at(-1))
  assert.equal(chess.get('d5'), undefined)
  assert.equal(chess.get('d6').color, 'w')
})

test('best move SAN uses the position before the move', () => {
  assert.equal(formatUciAsSan(new Chess().fen(), 'g1f3'), 'Nf3')
  assert.equal(formatUciAsSan(new Chess().fen(), 'g1g5'), null)
})

test('scores preserve perspective including a delivered Black mate', () => {
  assert.equal(scoreLabel({ centipawns: 35, mate_in: null }), '+0.35')
  assert.equal(scoreLabel(scoreToWhitePerspective({ centipawns: 142, mate_in: null }, false)), '-1.42')
  assert.equal(scoreLabel(scoreToWhitePerspective({ centipawns: null, mate_in: 3 }, false)), '-M3')
  assert.equal(scoreLabel(scoreToWhitePerspective({ centipawns: null, mate_in: 0 }, false)), '-M0')
})

test('move classifications have Lichess-style glyphs and a safe fallback', () => {
  assert.deepEqual(
    ['best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder'].map((value) => classificationMeta(value).glyph),
    ['★', '!!', '!', '?!', '?', '??'],
  )
  assert.deepEqual(classificationMeta('novelty'), { key: 'unknown', glyph: '•', label: 'novelty' })
})

test('WDL and expectation are normalized to White perspective', () => {
  const wdl = { win: 0.5, draw: 0.3, loss: 0.2 }
  assert.deepEqual(wdlToWhitePerspective(wdl, true), wdl)
  assert.deepEqual(wdlToWhitePerspective(wdl, false), { win: 0.2, draw: 0.3, loss: 0.5 })
  assert.equal(expectationToWhitePerspective(0.7, true), 0.7)
  assert.ok(Math.abs(expectationToWhitePerspective(0.7, false) - 0.3) < Number.EPSILON)
  assert.equal(whiteExpectation(-0.2, true), 0)
  assert.equal(whiteExpectation(1.2, true), 1)
  assert.equal(percentagePointLabel(0.05), '5.0 pp')
})

test('analyze API accepts played_move, quality, mate, and nullable centipawn loss', async () => {
  const original = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ moves: [analyzedMove] }), { status: 200 })
    const response = await analyzeGame('1. e4 *')
    assert.equal(response.moves[0].played_move, 'e2e4')
    assert.equal(response.moves[0].quality.classification, 'best')
    assert.equal(response.moves[0].quality.cp_loss, null)
    assert.equal(response.moves[0].score.played.mate_in, 3)

    const { played_move: _playedMove, ...oldMove } = analyzedMove
    globalThis.fetch = async () => new Response(JSON.stringify({ moves: [{ ...oldMove, move: 'e2e4' }] }), { status: 200 })
    await assert.rejects(analyzeGame('1. e4 *'), { message: 'Invalid server response. Please try again.' })
  } finally {
    globalThis.fetch = original
  }
})

test('API maps HTTP errors and malformed success bodies', async () => {
  const original = globalThis.fetch
  try {
    for (const [status, body, message] of [
      [400, { detail: 'Invalid PGN' }, 'Invalid PGN'],
      [422, { detail: [] }, 'Invalid request data.'],
      [500, { detail: 'internal secret' }, 'Server error. Please try again.'],
      [200, null, 'Invalid server response. Please try again.'],
    ]) {
      globalThis.fetch = async () => new Response(JSON.stringify(body), { status })
      await assert.rejects(parseGame('1. e4 *'), { message })
    }
    globalThis.fetch = async () => new Response(JSON.stringify({ headers: [], initial_fen: 'invalid', moves: [] }), { status: 200 })
    await assert.rejects(parseGame('1. e4 *'), { message: 'Invalid server response. Please try again.' })
    globalThis.fetch = async () => { throw new TypeError('Network failed') }
    await assert.rejects(parseGame('1. e4 *'), { message: 'Server error. Please try again.' })
  } finally { globalThis.fetch = original }
})
