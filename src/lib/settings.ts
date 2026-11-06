import { useCallback, useSyncExternalStore } from 'react'
import { setPersistenceState, unrefTimer } from './persistence'
import { STARTING_STATUS_IDS, type StartingStatus } from './status'
import {
  type ThemeId,
  type CustomThemeColors,
  DEFAULT_CUSTOM_COLORS,
  isValidHex,
  normalizeHex,
  applyTheme as applyThemeEngine,
} from './theme'

export type { ThemeId, CustomThemeColors, CuratedPalette } from './theme'
export { DEFAULT_CUSTOM_COLORS, THEME_DEFAULTS, CURATED_PALETTES, isValidHex, normalizeHex, getContrastColor } from './theme'

export const DEFAULT_ARCHIVE_NAME = 'The Standing Collection'
export const ARCHIVE_NAME_MAX_LENGTH = 48

export const LANGUAGES: { id: string; label: string }[] = [
  { id: 'en-US', label: 'English' },
  { id: 'de-DE', label: 'Deutsch' },
  { id: 'es-ES', label: 'Español' },
  { id: 'fr-FR', label: 'Français' },
  { id: 'it-IT', label: 'Italiano' },
  { id: 'nl-NL', label: 'Nederlands' },
  { id: 'pl-PL', label: 'Polski' },
  { id: 'pt-BR', label: 'Português' },
  { id: 'ja-JP', label: '日本語' },
  { id: 'ko-KR', label: '한국어' },
  { id: 'zh-CN', label: '中文' },
]

const TAB_IDS = ['all', 'movie', 'tv', 'favorites'] as const
const SORT_IDS = ['added', 'lastWatched', 'title', 'rating', 'year', 'status'] as const

export const THEMES: { id: ThemeId; name: string; note: string; tone: 'light' | 'dark'; swatch: [string, string, string] }[] = [
  { id: 'paper', name: 'Paper', note: 'True white stock, oxblood ink', tone: 'light', swatch: ['#ffffff', '#14130f', '#7a2318'] },
  { id: 'blueprint', name: 'Blueprint', note: 'Cool slate, technical ink', tone: 'light', swatch: ['#eef1f4', '#131a21', '#1f5673'] },
  { id: 'halide', name: 'Halide', note: 'Charcoal stock, carbon card, silver-blue', tone: 'dark', swatch: ['#242424', '#ededed', '#6fa8c4'] },
  { id: 'velvet', name: 'Velvet', note: 'Cinema velvet, curtain-red house', tone: 'dark', swatch: ['#100e0d', '#f2ede1', '#b3402e'] },
  { id: 'black', name: 'Black', note: 'Pure black, silver type, cinema pink', tone: 'dark', swatch: ['#000000', '#f5f5f5', '#d93d87'] },
  { id: 'custom', name: 'Custom', note: 'Bespoke palette with custom hex colors', tone: 'light', swatch: ['#ffffff', '#14130f', '#7a2318'] },
]

export type StatusBadgeShape = 'circle' | 'square' | 'text'
export type StatusBadgeSize = 'small' | 'medium' | 'large'
export type StatusBadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export type Settings = {
  theme: ThemeId
  customColors: CustomThemeColors
  density: 'comfortable' | 'compact'
  hideSpoilers: boolean
  blurEpisodeCovers: boolean
  hideEpisodeCovers: boolean
  episodeWatchedColor: string
  showSpecials: boolean
  autoCompleteSeries: boolean
  posterMotion: boolean
  libraryColumns: number
  discoverColumns: number
  shelfColumns: number
  includeAdult: boolean
  archiveName: string
  archiveItalicWordIndices: number[]
  showNavHints: boolean
  defaultStatus: StartingStatus
  openAfterAdd: boolean
  defaultWatchDate: 'today' | 'blank'
  defaultShelfTab: (typeof TAB_IDS)[number]
  defaultSort: (typeof SORT_IDS)[number]
  showCommunityScores: boolean
  dateStyle: 'absolute' | 'relative'
  posterQuality: 'standard' | 'saver'
  metadataLanguage: string
  roundPosters: boolean
  statusBadgeShape: StatusBadgeShape
  statusBadgeSize: StatusBadgeSize
  statusBadgePosition: StatusBadgePosition
  statusBadgeIcon: boolean
  statusBadgeShadow: boolean
}

