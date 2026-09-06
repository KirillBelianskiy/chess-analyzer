type Props = {
  analyzed: boolean
  analyzing: boolean
  contextLabel: string
}

function SparkIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16z" /></svg>
}

export function ChatPanel({ analyzed, analyzing, contextLabel }: Props) {

  return (
    <aside className="chat-panel">
      <div className="chat-header">
        <span className="chat-icon"><SparkIcon /></span>
        <div>
          <h2>LLM assistant</h2>
          <p>{analyzed ? `Context: ${contextLabel}` : 'Position-aware game chat'}</p>
        </div>
      </div>

      <div className="chat-messages" aria-live="polite">
        {analyzing ? (
          <div className="chat-empty waiting">
            <span className="chat-icon large"><SparkIcon /></span>
            <p>I’m waiting for Stockfish to finish evaluating the current position.</p>
            <small><span className="tiny-spinner" /> Preparing move context…</small>
          </div>
        ) : analyzed ? (
          <div className="chat-empty ready">
            <span className="chat-icon large"><SparkIcon /></span>
            <p>Stockfish analysis is ready. AI chat is not available yet.</p>
            <small>You can review the selected move and engine lines below the board.</small>
          </div>
        ) : (
          <div className="chat-empty">
            <span className="chat-icon large"><SparkIcon /></span>
            <p>Run Stockfish analysis to review the moves and engine lines.</p>
            <small>AI chat is not available yet.</small>
          </div>
        )}
      </div>

      <div className="chat-composer">
        <textarea
          placeholder="AI chat is not available yet"
          disabled
          aria-label="Message for LLM assistant"
        />
        <button className="send-button" type="button" disabled>
          <span>Send</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </div>
    </aside>
  )
}
