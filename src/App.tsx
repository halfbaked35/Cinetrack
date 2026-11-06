import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { type MediaType, type TmdbTitle } from './lib/tmdb'
import { useSettings } from './lib/settings'
import { Logo, SETTINGS_PANEL_ID, Spinner } from './components/ui'
import InfoPage, { type InfoSlug } from './components/InfoPages'
import type { LibraryView } from './components/Library'

const Home = lazy(() => import('./components/Home'))
const Discover = lazy(() => import('./components/Discover'))
const Library = lazy(() => import('./components/Library'))
const TitleDetail = lazy(() => import('./components/TitleDetail'))
const SettingsPanel = lazy(() => import('./components/SettingsPanel'))

type Page = 'home' | 'discover' | 'library'

const NAV: { id: Page; label: string; key: string }[] = [
  { id: 'home', label: 'Home', key: '1' },
  { id: 'discover', label: 'Discover', key: '2' },
  { id: 'library', label: 'Shelf', key: '3' },
]

/** Shown modifier: ⌥ on Apple platforms, Alt everywhere else. */
function navModifier(): string {
  if (typeof navigator === 'undefined') return 'Alt'
  return /Mac|iPhone|iPad|Macintosh/.test(navigator.userAgent ?? '') ? '⌥' : 'Alt'
}

/** Route encoded in the URL fragment, or null when there isn't one.
 *  `#library` is what the app writes, but `#/library` is what people type and
 *  what older bookmarks hold — both name the same page. */
