import { useEffect, useRef, useState } from 'react'
import { hasUnsavedLibraryChanges, retryLibraryLoad, useLibraryStatus } from '../lib/library'
import { usePersistenceState } from '../lib/persistence'
import { hasUnsavedSettingsChanges } from '../lib/settings'
import { useToast } from './Toast'

/**
 * Header save indicator. Quiet when everything is saved, visible while a
 * save is slow or failing, and it warns before the tab closes on edits the
 * database has not confirmed yet.
 */
export function SaveStatus() {
  const state = usePersistenceState()
  const { saveError, loadError } = useLibraryStatus()
  const { toast } = useToast()
  const [showSaving, setShowSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const previous = useRef(state)
  const lastError = useRef<string | null>(null)

  // Only show "Saving…" when a save takes long enough to notice.
  useEffect(() => {
    if (state !== 'saving') {
      setShowSaving(false)
      return
    }
    const timer = window.setTimeout(() => setShowSaving(true), 600)
    return () => window.clearTimeout(timer)
  }, [state])

  // Confirm briefly once a visible save or a failure recovers.
  useEffect(() => {
    const before = previous.current
    previous.current = state
    if (state === 'saved' && (before === 'error' || (before === 'saving' && showSaving))) {
      setJustSaved(true)
      const timer = window.setTimeout(() => setJustSaved(false), 2000)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [state, showSaving])

  // Announce each new save problem once.
  useEffect(() => {
    if (saveError && saveError !== lastError.current && !loadError) toast(saveError, 'error')
    lastError.current = saveError
  }, [saveError, loadError, toast])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedLibraryChanges() && !hasUnsavedSettingsChanges()) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  let label: string | null = null
  let tone: 'quiet' | 'error' = 'quiet'
  if (state === 'error' && !loadError) {
    label = 'Not saved'
    tone = 'error'
  } else if (showSaving) label = 'Saving…'
  else if (justSaved) label = 'Saved'

  return (
    <span role="status" aria-live="polite" className="min-w-0">
      {label && (
        <span
          title={tone === 'error' ? saveError ?? 'Changes could not be saved yet. CineTrack keeps retrying.' : undefined}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap font-sans text-[10px] font-medium uppercase tracking-[0.12em] ${
            tone === 'error' ? 'text-[var(--destructive)]' : 'text-muted-foreground'
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${tone === 'error' ? 'bg-[var(--destructive)]' : showSaving ? 'animate-pulse bg-muted-foreground' : 'bg-[var(--status-watched)]'}`}
          />
          {label}
        </span>
      )}
    </span>
  )
}

/** Full-width notice while the shelf cannot be loaded; it keeps retrying. */
export function LoadErrorBanner() {
  const { loadError } = useLibraryStatus()
  if (!loadError) return null
  return (
    <div role="alert" className="border-b border-[var(--destructive)]/40 bg-[var(--destructive)]/10 px-4 py-2.5 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-foreground">
          <strong className="font-medium">Your shelf couldn't be loaded.</strong> {loadError} Editing is paused until it loads.
        </p>
        <button
          type="button"
          onClick={retryLibraryLoad}
          className="press shrink-0 border border-[var(--foreground)] px-3 py-1 font-sans text-[11px] font-medium uppercase tracking-[0.12em] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
        >
          Retry now
        </button>
      </div>
    </div>
  )
}
