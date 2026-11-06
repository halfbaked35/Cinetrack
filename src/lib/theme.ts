export type ThemeId = 'paper' | 'halide' | 'velvet' | 'blueprint' | 'black' | 'custom'

export type CustomThemeColors = {
  primary: string
  background: string
  card: string
  foreground: string
  mutedForeground: string
  border: string
  secondary: string
  // Optional status overrides
  statusPlanned?: string
  statusWatching?: string
  statusWatched?: string
}

export const THEME_DEFAULTS: Record<Exclude<ThemeId, 'custom'>, CustomThemeColors> = {
  paper: {
    background: '#ffffff',
    card: '#faf8f3',
    foreground: '#14130f',
    primary: '#7a2318',
    border: '#e3ded1',
    mutedForeground: '#74705f',
    secondary: '#f0ede4',
    statusPlanned: '#52525b',
    statusWatching: '#2563eb',
    statusWatched: '#15803d',
  },
  blueprint: {
    background: '#eef1f4',
    card: '#e2e8ee',
    foreground: '#131a21',
    primary: '#1f5673',
    border: '#cbd5df',
    mutedForeground: '#53606d',
    secondary: '#d7dfe7',
    statusPlanned: '#52525b',
    statusWatching: '#2563eb',
    statusWatched: '#15803d',
  },
  halide: {
    background: '#242424',
    card: '#141414',
    foreground: '#ededed',
    primary: '#6fa8c4',
    border: '#333333',
    mutedForeground: '#9a9a9a',
    secondary: '#2e2e2e',
    statusPlanned: '#52525b',
    statusWatching: '#2563eb',
    statusWatched: '#15803d',
  },
  velvet: {
    background: '#100e0d',
    card: '#1c1412',
    foreground: '#f2ede1',
    primary: '#b3402e',
    border: '#352825',
    mutedForeground: '#a49b88',
    secondary: '#271d1a',
    statusPlanned: '#52525b',
    statusWatching: '#2563eb',
    statusWatched: '#15803d',
  },
  black: {
    background: '#000000',
    card: '#0a0a0a',
    foreground: '#f5f5f5',
    primary: '#d93d87',
    border: '#292929',
    mutedForeground: '#a3a3a3',
    secondary: '#171717',
    statusPlanned: '#a1a1aa',
    statusWatching: '#60a5fa',
    statusWatched: '#4ade80',
  },
}

export const DEFAULT_CUSTOM_COLORS: CustomThemeColors = {
  ...THEME_DEFAULTS.paper,
}

export type CuratedPalette = {
  id: string
  name: string
  note: string
  colors: CustomThemeColors
}

export const CURATED_PALETTES: CuratedPalette[] = [
  {
    id: 'criterion-gold',
    name: 'Criterion 35mm',
    note: 'Deep archival navy, gold foil stamp, chalk white',
    colors: {
      background: '#0e121a',
      card: '#161d29',
      foreground: '#f3f4f8',
      primary: '#d4af37',
      border: '#263145',
      mutedForeground: '#8e9bb0',
      secondary: '#1f2738',
      statusPlanned: '#64748b',
      statusWatching: '#d4af37',
      statusWatched: '#22c55e',
    },
  },
  {
    id: 'sepia-gazette',
    name: 'Sepia Gazette',
    note: 'Aged newsprint, walnut ink, terracotta seal',
    colors: {
      background: '#f4ede2',
      card: '#ebe1d2',
      foreground: '#28211a',
      primary: '#8c3d27',
      border: '#d7cabb',
      mutedForeground: '#776756',
      secondary: '#dfd4c3',
      statusPlanned: '#78716c',
      statusWatching: '#8c3d27',
      statusWatched: '#2e7d32',
    },
  },
  {
    id: 'solarized-archive',
    name: 'Solarized Terminal',
    note: 'Deep oceanic teal, warm amber ink, cyan highlights',
    colors: {
      background: '#002b36',
      card: '#073642',
      foreground: '#fdf6e3',
      primary: '#b58900',
      border: '#0d4a59',
      mutedForeground: '#93a1a1',
      secondary: '#0b3f4c',
      statusPlanned: '#657b83',
      statusWatching: '#268bd2',
      statusWatched: '#859900',
    },
  },
  {
    id: 'emerald-repertory',
    name: 'Emerald Can',
    note: 'Vintage celluloid tin, deep pine, bright emerald',
    colors: {
      background: '#0a1410',
      card: '#12211b',
      foreground: '#edf5f1',
      primary: '#2ea070',
      border: '#20392f',
      mutedForeground: '#8aa99c',
      secondary: '#192e25',
      statusPlanned: '#52665d',
      statusWatching: '#2ea070',
      statusWatched: '#10b981',
    },
  },
  {
    id: 'tokyo-safelight',
    name: 'Tokyo Midnight',
    note: 'Midnight blue alley, neon rose curtain, cool silver',
    colors: {
      background: '#090b14',
      card: '#121526',
      foreground: '#e9ecf5',
      primary: '#f43f5e',
      border: '#212642',
      mutedForeground: '#8b93b4',
      secondary: '#191d33',
      statusPlanned: '#6b7280',
      statusWatching: '#38bdf8',
      statusWatched: '#f43f5e',
    },
  },
  {
    id: 'nordic-slate',
    name: 'Nordic Slate',
    note: 'Cold fjord stone, glacier blue ink, crisp type',
    colors: {
      background: '#1a2027',
      card: '#232b34',
      foreground: '#e5ebee',
      primary: '#60a5fa',
      border: '#35414e',
      mutedForeground: '#90a1b2',
      secondary: '#2c3743',
      statusPlanned: '#64748b',
      statusWatching: '#60a5fa',
      statusWatched: '#34d399',
    },
  },
  {
    id: 'curtain-crimson',
    name: 'Palace Crimson',
    note: 'Cinema plush seats, dark mahogany, vivid crimson',
    colors: {
      background: '#150a0d',
      card: '#201014',
      foreground: '#f7edef',
      primary: '#e11d48',
      border: '#391a22',
      mutedForeground: '#a9878f',
      secondary: '#2a161b',
      statusPlanned: '#71717a',
      statusWatching: '#e11d48',
      statusWatched: '#22c55e',
    },
  },
  {
    id: 'monolith-noir',
    name: 'Monolith Noir',
    note: 'Pure zero-light black, razor white, chrome accent',
    colors: {
      background: '#000000',
      card: '#0c0c0c',
      foreground: '#ffffff',
      primary: '#e4e4e7',
      border: '#27272a',
      mutedForeground: '#a1a1aa',
      secondary: '#18181b',
      statusPlanned: '#71717a',
      statusWatching: '#ffffff',
      statusWatched: '#4ade80',
    },
  },
]