const DEFAULTS: Settings = {
  theme: 'paper',
  customColors: { ...DEFAULT_CUSTOM_COLORS },
  density: 'comfortable',
  hideSpoilers: false,
  blurEpisodeCovers: false,
  hideEpisodeCovers: false,
  episodeWatchedColor: '#15803d',
  showSpecials: true,
  autoCompleteSeries: true,
  posterMotion: true,
  roundPosters: false,
  statusBadgeShape: 'circle',
  statusBadgeSize: 'large',
  statusBadgePosition: 'top-left',
  statusBadgeIcon: false,
  statusBadgeShadow: true,
  libraryColumns: 6,
  discoverColumns: 7,
  shelfColumns: 6,
  includeAdult: false,
  archiveName: DEFAULT_ARCHIVE_NAME,
  archiveItalicWordIndices: [2],
  showNavHints: true,
  defaultStatus: 'planned',
  openAfterAdd: false,
  defaultWatchDate: 'today',
  defaultShelfTab: 'all',
  defaultSort: 'added',
  showCommunityScores: false,
  dateStyle: 'absolute',
  posterQuality: 'standard',
  metadataLanguage: 'en-US',
}

const LEGACY_STORAGE = 'archive.settings.v1'
const LEGACY_CORRUPT_STORAGE = 'archive.settings.v1.corrupt'

function clamp(n: unknown, min: number, max: number, def: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return def
  return Math.min(max, Math.max(min, Math.round(n as number)))
}