function routeFromHash(): Page | null {
  if (typeof window === 'undefined') return null
  const raw = window.location.hash.replace(/^#\/?/, '')
  return raw === 'discover' || raw === 'library' || raw === 'home' ? (raw as Page) : null
}

export default function App() {
  const [page, setPage] = useState<Page>(() => routeFromHash() ?? 'home')
  const [libraryView, setLibraryView] = useState<LibraryView | null>(null)
  const [info, setInfo] = useState<InfoSlug | null>(null)
  const [open, setOpen] = useState<{ type: MediaType; id: number; seed?: TmdbTitle } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsMounted, setSettingsMounted] = useState(false)
  const { settings } = useSettings()

  useEffect(() => {
    if (settingsOpen) setSettingsMounted(true)
  }, [settingsOpen])

  const goPage = useCallback((p: Page) => {
    setInfo(null)
    setPage(p)
  }, [])

  /** Keep the address bar honest: it must never claim a page we aren't showing. */
  const syncHash = useCallback((p: Page) => {
    const h = p === 'home' ? '' : `#${p}`
    if (typeof window !== 'undefined' && window.location.hash !== h) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}${h}`)
    }
  }, [])

  useEffect(() => {
    syncHash(page)
  }, [page, syncHash])

  useEffect(() => {
    const onHash = () => {
      const next = routeFromHash()
      // An unrecognised fragment routes nowhere: hold the current page and put
      // the URL back rather than leaving it stuck on something meaningless.
      if (next) {
        if (next === 'library') setLibraryView(null)
        setPage(next)
      }
      else syncHash(page)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [page, syncHash])

  // Alt+1/2/3 jumps between sections, Alt+, opens settings. Physical codes,
  // not e.key: macOS Option+digit types ¡™£ instead of the digit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return
      const focusedTarget = e.target instanceof HTMLElement ? e.target : null
      // Never steal a keystroke while the user is typing into a control.
      if (focusedTarget?.closest('input, textarea, select, [contenteditable="true"]')) return
      const dialog = focusedTarget?.closest('[role="dialog"]')
      if (e.code === 'Comma') {
        // Alt+, toggles the settings drawer, so it must keep working while an
        // inner control of that drawer holds focus (the focus trap lands there
        // on open). Any other dialog keeps its shortcut to itself, so shortcuts
        // don't leak out from behind modals.
        if (dialog && !(dialog instanceof HTMLElement && dialog.id === SETTINGS_PANEL_ID)) return
        e.preventDefault()
        setSettingsOpen((v) => !v)
        return
      }
      // Page-jump shortcuts never fire while focus is inside a dialog.
      if (dialog) return
      const digit = e.code.startsWith('Digit')
        ? e.code.slice(5)
        : e.code.startsWith('Numpad')
          ? e.code.slice(6)
          : null
      const target = NAV.find((n) => n.key === digit)
      if (!target) return
      e.preventDefault()
      if (target.id === 'library') setLibraryView(null)
      goPage(target.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPage])

  const openTitle = useCallback((type: MediaType, id: number, seed?: TmdbTitle) => setOpen({ type, id, seed }), [])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        {/* Three tracks so the nav sits optically centred regardless of side widths.
            Stretch, not centre: the nav buttons run the full header height so the
            active rule rests on the bottom border. */}
        <div className="grid w-full grid-cols-2 items-stretch gap-3 px-4 md:grid-cols-[1fr_auto_1fr] md:gap-4 lg:px-6">
          <button onClick={() => goPage('home')} aria-label="CineTrack home" className="press flex items-center justify-self-start py-3">
            <Logo size={24} markSize={44} wordmark={false} />
          </button>

          <nav className="quiet-scroll order-3 col-span-2 flex items-stretch justify-center gap-1 overflow-x-auto md:order-none md:col-span-1 md:col-start-2">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (n.id === 'library') setLibraryView(null)
                  goPage(n.id)
                }}
                aria-current={page === n.id && !info ? 'page' : undefined}
                title={`${n.label} (${navModifier()}${n.key})`}
                className={`relative flex items-center justify-center gap-1.5 px-3 py-3 font-sans text-[12px] font-medium uppercase tracking-[0.14em] transition-colors duration-200 ${
                  page === n.id && !info ? 'text-foreground' : 'text-secondary-foreground hover:text-foreground'
                }`}
              >
                <span className="relative">
                  {n.label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 bottom-0 h-[2px] origin-left bg-[var(--primary)] transition-transform duration-300 ease-out ${
                      page === n.id && !info ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </span>
                {settings.showNavHints && (
                  <span aria-hidden className="font-sans text-[10px] tracking-[0.1em] text-muted-foreground">
                    {navModifier()}
                    {n.key}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-4 py-3">
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              aria-label="Open settings"
              title={settings.showNavHints ? `Settings (${navModifier()},)` : 'Settings'}
              className="press flex h-8 items-center gap-2 border border-border bg-card/50 px-3 font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors duration-200 hover:border-[var(--foreground)] hover:text-foreground"
            >
              <span>Settings</span>
              {settings.showNavHints && (
                <span aria-hidden className="text-[10px] tracking-[0.08em] text-muted-foreground opacity-70">
                  {navModifier()},
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="w-full flex-1 px-4 pb-12 pt-6 outline-none lg:px-6 lg:pb-16 lg:pt-8">
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center">
              <Spinner size={28} />
            </div>
          }
        >
          <div className="page-enter">
            {info ? (
              <InfoPage slug={info} onBack={() => setInfo(null)} />
            ) : (
              <>
                {page === 'home' && (
                  <Home
                    onOpen={openTitle}
                    onLibraryNavigate={(view) => {
                      setLibraryView(view)
                      goPage('library')
                    }}
                  />
                )}
                {page === 'discover' && <Discover onOpen={openTitle} />}
                {page === 'library' && <Library onOpen={openTitle} initialView={libraryView} />}
              </>
            )}
          </div>
        </Suspense>
      </main>

      <Footer onInfo={setInfo} />

      <Suspense fallback={null}>
        {settingsMounted && <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
        {open && (
          <TitleDetail
            key={`${open.type}-${open.id}`}
            type={open.type}
            id={open.id}
            seed={open.seed}
            onClose={() => setOpen(null)}
            onOpenTitle={openTitle}
          />
        )}
      </Suspense>
    </div>
  )
}

function Footer({ onInfo }: { onInfo: (slug: InfoSlug) => void }) {
  const openInfo = (slug: InfoSlug) => {
    onInfo(slug)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="cinema-footer">
      <div className="cinema-footer-topbar">
        <nav aria-label="Footer navigation" className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => openInfo('privacy')}
            className="press font-sans font-medium text-foreground transition-colors hover:text-[var(--primary)]"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => openInfo('terms')}
            className="press font-sans font-medium text-foreground transition-colors hover:text-[var(--primary)]"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={() => openInfo('about')}
            className="press font-sans font-medium text-foreground transition-colors hover:text-[var(--primary)]"
          >
            About
          </button>
          <button
            type="button"
            onClick={() => openInfo('api')}
            className="press font-sans font-medium text-foreground transition-colors hover:text-[var(--primary)]"
          >
            API
          </button>
        </nav>

        <div>
          <span className="font-sans text-muted-foreground">
            © {new Date().getFullYear()} CineTrack
          </span>
        </div>
      </div>
    </footer>
  )
}
