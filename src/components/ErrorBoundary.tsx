import { Component, type ErrorInfo, type ReactNode } from 'react'

/** A lazily loaded chunk failed to download (offline, or the app was rebuilt). */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically/i.test(message)
}

type Props = {
  children: ReactNode
  /** Changing this value clears a caught error (e.g. on navigation). */
  resetKey?: unknown
  /** Compact inline fallback instead of the full-page one. */
  inline?: boolean
  label?: string
}
type State = { error: Error | null; errorId: string | null; resetKey: unknown }

/**
 * Contains a render failure to one region of the app. A failed code-split
 * download cannot be retried in place (browsers cache the failed import), so
 * "Try again" reloads the page in that case.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null, errorId: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const suffix = Math.random().toString(36).slice(2, 8)
    return { error, errorId: `CT-${Date.now().toString(36)}-${suffix}` }
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) return { resetKey: props.resetKey, error: null, errorId: null }
    return null
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[CineTrack] ${this.props.label ?? 'view'} failed (${this.state.errorId ?? 'no id'})`, error, info.componentStack)
  }

  private retry = () => {
    if (isChunkLoadError(this.state.error)) window.location.reload()
    else this.setState({ error: null, errorId: null })
  }

  override render() {
    const { error, errorId } = this.state
    if (!error) return this.props.children
    const chunk = isChunkLoadError(error)
    const title = chunk ? 'This part of CineTrack could not load' : 'Something went wrong'
    const detail = chunk
      ? 'Check that the CineTrack server is still running, then try again.'
      : import.meta.env.DEV
        ? error.message
        : 'An unexpected error interrupted this view. Your library is safe.'

    if (this.props.inline) {
      return (
        <div role="alert" className="border border-dashed border-border px-6 py-10 text-center">
          <p className="font-sans text-[12px] font-medium uppercase tracking-[0.14em] text-foreground">{title}</p>
          <p className="mt-2 text-[13px] text-muted-foreground">{detail}</p>
          <button
            type="button"
            onClick={this.retry}
            className="press mt-4 border border-border px-4 py-2 font-sans text-[11px] font-medium uppercase tracking-[0.14em] hover:border-[var(--foreground)]"
          >
            {chunk ? 'Reload' : 'Try again'}
          </button>
        </div>
      )
    }

    return (
      <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-foreground">
        <div className="max-w-lg border border-border bg-card p-6 shadow-lg">
          <h1 className="font-display text-[26px] text-foreground">{title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{detail}</p>
          {import.meta.env.DEV && !chunk && error.stack && (
            <pre className="mt-4 max-h-40 overflow-auto bg-muted p-3 text-[11px] text-muted-foreground">{error.stack}</pre>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.retry}
              className="press border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-primary-foreground"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="press border border-border bg-background px-4 py-2 font-sans text-[11px] font-medium uppercase tracking-[0.14em] hover:bg-muted"
            >
              Reload page
            </button>
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
            Error ID <span className="tabular-nums">{errorId}</span>. If this keeps happening, export a backup from Settings.
          </p>
        </div>
      </div>
    )
  }
}
