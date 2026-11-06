/**
 * URL ⇄ view state. The hash carries everything needed for a deep link:
 *
 *   #                 Home              #discover / #library   pages
 *   #about …          info pages        #title/movie/550       a title drawer
 *
 * History entries the app pushes carry `{ cinetrack: Route }` so Back can
 * restore the page underneath an overlay and close overlays one at a time.
 */
import type { MediaType } from './entry'

export type Page = 'home' | 'discover' | 'library'
export type InfoSlug = 'about' | 'privacy' | 'terms' | 'api'
export type Route = {
  page: Page
  info: InfoSlug | null
  title: { type: MediaType; id: number } | null
  settings: boolean
}

export const INFO_SLUGS: readonly InfoSlug[] = ['about', 'privacy', 'terms', 'api']
const PAGES: readonly Page[] = ['home', 'discover', 'library']

export const HOME: Route = { page: 'home', info: null, title: null, settings: false }

/** Parse a location hash (`#library`, `#/library`, `#title/tv/1399`). */
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '').trim()
  const titleMatch = /^title\/(movie|tv)\/(\d{1,10})$/.exec(raw)
  if (titleMatch) {
    const id = Number(titleMatch[2])
    if (Number.isSafeInteger(id) && id > 0) return { ...HOME, title: { type: titleMatch[1] as MediaType, id } }
  }
  if ((INFO_SLUGS as readonly string[]).includes(raw)) return { ...HOME, info: raw as InfoSlug }
  if ((PAGES as readonly string[]).includes(raw)) return { ...HOME, page: raw as Page }
  return HOME
}

export function hashFor(route: Route): string {
  if (route.title) return `#title/${route.title.type}/${route.title.id}`
  if (route.info) return `#${route.info}`
  return route.page === 'home' ? '' : `#${route.page}`
}

/** The route recorded on a history entry, if the app pushed it. */
export function routeFromState(state: unknown): Route | null {
  const route = (state as { cinetrack?: unknown } | null)?.cinetrack as Partial<Route> | undefined
  if (!route || typeof route !== 'object' || !(PAGES as readonly string[]).includes(route.page as string)) return null
  const title = route.title && typeof route.title === 'object' && (route.title.type === 'movie' || route.title.type === 'tv') && Number.isSafeInteger(route.title.id)
    ? { type: route.title.type, id: route.title.id }
    : null
  const info = (INFO_SLUGS as readonly string[]).includes(route.info as string) ? (route.info as InfoSlug) : null
  return { page: route.page as Page, info, title, settings: route.settings === true }
}

export const sameRoute = (a: Route, b: Route) =>
  a.page === b.page && a.info === b.info && a.settings === b.settings &&
  a.title?.type === b.title?.type && a.title?.id === b.title?.id

const PAGE_LABEL: Record<Page, string> = { home: 'Home', discover: 'Discover', library: 'Shelf' }
const INFO_LABEL: Record<InfoSlug, string> = { about: 'About', privacy: 'Privacy', terms: 'Terms', api: 'API' }

export function documentTitleFor(route: Route): string {
  if (route.info) return `${INFO_LABEL[route.info]} · CineTrack`
  return route.page === 'home' ? 'CineTrack' : `${PAGE_LABEL[route.page]} · CineTrack`
}