function sanitize(s: Partial<Settings> & Record<string, unknown>): Settings {
  const out: Settings = { ...DEFAULTS }
  // Retired id: Nitrate became Velvet (amber lamp → curtain red).
  const theme = (s.theme as string) === 'nitrate' ? 'velvet' : s.theme
  if (THEMES.some((t) => t.id === theme)) out.theme = theme as ThemeId
  if (s.customColors && typeof s.customColors === 'object' && !Array.isArray(s.customColors)) {
    const raw = s.customColors as Record<string, unknown>
    const clean: CustomThemeColors = { ...DEFAULT_CUSTOM_COLORS }
    const keys: (keyof CustomThemeColors)[] = [
      'background',
      'card',
      'foreground',
      'primary',
      'border',
      'mutedForeground',
      'secondary',
      'statusPlanned',
      'statusWatching',
      'statusWatched',
    ]
    for (const k of keys) {
      const v = raw[k]
      if (typeof v === 'string' && isValidHex(v)) {
        clean[k] = normalizeHex(v)
      }
    }
    out.customColors = clean
  } else {
    out.customColors = { ...DEFAULT_CUSTOM_COLORS }
  }
  if (s.density === 'comfortable' || s.density === 'compact') out.density = s.density
  out.hideSpoilers = !!s.hideSpoilers
  out.hideEpisodeCovers = !!s.hideEpisodeCovers
  if (typeof s.episodeWatchedColor === 'string' && isValidHex(s.episodeWatchedColor)) {
    out.episodeWatchedColor = normalizeHex(s.episodeWatchedColor)
  }
  out.showSpecials = s.showSpecials !== false
  out.blurEpisodeCovers = !!s.blurEpisodeCovers && !out.hideEpisodeCovers
  out.autoCompleteSeries = s.autoCompleteSeries !== false
  out.posterMotion = s.posterMotion !== false
  out.showNavHints = s.showNavHints !== false
  out.openAfterAdd = !!s.openAfterAdd
  out.showCommunityScores = !!s.showCommunityScores
  if (typeof s.archiveName === 'string') {
    out.archiveName = Array.from(s.archiveName).slice(0, ARCHIVE_NAME_MAX_LENGTH).join('')
  }
  const archiveWordCount = out.archiveName.trim().split(/\s+/).filter(Boolean).length
  const legacyItalicIndex = typeof s.archiveItalicWordIndex === 'number' && Number.isInteger(s.archiveItalicWordIndex)
    ? (s.archiveItalicWordIndex < 0 ? archiveWordCount - 1 : s.archiveItalicWordIndex)
    : null
  const italicIndices = Array.isArray(s.archiveItalicWordIndices)
    ? s.archiveItalicWordIndices
    : legacyItalicIndex == null
      ? out.archiveItalicWordIndices
      : [legacyItalicIndex]
  out.archiveItalicWordIndices = archiveWordCount > 0
    ? [...new Set(italicIndices
      .filter((index): index is number => typeof index === 'number' && Number.isInteger(index) && index >= 0)
      .map((index) => Math.min(index, archiveWordCount - 1)))]
    : []
  if ((STARTING_STATUS_IDS as readonly string[]).includes(s.defaultStatus as string)) {
    out.defaultStatus = s.defaultStatus as StartingStatus
  }
  if (s.defaultWatchDate === 'today' || s.defaultWatchDate === 'blank') out.defaultWatchDate = s.defaultWatchDate
  if ((TAB_IDS as readonly string[]).includes(s.defaultShelfTab as string)) {
    out.defaultShelfTab = s.defaultShelfTab as Settings['defaultShelfTab']
  }
  if ((SORT_IDS as readonly string[]).includes(s.defaultSort as string)) {
    out.defaultSort = s.defaultSort as Settings['defaultSort']
  }
  if (s.dateStyle === 'absolute' || s.dateStyle === 'relative') out.dateStyle = s.dateStyle
  if (s.posterQuality === 'standard' || s.posterQuality === 'saver') out.posterQuality = s.posterQuality
  if (typeof s.metadataLanguage === 'string' && LANGUAGES.some((l) => l.id === s.metadataLanguage)) {
    out.metadataLanguage = s.metadataLanguage
  }
  out.libraryColumns = clamp(s.libraryColumns, 3, 10, DEFAULTS.libraryColumns)
  out.discoverColumns = clamp(s.discoverColumns, 3, 10, DEFAULTS.discoverColumns)
  out.shelfColumns = clamp(s.shelfColumns, 3, 10, DEFAULTS.shelfColumns)
  out.includeAdult = !!s.includeAdult
  out.roundPosters = !!s.roundPosters
  if (s.statusBadgeShape === 'circle' || s.statusBadgeShape === 'square' || s.statusBadgeShape === 'text') {
    out.statusBadgeShape = s.statusBadgeShape
  }
  if (s.statusBadgeSize === 'small' || s.statusBadgeSize === 'medium' || s.statusBadgeSize === 'large') {
    out.statusBadgeSize = s.statusBadgeSize
  }
  if (
    s.statusBadgePosition === 'top-left' ||
    s.statusBadgePosition === 'top-right' ||
    s.statusBadgePosition === 'bottom-left' ||
    s.statusBadgePosition === 'bottom-right'
  ) {
    out.statusBadgePosition = s.statusBadgePosition
  }
  out.statusBadgeIcon = !!s.statusBadgeIcon
  out.statusBadgeShadow = s.statusBadgeShadow !== false
  return out
}

/**
 * Unknown keys (written by a newer client) ride along untouched so an older
 * client can never delete them on its next write — only known keys sanitize.
 */
let extraKeys: Record<string, unknown> = {}
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
const RETIRED_KEYS = new Set(['chartStyle', 'archiveItalicWordIndex'])
/** The settings endpoint accepts ~10 KB per key and ~256 KB per request, so
 *  unknown keys are bounded here too — an oversized stray value would
 *  otherwise produce a body the server resets, wedging the retry loop. */
const MAX_EXTRA_KEYS = 40
const MAX_EXTRA_KEY_BYTES = 4096
function stashExtras(s: Record<string, unknown>, opts?: { merge?: boolean }) {
  if (!opts?.merge) extraKeys = {}
  for (const [k, v] of Object.entries(s)) {
    if (k in DEFAULTS || UNSAFE_KEYS.has(k) || RETIRED_KEYS.has(k)) continue
    if (!(k in extraKeys) && Object.keys(extraKeys).length >= MAX_EXTRA_KEYS) continue
    let serialized: string
    try {
      serialized = JSON.stringify(v) ?? ''
    } catch {
      continue
    }
    if (!serialized || serialized.length > MAX_EXTRA_KEY_BYTES) continue
    extraKeys[k] = v
  }
}
function withExtras(s: Settings): Record<string, unknown> {
  return { ...extraKeys, ...s }
}

