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
    <section className="empty-state" aria-labelledby="pgn-title">
      <div className="pgn-card">
        <div className="card-heading">
          <h1 id="pgn-title">PGN input</h1>
        </div>
        <div className="pgn-fields">
          <textarea
            value={pgn}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste one PGN game here…"
            aria-label="PGN notation"
            spellCheck={false}
            disabled={parsing}
          />
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
            <span>Drop a .pgn file or <u>choose file</u></span>
          </button>
          <input
            ref={fileInput}
            className="visually-hidden"
            type="file"
            disabled={parsing}
            accept=".pgn,text/plain,application/x-chess-pgn"
            onChange={(event) => { receiveFile(event.target.files?.[0]); event.target.value = '' }}
          />
        </div>
      </div>

      {error && <div className="error-message" role="alert"><strong>Couldn’t parse PGN</strong><span>{error}</span></div>}

      <div className="parse-card">
        <div>
          <h2>1 · Parse PGN</h2>
          <p>Validate notation and build the move timeline.</p>
        </div>
        <button className="primary-button" type="button" onClick={onParse} disabled={empty || parsing}>
          {parsing && <span className="button-spinner" />}
          {parsing ? 'Parsing…' : 'Parse'}
        </button>
      </div>
    </section>
  )
}
