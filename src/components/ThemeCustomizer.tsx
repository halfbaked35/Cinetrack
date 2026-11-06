import { useState, useCallback, useEffect } from 'react'
import {
  type CustomThemeColors,
  THEME_DEFAULTS,
  isValidHex,
  normalizeHex,
} from '../lib/theme'
import { useSettings } from '../lib/settings'

const TOKENS: { key: keyof CustomThemeColors; label: string }[] = [
  { key: 'primary', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'card', label: 'Surface' },
  { key: 'foreground', label: 'Text' },
  { key: 'border', label: 'Border' },
  { key: 'mutedForeground', label: 'Muted text' },
]

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  const [text, setText] = useState(value.replace(/^#/, ''))

  useEffect(() => {
    setText(value.replace(/^#/, ''))
  }, [value])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setText(raw)
    if (isValidHex(raw)) {
      onChange(normalizeHex(raw))
    }
  }

  const handleBlur = () => {
    if (isValidHex(text)) {
      const norm = normalizeHex(text)
      setText(norm.replace(/^#/, ''))
      onChange(norm)
    } else {
      setText(value.replace(/^#/, ''))
    }
  }

  const normalized = isValidHex(value) ? normalizeHex(value) : '#000000'

  return (
    <div className="flex items-center justify-between gap-3 border border-border bg-card px-3 py-2">
      <div className="flex items-center gap-3">
        <label
          className="press relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center border border-border transition-transform hover:scale-105"
          style={{ backgroundColor: normalized }}
          title={`Pick ${label.toLowerCase()} color`}
        >
          <input
            type="color"
            value={normalized}
            onChange={(e) => {
              setText(e.target.value.replace(/^#/, ''))
              onChange(e.target.value)
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`${label} color picker`}
          />
        </label>
        <span className="font-sans text-[13px] text-foreground">{label}</span>
      </div>

      <div className="flex items-center border border-border bg-background px-2">
        <span className="font-mono text-[11px] text-muted-foreground">#</span>
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          maxLength={6}
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
  const customColors = settings.customColors

  const handleUpdate = useCallback(
    (key: keyof CustomThemeColors, hex: string) => {
      const next = {
        ...customColors,
        [key]: normalizeHex(hex),
      }
      set('customColors', next)
      if (settings.theme !== 'custom') {
        set('theme', 'custom')
      }
    },
    [customColors, set, settings.theme],
  )

  const handleReset = useCallback(() => {
    const baseline = settings.theme !== 'custom' ? THEME_DEFAULTS[settings.theme] : THEME_DEFAULTS.paper
    set('customColors', { ...baseline })
  }, [set, settings.theme])

  return (
    <div className="space-y-1.5">
      {TOKENS.map(({ key, label }) => (
        <ColorRow
          key={key}
          label={label}
          value={customColors[key] ?? THEME_DEFAULTS.paper[key] ?? '#000000'}
          onChange={(hex) => handleUpdate(key, hex)}
        />
      ))}

      <div className="flex items-center justify-between pt-2">
        <span className="rule-label">
          {settings.theme === 'custom' ? 'Custom colors active' : 'Editing switches to Custom'}
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="press font-sans text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  )
}