let legacySettingsPresent = false

function readLegacySettings(): Settings {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULTS }
    const raw = localStorage.getItem(LEGACY_STORAGE)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<Settings>
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { ...DEFAULTS }
    legacySettingsPresent = true
    stashExtras(parsed as Record<string, unknown>)
    return sanitize(parsed)
  } catch {
    try {
      localStorage.removeItem(LEGACY_STORAGE)
      console.warn('[settings] invalid legacy browser settings were discarded')
    } catch {}
    return { ...DEFAULTS }
  }
}

function clearLegacyStorage() {
  try {
    localStorage.removeItem(LEGACY_STORAGE)
    localStorage.removeItem(LEGACY_CORRUPT_STORAGE)
    legacySettingsPresent = false
  } catch {
    // The database is already authoritative; inaccessible browser storage is harmless.
  }
}

let cache: Settings = readLegacySettings()
const listeners = new Set<() => void>()
let hydrating = true
let hasMutatedDuringHydration = false
/** Keys changed locally — these win over server values during hydrate merge. */
const dirtyKeys = new Set<keyof Settings>()

function getSnapshot(): Settings {
  return cache
}
function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
function notify() {
  for (const fn of [...listeners]) {
    try {
      fn()
    } catch (e) {
      console.error(e)
    }
  }
}

export function applyTheme(theme: ThemeId, customColors?: Partial<CustomThemeColors> | null) {
  applyThemeEngine(
    theme,
    customColors !== undefined ? customColors : cache?.customColors,
    (t) => THEMES.find((item) => item.id === t)?.swatch[0],
    cache?.roundPosters ?? false,
  )
}
export function applyRoundPosters(round: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.roundPosters = round ? 'true' : 'false'
  // Refresh the pre-paint hint so the next load rounds posters immediately.
  if (cache) applyTheme(cache.theme, cache.customColors)
}
try {
  applyTheme(cache.theme, cache.customColors)
  applyRoundPosters(cache.roundPosters)
} catch {}

const SETTINGS_ENDPOINT = '/__data/settings'
const pendingSettingsChanges = new Map<string, unknown>()
let settingsWriteRunning = false
let settingsRetryTimer: ReturnType<typeof setTimeout> | null = null
let settingsRetryDelay = 1000
/** Statuses that can never succeed on retry: the batch is invalid or oversized. */
const PERMANENT_SETTINGS_FAILURE_STATUSES = new Set([400, 404, 405, 413, 414, 422])

function scheduleSettingsRetry() {
  if (settingsRetryTimer) return
  settingsRetryTimer = setTimeout(() => {
    settingsRetryTimer = null
    void flushSettingsChanges()
  }, settingsRetryDelay)
  unrefTimer(settingsRetryTimer)
  settingsRetryDelay = Math.min(settingsRetryDelay * 2, 30_000)
}

async function flushSettingsChanges() {
  if (settingsWriteRunning || pendingSettingsChanges.size === 0) return
  if (settingsRetryTimer) {
    clearTimeout(settingsRetryTimer)
    settingsRetryTimer = null
  }
  settingsWriteRunning = true
  setPersistenceState('settings', 'saving')
  let permanentFailure = false
  try {
    while (pendingSettingsChanges.size > 0 && !permanentFailure) {
      const changes = Object.fromEntries(pendingSettingsChanges)
      pendingSettingsChanges.clear()
      const body = JSON.stringify(changes)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      try {
        const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden'
        const keepalive = hidden && new TextEncoder().encode(body).byteLength <= 64 * 1024
        const res = await fetch(SETTINGS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive,
          signal: controller.signal,
        })
        if (!res.ok) {
          const message = (await res.text().catch(() => '')).slice(0, 200)
          const permanent =
            PERMANENT_SETTINGS_FAILURE_STATUSES.has(res.status) || /too large/i.test(message)
          if (permanent) {
            // Retrying can never succeed: drop the batch instead of wedging
            // every later settings write behind an eternal retry loop.
            console.error(
              `[settings] database permanently rejected ${Object.keys(changes).length} change(s) (${res.status}${message ? ` — ${message}` : ''}); the batch was dropped and will not be retried`,
            )
            permanentFailure = true
            break
          }
          throw new Error(`Database rejected settings (${res.status})`)
        }
        clearLegacyStorage()
        settingsRetryDelay = 1000
      } catch (e) {
        for (const [key, value] of Object.entries(changes)) {
          if (!pendingSettingsChanges.has(key)) pendingSettingsChanges.set(key, value)
        }
        console.warn('[settings] database unavailable; changes will be retried', e)
        setPersistenceState('settings', 'error')
        scheduleSettingsRetry()
        break
      } finally {
        clearTimeout(timeout)
      }
    }
  } finally {
    settingsWriteRunning = false
    if (permanentFailure) {
      setPersistenceState('settings', 'error')
      // Later, unrelated changes still deserve a save attempt.
      if (pendingSettingsChanges.size > 0) scheduleSettingsRetry()
    } else if (pendingSettingsChanges.size === 0) {
      setPersistenceState('settings', 'saved')
    }
  }
}