export function isValidHex(raw: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw.trim())
}

export function normalizeHex(raw: string): string {
  let hex = raw.trim().replace(/^#/, '')
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  return '#' + hex.toLowerCase()
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!isValidHex(hex)) return null
  const norm = normalizeHex(hex).slice(1)
  const num = parseInt(norm, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 255
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
}

export function getContrastColor(hex: string, darkChoice = '#14130f', lightChoice = '#fdfbf6'): string {
  return getLuminance(hex) >= 142 ? darkChoice : lightChoice
}

const CSS_THEME_VARS = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--border',
  '--ring',
  '--tooth',
  '--status-planned',
  '--status-planned-foreground',
  '--status-watching',
  '--status-watching-foreground',
  '--status-watched',
  '--status-watched-foreground',
] as const

export function applyTheme(
  theme: ThemeId,
  customColors?: Partial<CustomThemeColors> | null,
  getPresetThemeColor?: (t: ThemeId) => string | undefined,
) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = theme

  if (theme === 'custom') {
    const colors: CustomThemeColors = {
      ...DEFAULT_CUSTOM_COLORS,
      ...(customColors ?? {}),
    }

    const primaryHex = normalizeHex(colors.primary)
    const bgHex = normalizeHex(colors.background)
    const fgHex = normalizeHex(colors.foreground)
    const cardHex = normalizeHex(colors.card)
    const borderHex = normalizeHex(colors.border)
    const mutedHex = normalizeHex(colors.mutedForeground)
    const secondaryHex = normalizeHex(colors.secondary)

    root.style.setProperty('--background', bgHex)
    root.style.setProperty('--foreground', fgHex)
    root.style.setProperty('--card', cardHex)
    root.style.setProperty('--card-foreground', fgHex)
    root.style.setProperty('--primary', primaryHex)
    root.style.setProperty('--primary-foreground', getContrastColor(primaryHex))
    root.style.setProperty('--secondary', secondaryHex)
    root.style.setProperty('--secondary-foreground', getContrastColor(secondaryHex))
    root.style.setProperty('--muted', cardHex)
    root.style.setProperty('--muted-foreground', mutedHex)
    root.style.setProperty('--accent', primaryHex)
    root.style.setProperty('--accent-foreground', getContrastColor(primaryHex))
    root.style.setProperty('--border', borderHex)
    root.style.setProperty('--ring', primaryHex)

    const isDark = getLuminance(bgHex) < 130
    root.style.setProperty(
      '--tooth',
      isDark ? 'rgba(245, 245, 245, 0.03)' : 'rgba(20, 19, 15, 0.045)',
    )

    if (colors.statusPlanned && isValidHex(colors.statusPlanned)) {
      const planHex = normalizeHex(colors.statusPlanned)
      root.style.setProperty('--status-planned', planHex)
      root.style.setProperty('--status-planned-foreground', getContrastColor(planHex))
    } else {
      root.style.removeProperty('--status-planned')
      root.style.removeProperty('--status-planned-foreground')
    }

    if (colors.statusWatching && isValidHex(colors.statusWatching)) {
      const watchHex = normalizeHex(colors.statusWatching)
      root.style.setProperty('--status-watching', watchHex)
      root.style.setProperty('--status-watching-foreground', getContrastColor(watchHex))
    } else {
      root.style.removeProperty('--status-watching')
      root.style.removeProperty('--status-watching-foreground')
    }

    if (colors.statusWatched && isValidHex(colors.statusWatched)) {
      const doneHex = normalizeHex(colors.statusWatched)
      root.style.setProperty('--status-watched', doneHex)
      root.style.setProperty('--status-watched-foreground', getContrastColor(doneHex))
    } else {
      root.style.removeProperty('--status-watched')
      root.style.removeProperty('--status-watched-foreground')
    }

    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bgHex)
  } else {
    // Clear all inline overrides so the [data-theme] CSS rules take canonical effect
    for (const v of CSS_THEME_VARS) {
      root.style.removeProperty(v)
    }
    const themeColor = getPresetThemeColor ? getPresetThemeColor(theme) : undefined
    if (themeColor) {
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor)
    }
  }
}
