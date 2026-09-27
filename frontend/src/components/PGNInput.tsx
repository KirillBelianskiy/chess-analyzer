import { useRef, useState, type DragEvent } from 'react'

type Props = {
  pgn: string
  parsing: boolean
  error: string | null
  onChange: (pgn: string) => void
  onFile: (file: File) => void
  onParse: () => void
}

export function PGNInput({ pgn, parsing, error, onChange, onFile, onParse }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const empty = !pgn.trim()

  const receiveFile = (file?: File) => {
    if (file && !parsing) onFile(file)
  }

  const drop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setDragging(false)
    receiveFile(event.dataTransfer.files[0])
  }

  return (
    <main className="entry-screen" aria-labelledby="pgn-title">
      <header className="entry-intro">
        <h1 id="pgn-title">Review the game, move by move.</h1>
        <p>Paste one PGN or choose a file. Stockfish analysis starts only when you ask for it.</p>
      </header>

      <div className="pgn-sheet">
        <div className="pgn-fields">
          <textarea
            value={pgn}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste one PGN game here…"
            aria-label="PGN notation"
            spellCheck={false}
            disabled={parsing}
          />
          <input
            ref={fileInput}
            className="visually-hidden"
            type="file"
            disabled={parsing}
            accept=".pgn,text/plain,application/x-chess-pgn"
            onChange={(event) => { receiveFile(event.target.files?.[0]); event.target.value = '' }}
          />
        </div>
        <div className="import-actions">
          <button
            className={`file-dropzone ${dragging ? 'dragging' : ''}`}
            type="button"
            disabled={parsing}
            onClick={() => fileInput.current?.click()}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={drop}
          >
            Choose PGN file
          </button>
          <button className="primary-button" type="button" onClick={onParse} disabled={empty || parsing}>
            {parsing && <span className="button-spinner" />}
            {parsing ? 'Reading game…' : 'Open game'}
          </button>
        </div>
      </div>

      {error && <div className="error-message" role="alert"><strong>The game could not be opened.</strong><span>{error}</span></div>}
    </main>
  )
}