/** Coalesce bursts (typing a name, dragging a colour) into one save. */
const SAVE_DEBOUNCE_MS = 400
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null

function flushSoon() {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
  saveDebounceTimer = setTimeout(() => {
    saveDebounceTimer = null
    void flushSettingsChanges()
  }, SAVE_DEBOUNCE_MS)
}

function saveToDatabase(changes: Record<string, unknown>) {
  if (hydrating) {
    hasMutatedDuringHydration = true
    return
  }
  for (const [key, value] of Object.entries(changes)) pendingSettingsChanges.set(key, value)
  if (pendingSettingsChanges.size > 0) {
    setPersistenceState('settings', 'saving')
    flushSoon()
  }
}

/** True while preference changes exist that the database has not confirmed. */
export function hasUnsavedSettingsChanges(): boolean {
  return settingsWriteRunning || saveDebounceTimer !== null || pendingSettingsChanges.size > 0
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (hydrating) retrySettingsLoad()
    void flushSettingsChanges()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer)
      saveDebounceTimer = null
    }
    void flushSettingsChanges()
  })
}

let hydrationAttempt = 0
let hydrationTimer: ReturnType<typeof setTimeout> | null = null
let hydrationRunning = false

/**
 * Load saved preferences. Until this succeeds the app runs on local values;
 * edits made meanwhile are marked dirty and win over the stored copy once it
 * arrives. A failed load retries with backoff instead of giving up.
 */
async function hydrateFromSqlite() {
  if (!hydrating || hydrationRunning || typeof fetch !== 'function') return
  hydrationRunning = true
  let stored: Record<string, unknown>
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)
    try {
      const res = await fetch(SETTINGS_ENDPOINT, { signal: controller.signal, cache: 'no-store' })
      if (!res.ok || !(res.headers.get('content-type') ?? '').includes('application/json')) throw new Error(`HTTP ${res.status}`)
      const result: unknown = await res.json()
      if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Invalid settings payload')
      stored = result as Record<string, unknown>
    } finally {
      clearTimeout(timer)
    }
  } catch {
    hydrationRunning = false
    setPersistenceState('settings', 'error')
    const delay = Math.min(30_000, 1000 * 2 ** hydrationAttempt++)
    hydrationTimer = setTimeout(() => {
      hydrationTimer = null
      void hydrateFromSqlite()
    }, delay)
    unrefTimer(hydrationTimer)
    return
  }
  hydrationRunning = false
  hydrating = false

  stashExtras(stored, { merge: true })
  const sanitized = sanitize(stored as Partial<Settings> & Record<string, unknown>)
  // Keep locally customized values (legacy browser settings and edits made
  // while loading). The database fills the rest and is canonical afterwards.
  const merged: Record<string, unknown> = { ...sanitized }
  for (const [k, v] of Object.entries(cache)) {
    if (dirtyKeys.has(k as keyof Settings) || (legacySettingsPresent && JSON.stringify(v) !== JSON.stringify(DEFAULTS[k as keyof Settings]))) {
      merged[k] = v
    }
  }
  cache = sanitize(merged)
  try {
    applyTheme(cache.theme, cache.customColors)
    applyRoundPosters(cache.roundPosters)
  } catch {}
  const current = withExtras(cache)
  const changes: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(current)) {
    if (JSON.stringify(stored[key]) !== JSON.stringify(value)) changes[key] = value
  }
  if ((legacySettingsPresent || hasMutatedDuringHydration) && Object.keys(changes).length > 0) {
    saveToDatabase(changes)
  } else {
    clearLegacyStorage()
    setPersistenceState('settings', 'saved')
  }
  hasMutatedDuringHydration = false
  dirtyKeys.clear()
  notify()
  notifySettingsHydrated()
}

