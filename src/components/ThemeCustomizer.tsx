import { useCallback, useEffect, useState } from 'react'
import {
  contrastRatio,
  CURATED_PALETTES,
  type CustomThemeColors,
  THEME_DEFAULTS,
  isValidHex,
  normalizeHex,
} from '../lib/theme'
import { useSettings } from '../lib/settings'
import { useToast } from './Toast'

const TOKENS: { key: keyof CustomThemeColors; label: string }[] = [
  { key: 'primary', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'card', label: 'Surface' },
  { key: 'secondary', label: 'Secondary surface' },
  { key: 'foreground', label: 'Text' },
  { key: 'mutedForeground', label: 'Muted text' },
  { key: 'border', label: 'Border' },
  { key: 'statusPlanned', label: 'Planned' },
  { key: 'statusWatching', label: 'Watching' },
  { key: 'statusWatched', label: 'Watched' },
]

/** Pairs the interface depends on, with the WCAG minimum each needs. */
const CONTRAST_CHECKS: { label: string; fg: keyof CustomThemeColors; bg: keyof CustomThemeColors; min: number }[] = [
  { label: 'Text on background', fg: 'foreground', bg: 'background', min: 4.5 },
  { label: 'Text on surface', fg: 'foreground', bg: 'card', min: 4.5 },
  { label: 'Muted text on background', fg: 'mutedForeground', bg: 'background', min: 4.5 },
  { label: 'Accent on background', fg: 'primary', bg: 'background', min: 3 },
]

/** Expand a complete hex value; null while the user is mid-way through typing one. */
function parseHex(raw: string, allowShort: boolean): string | null {
  const clean = raw.trim().replace(/^#/, '')
  if (clean.length === 6 || (allowShort && clean.length === 3)) return isValidHex(clean) ? normalizeHex(clean) : null
  return null
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState(value.replace(/^#/, ''))
  const [editing, setEditing] = useState(false)

  // Follow outside changes (picker, palette, reset) — but never overwrite
  // what the user is typing.
  useEffect(() => {
    if (!editing) setText(value.replace(/^#/, ''))
  }, [value, editing])

  const commit = () => {
    setEditing(false)
    const hex = parseHex(text, true)
    if (hex) {
      setText(hex.slice(1))
      if (hex !== value) onChange(hex)
    } else {
      setText(value.replace(/^#/, ''))
    }
  }

  const normalized = isValidHex(value) ? normalizeHex(value) : '#000000'

  return (
    <div className="flex items-center justify-between gap-3 border border-border bg-card px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="press relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center border border-[var(--input)] transition-transform hover:scale-105 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--foreground)]"
          style={{ backgroundColor: normalized }}
        >
          <input
            type="color"
            value={normalized}
            onChange={(e) => {
              setText(e.target.value.replace(/^#/, ''))
              onChange(e.target.value)
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`${label} colour`}
          />
        </span>
        <span className="truncate font-sans text-[13px] text-foreground">{label}</span>
      </div>

      <div className="flex items-center border border-[var(--input)] bg-background px-2 focus-within:border-[var(--foreground)]">
        <span aria-hidden="true" className="font-mono text-[11px] text-muted-foreground">#</span>
        <input
          type="text"
          inputMode="text"
          value={text}
          onFocus={() => setEditing(true)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9a-f#]/gi, '').replace(/#/g, '').slice(0, 6)
            setText(raw)
            // Apply live only once a full six-digit value is typed: committing
            // "abc" as #aabbcc mid-way used to block typing the rest.
            const hex = parseHex(raw, false)
            if (hex && hex !== value) onChange(hex)
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') {
              e.stopPropagation()
              setText(value.replace(/^#/, ''))
              setEditing(false)
              e.currentTarget.blur()
            }
          }}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          aria-label={`${label} hex code`}
          className="h-7 w-16 bg-transparent px-1 font-mono text-[12px] uppercase tracking-wider text-foreground outline-none"
        />
      </div>
    </div>
  )
}

export default function ThemeCustomizer() {
  const { settings, set } = useSettings()
  const { toast } = useToast()
  const customColors = settings.customColors
  const base = THEME_DEFAULTS.paper

  const apply = useCallback(
    (next: CustomThemeColors) => {
      set('customColors', next)
      if (settings.theme !== 'custom') set('theme', 'custom')
    },
    [set, settings.theme],
  )

  const handleUpdate = useCallback(
    (key: keyof CustomThemeColors, hex: string) => apply({ ...customColors, [key]: normalizeHex(hex) }),
    [apply, customColors],
  )

  const handleReset = useCallback(() => {
    const previous = customColors
    const baseline = settings.theme !== 'custom' ? THEME_DEFAULTS[settings.theme] : THEME_DEFAULTS.paper
    set('customColors', { ...baseline })
    toast('Colours reset', 'info', { action: { label: 'Undo', onAction: () => set('customColors', previous) } })
  }, [customColors, set, settings.theme, toast])

  const colour = (key: keyof CustomThemeColors) => customColors[key] ?? base[key] ?? '#000000'
  const failing = CONTRAST_CHECKS.map((check) => ({ ...check, ratio: contrastRatio(colour(check.fg), colour(check.bg)) })).filter(
    (check) => check.ratio < check.min,
  )

  return (
    <div className="space-y-3">
      <div>
        <div className="rule-label mb-2">Starting points</div>
        <div className="flex flex-wrap gap-1.5">
          {CURATED_PALETTES.map((palette) => (
            <button
              key={palette.id}
              type="button"
              onClick={() => apply({ ...palette.colors })}
              title={palette.note}
              className="press flex items-center gap-2 border border-border px-2.5 py-1.5 font-sans text-[11px] text-foreground hover:border-[var(--foreground)]"
            >
              <span aria-hidden="true" className="flex">
                {[palette.colors.background, palette.colors.foreground, palette.colors.primary].map((c) => (
                  <span key={c} className="h-3 w-3 border border-black/10" style={{ backgroundColor: c }} />
                ))}
              </span>
              {palette.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        {TOKENS.map(({ key, label }) => (
          <ColorRow key={key} label={label} value={colour(key)} onChange={(hex) => handleUpdate(key, hex)} />
        ))}
      </div>

      <div role="status" aria-live="polite">
        {failing.length > 0 && (
          <div className="border border-[var(--destructive)]/50 bg-[var(--destructive)]/10 px-3 py-2 text-[12px] leading-relaxed text-foreground">
            <strong className="font-medium">Low contrast.</strong> These pairs may be hard to read:
            <ul className="mt-1 list-disc pl-5">
              {failing.map((check) => (
                <li key={check.label}>
                  {check.label}: {check.ratio.toFixed(1)}:1 (needs {check.min}:1)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="rule-label">{settings.theme === 'custom' ? 'Custom colours active' : 'Editing switches to Custom'}</span>
        <button
          type="button"
          onClick={handleReset}
          className="press font-sans text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Reset colours
        </button>
      </div>
    </div>
  )
}
