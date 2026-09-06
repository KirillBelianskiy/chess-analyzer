import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzeGame, parseGame } from './api/chessApi'
import { buildGameModel, scoreLabel, scoreToWhitePerspective } from './chess/gameModel'
import { AnalysisPanel } from './components/AnalysisPanel'
import { AppHeader } from './components/AppHeader'
import { ChatPanel } from './components/ChatPanel'
import { ChessBoard } from './components/ChessBoard'
import { EvaluationBar } from './components/EvaluationBar'
import { MoveList } from './components/MoveList'
import { MoveNavigation } from './components/MoveNavigation'
import { PGNInput } from './components/PGNInput'
import type { AnalyzeResponse, AppStatus, GameModel } from './types/chess'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Server error. Please try again.'
}

function initialTheme() {
  let saved: string | null = null
  try { saved = window.localStorage.getItem('moves-analyzer-theme') } catch { /* Storage can be unavailable. */ }
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme)
  const [pgn, setPgn] = useState('')
  const [status, setStatus] = useState<AppStatus>('idle')
  const [game, setGame] = useState<GameModel | null>(null)
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const requestVersion = useRef(0)
  const moveListRef = useRef<HTMLDivElement>(null)

  const parsing = status === 'parsing'
  const analyzing = status === 'analyzing'
  const analyzed = status === 'analyzed' && Boolean(analysis)
  const currentMove = currentMoveIndex > 0 ? game?.displayMoves[currentMoveIndex - 1] : undefined
  const currentAnalysis = currentMoveIndex > 0
    ? analysis?.moves.find((item) => item.ply_index === currentMoveIndex - 1)
    : undefined
  const positionBeforeMove = currentMoveIndex > 0 ? game?.positions[currentMoveIndex - 1] : undefined
  const nextMove = game?.displayMoves[currentMoveIndex]
  const nextAnalysis = analysis?.moves.find((item) => item.ply_index === currentMoveIndex)

  const selectedMoveLabel = currentMove ? `${currentMove.number}${currentMove.color === 'b' ? '…' : '.'} ${currentMove.san}` : 'Start position'
  const boardContext = useMemo(() => {
    if (!currentMove) return analyzing ? 'Starting position · evaluating…' : 'Starting position'
    const base = `Position after ${selectedMoveLabel}`
    if (analyzing) return `${base} · evaluating…`
    if (!currentAnalysis) return base
    const score = scoreToWhitePerspective(currentAnalysis.score.played, currentAnalysis.is_white)
    const label = scoreLabel(score)
    const side = score.mate_in !== null
      ? score.mate_in < 0 || Object.is(score.mate_in, -0) ? 'for Black' : 'for White'
      : (score.centipawns ?? 0) < 0 ? 'for Black' : (score.centipawns ?? 0) > 0 ? 'for White' : 'equal'
    return `${base} · ${label} ${side}`
  }, [analyzing, currentAnalysis, currentMove, selectedMoveLabel])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { window.localStorage.setItem('moves-analyzer-theme', theme) } catch { /* Theme still works without persistence. */ }
  }, [theme])

  useEffect(() => {
    const list = moveListRef.current
    const active = list?.querySelector('.active')
    if (list && active) {
      const container = list.getBoundingClientRect()
      const item = active.getBoundingClientRect()
      if (item.top < container.top) list.scrollTop -= container.top - item.top
      else if (item.bottom > container.bottom) list.scrollTop += item.bottom - container.bottom
    }
  }, [currentMoveIndex])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!game || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return
      if (event.target instanceof HTMLElement && event.target.isContentEditable) return
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) event.preventDefault()
      if (event.key === 'ArrowLeft') setCurrentMoveIndex((index) => Math.max(0, index - 1))
      if (event.key === 'ArrowRight') setCurrentMoveIndex((index) => Math.min(game.moves.length, index + 1))
      if (event.key === 'Home') setCurrentMoveIndex(0)
      if (event.key === 'End') setCurrentMoveIndex(game.moves.length)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [game])

  const reset = () => {
    requestVersion.current += 1
    setPgn('')
    setGame(null)
    setAnalysis(null)
    setCurrentMoveIndex(0)
    setError(null)
    setStatus('idle')
  }

  const handlePgnChange = (nextPgn: string) => {
    requestVersion.current += 1
    setPgn(nextPgn)
    setError(null)
    setStatus('idle')
  }

  const handleFile = async (file: File) => {
    const version = ++requestVersion.current
    setError(null)
    try {
      const contents = await file.text()
      if (version !== requestVersion.current) return
      if (!contents.trim()) {
        setStatus('error')
        setError('The selected PGN file is empty.')
        return
      }
      setPgn(contents)
      setStatus('idle')
    } catch {
      if (version !== requestVersion.current) return
      setStatus('error')
      setError('Could not read the selected PGN file.')
    }
  }

  const handleParse = async () => {
    if (!pgn.trim() || parsing) return
    const version = ++requestVersion.current
    setStatus('parsing')
    setError(null)
    try {
      const parsed = await parseGame(pgn)
      if (version !== requestVersion.current) return
      setGame(buildGameModel(parsed))
      setAnalysis(null)
      setCurrentMoveIndex(0)
      setStatus('parsed')
    } catch (caught) {
      if (version !== requestVersion.current) return
      setGame(null)
      setAnalysis(null)
      setStatus('error')
      setError(errorMessage(caught))
    }
  }

  const handleAnalyze = async () => {
    if (!game || analyzing) return
    const version = ++requestVersion.current
    setStatus('analyzing')
    setError(null)
    setAnalysis(null)
    try {
      const result = await analyzeGame(pgn)
      if (version !== requestVersion.current) return
      setAnalysis(result)
      setStatus('analyzed')
    } catch (caught) {
      if (version !== requestVersion.current) return
      setStatus('error')
      setError(errorMessage(caught))
    }
  }

  return (
    <div className="app" id="app">
      <AppHeader dark={theme === 'dark'} onToggleTheme={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} onHome={reset} />

      {!game ? (
        <PGNInput pgn={pgn} parsing={parsing} error={error} onChange={handlePgnChange} onFile={handleFile} onParse={handleParse} />
      ) : (
        <main className="analysis-workspace">
          <aside className="moves-column">
            {analyzing && (
              <div className="analyzing-state" aria-live="polite"><span className="button-spinner" /> Analyzing game…</div>
            )}
            {error && <div className="error-message compact" role="alert"><strong>Analysis failed</strong><span>{error}</span></div>}

            <section className="moves-panel">
              <h1>Moves · selected: {selectedMoveLabel}</h1>
              <div className="move-list-scroll" ref={moveListRef}>
                <MoveList
                  moves={game.displayMoves}
                  analysis={analysis?.moves ?? []}
                  status={status}
                  currentMoveIndex={currentMoveIndex}
                  onSelect={setCurrentMoveIndex}
                />
              </div>
            </section>
          </aside>

          <section className="board-panel">
            <h1>{boardContext}</h1>
            <div className="board-and-evaluation">
              <EvaluationBar analysis={currentAnalysis} analyzing={analyzing} />
              <ChessBoard
                fen={game.positions[currentMoveIndex]}
                playedMove={currentMove}
                arrowMove={nextMove?.uci}
                arrowBest={nextAnalysis?.best_move}
              />
            </div>
            <MoveNavigation currentMoveIndex={currentMoveIndex} totalMoves={game.moves.length} onChange={setCurrentMoveIndex} />
            {!analysis && <div className="board-actions">
              <button className="primary-button" disabled={analyzing} onClick={handleAnalyze}>{analyzing ? 'Analyzing…' : 'Analyze'}</button>
            </div>}
            <AnalysisPanel analysis={currentAnalysis} fen={positionBeforeMove} san={currentMove?.san} analyzing={analyzing} />
          </section>

          <ChatPanel
            analyzed={analyzed}
            analyzing={analyzing}
            contextLabel={selectedMoveLabel}
          />
        </main>
      )}
    </div>
  )
}

export default App