/** Retry a failed settings load immediately. */
export function retrySettingsLoad() {
  if (!hydrating) return
  if (hydrationTimer) {
    clearTimeout(hydrationTimer)
    hydrationTimer = null
  }
  hydrationAttempt = 0
  void hydrateFromSqlite()
}

// Settings hydration completion signal
const settingsHydrationListeners = new Set<() => void>()
function notifySettingsHydrated() {
  for (const fn of [...settingsHydrationListeners]) fn()
}
export function subscribeSettingsHydrated(cb: () => void): () => void {
  settingsHydrationListeners.add(cb)
  return () => {
    settingsHydrationListeners.delete(cb)
  }
}
export function isSettingsHydrated(): boolean {
  return !hydrating
}
/** Re-renders once saved preferences have loaded. */
export function useSettingsHydrated(): boolean {
  return useSyncExternalStore(subscribeSettingsHydrated, isSettingsHydrated, isSettingsHydrated)
}

/**
 * Apply settings from a backup file. Every value goes through the same
 * sanitizer as stored settings; unknown keys are kept only within the usual
 * bounds. Returns false if the payload was unusable.
 */
export function importSettings(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  const incoming = raw as Record<string, unknown>
  stashExtras(incoming, { merge: true })
  cache = sanitize({ ...cache, ...(incoming as Partial<Settings>) })
  try {
    applyTheme(cache.theme, cache.customColors)
    applyRoundPosters(cache.roundPosters)
  } catch {}
  for (const key of Object.keys(cache) as (keyof Settings)[]) dirtyKeys.add(key)
  if (hydrating) hasMutatedDuringHydration = true
  else saveToDatabase(withExtras(cache))
  notify()
  return true
}

/** The current settings (with unknown keys from newer versions) for backups. */
export function settingsForBackup(): Record<string, unknown> {
  return withExtras(cache)
}

void hydrateFromSqlite()

/** Non-reactive read, for modules that aren't components. Returns copy. */
export const currentSettings = (): Settings => ({ ...cache })

/** Subscribe to one setting: re-renders only when that value changes. */
export function useSetting<K extends keyof Settings>(key: K): Settings[K] {
  return useSyncExternalStore(subscribe, () => cache[key], () => cache[key])
}

export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    let sanitized: Settings[K] = value
    // Validate per-key
    if (key === 'theme' && !THEMES.some((t) => t.id === value)) sanitized = DEFAULTS.theme as Settings[K]
    if (key === 'episodeWatchedColor' && typeof value === 'string') {
      sanitized = (isValidHex(value) ? normalizeHex(value) : DEFAULTS.episodeWatchedColor) as Settings[K]
    }
    if ((key === 'libraryColumns' || key === 'discoverColumns' || key === 'shelfColumns') && typeof value === 'number') {
      sanitized = clamp(value as unknown as number, 3, 10, (DEFAULTS as Record<string, unknown>)[key] as number) as Settings[K]
    }
    if ((key === 'density' && value !== 'comfortable' && value !== 'compact')) {
      return
    }
    const next = sanitize({ ...cache, [key]: sanitized })
    cache = next
    dirtyKeys.add(key)
    if (key === 'theme' || key === 'customColors')
      try {
        applyTheme(cache.theme, cache.customColors)
      } catch {}
    if (key === 'roundPosters')
      try {
        applyRoundPosters(cache.roundPosters)
      } catch {}
    if (hydrating) hasMutatedDuringHydration = true
    else saveToDatabase({ [key]: cache[key] })
    notify()
  }, [])

  return { settings, set }
}
