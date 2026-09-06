type Props = {
  dark: boolean
  onToggleTheme: () => void
  onHome: () => void
}

export function AppHeader({ dark, onToggleTheme, onHome }: Props) {
  return (
    <header className="app-header">
      <a className="app-wordmark" href="#app" aria-label="Moves analyzer home" onClick={onHome}>
        <span>Moves analyzer</span>
      </a>

      <label className="theme-control">
        <span>{dark ? 'Light' : 'Dark'}</span>
        <input type="checkbox" checked={dark} onChange={onToggleTheme} aria-label={`Use ${dark ? 'light' : 'dark'} theme`} />
        <span className="theme-switch" aria-hidden="true"><i /></span>
      </label>
    </header>
  )
}
