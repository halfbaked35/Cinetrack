import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react'

/* ── the curved row ──────────────────────────────────────────────
 * Adapted from the "Tilted Grid Hero" component. One row of images streams
 * from right to left around the inside of a cylinder: the centre faces you
 * flat, the ends bend toward you, and the ends fade into the page.
 *
 * A CSS box can't bend, so every tile is cut into `slices` vertical strips,
 * each a flat facet of the cylinder showing its share of the image. The
 * strips sit still inside their tile; the tile (preserve-3d) is what moves,
 * one rotateY about the cylinder's axis. Only a tile's delay differs.
 *
 * CineTrack changes: the keyframes live in index.css (`tgh-orbit`) and read
 * the per-instance geometry from custom properties, because the production
 * Content-Security-Policy forbids injected <style> elements. Tiles wrap only
 * past the frame's edge, where the end fade already hides them, so the
 * original per-instance visibility keyframes are not needed. Corners use the
 * app's 2px radius.
 * ─────────────────────────────────────────────────────────────── */

/** Default strips per tile; narrow (portrait) tiles read as curved with far fewer, down to one facet. */
const DEFAULT_SLICES = 16
const CAMERA = 1.6
const MAX_WIDTH = 55

/** Cylinder radius, as a share of width, that puts the frame's edge `bend` radians round the arc. */
function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend))
}

function measure(width: number, height: number, tile: number, aspect: number, gap: number, bend: number) {
  const h = Math.min((tile / 100) * height, ((MAX_WIDTH / 100) * width) / aspect)
  const radius = width * arc(bend)
  if (!(h > 0) || !(radius > 0)) return { columns: 2, sweep: 0, unit: 0 }
  const deg = (rad: number) => (rad * 180) / Math.PI
  const unit = deg(h / radius)
  const pitch = (aspect + gap / 100) * unit
  const limit = deg(bend) + (aspect * unit) / 2
  // Capped so a hero squeezed to a sliver can't mount thousands of tiles.
  const columns = Math.min(60, Math.max(2, Math.ceil((2 * limit) / pitch)))
  const round = (n: number) => +n.toFixed(4)
  return { columns, sweep: round((columns * pitch) / 2), unit: round(unit) }
}

export type TiltedGridImage = { src: string; alt?: string }

export type TiltedGridHeroProps = {
  /** Images run along the row in order; a tile takes its next one each time it wraps out of sight. */
  images: TiltedGridImage[]
  /** Seconds for the row to advance by one tile. @default 4 */
  speed?: number
  /** Tile height, as a percentage of the hero's height. @default 26 */
  tileHeight?: number
  /** Tile width divided by tile height. @default 16 / 9 */
  aspectRatio?: number
  /** Space between tiles, as a percentage of a tile's height. @default 6 */
  gap?: number
  /** Vertical centre of the row, as a percentage of the hero's height. @default 56 */
  axis?: number
  /** How far the row bends round by the frame's edge, in degrees (5–85). @default 80 */
  curve?: number
  /** Width of the fade at each end, as a percentage of the hero's width. @default 12 */
  fade?: number
  /**
   * Flat facets per tile. 16 bends a wide tile smoothly; a narrow portrait
   * tile spans so little arc that 1 reads the same at a fraction of the
   * compositing cost (each facet is its own 3D layer). @default 16
   */
  slices?: number
  children?: ReactNode
  className?: string
}

export function TiltedGridHero({
  images,
  speed = 4,
  tileHeight = 26,
  aspectRatio = 16 / 9,
  gap = 6,
  axis = 56,
  curve = 80,
  fade = 12,
  slices = DEFAULT_SLICES,
  children,
  className = '',
  ...props
}: Omit<ComponentProps<'div'>, 'children'> & TiltedGridHeroProps) {
  const ref = useRef<HTMLDivElement>(null)
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180

  // Null until measured; the band stays hidden so a wrong first layout never shows.
  const [layout, setLayout] = useState<ReturnType<typeof measure> | null>(null)
  // The image each tile shows; it only changes when the tile wraps, out of sight.
  const [shown, setShown] = useState<Record<number, number>>({})

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      const next = measure(width, height, tileHeight, aspectRatio, gap, bend)
      setLayout((prev) => (prev?.columns === next.columns && prev.sweep === next.sweep && prev.unit === next.unit ? prev : next))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [tileHeight, aspectRatio, gap, bend])

  // Tiles are spaced along the arc by their animation delay alone, which only
  // holds if every tile runs on the same clock. Tiles mounted later (a resize
  // that adds columns) would start fresh and bunch up, leaving half the arc
  // empty, so pin every tile's animation to one shared origin.
  useEffect(() => {
    const el = ref.current
    if (!el || !layout) return
    for (const tile of el.querySelectorAll<HTMLElement>('.tgh-tile')) {
      for (const animation of tile.getAnimations()) {
        if (animation.playState === 'paused') animation.currentTime = 0
        else animation.startTime = 0
      }
    }
  }, [layout])

  // Fetch every image up front: a tile picks up its next one just before it returns.
  useEffect(() => {
    for (const { src } of images) new Image().src = src
  }, [images])

  const { columns, sweep, unit } = layout ?? measure(1200, 560, tileHeight, aspectRatio, gap, bend)

  // Every length is a multiple of the tile's height.
  const u = (n: number) => `calc(${+n.toFixed(4)} * min(${tileHeight}cqh, ${+(MAX_WIDTH / aspectRatio).toFixed(4)}cqw))`
  const r = 100 * arc(bend)
  const radius = `${+r.toFixed(3)}cqw`
  const turn = (deg: number) => `translateZ(${radius}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${radius})`

  const SLICES = Math.max(1, Math.round(slices))
  const share = aspectRatio / SLICES
  const duration = columns * speed

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      {...props}
      // Clipped on the sides only: tiles near the ends swing toward the camera
      // and grow taller than the band, so a vertical clip would crop them.
      style={{ containerType: 'size', overflowX: 'clip', overflowY: 'visible', ...props.style }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: layout ? 1 : 0,
          perspective: `${+(r * CAMERA).toFixed(3)}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
        }}
      >
        {Array.from({ length: columns }, (_, t) => {
          // Tile `columns - 1` starts nearest the exit, so this numbers tiles in arrival order.
          const first = columns - 1 - t
          const img = images[(shown[t] ?? first) % Math.max(images.length, 1)]
          return (
            <div
              key={t}
              className="tgh-tile absolute"
              style={
                {
                  '--tgh-r': radius,
                  '--tgh-sweep': `${sweep}deg`,
                  '--tgh-duration': `${duration}s`,
                  left: `calc(50% - ${u(aspectRatio / 2)})`,
                  top: `calc(${axis}% - ${u(0.5)})`,
                  width: u(aspectRatio),
                  height: u(1),
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                  animation: `tgh-orbit ${duration}s linear ${-t * speed}s infinite`,
                } as CSSProperties
              }
              onAnimationIteration={(e) => {
                const lap = Math.round(e.elapsedTime / duration)
                setShown((prev) => {
                  const next = lap * columns + first
                  return prev[t] === next ? prev : { ...prev, [t]: next }
                })
              }}
            >
              {Array.from({ length: SLICES }, (_, k) => (
                <div
                  key={k}
                  className={`absolute top-0 bg-muted bg-no-repeat ${k === 0 ? 'rounded-l-[2px]' : ''} ${
                    k === SLICES - 1 ? 'rounded-r-[2px]' : ''
                  }`}
                  style={{
                    left: u((aspectRatio - share) / 2),
                    // A pixel wider than its share so neighbouring facets overlap without a hairline.
                    width: k === SLICES - 1 ? u(share) : `calc(${u(share)} + 1px)`,
                    height: u(1),
                    transform: SLICES === 1 ? undefined : turn((aspectRatio / 2 - (k + 0.5) * share) * unit),
                    // One decoded image shared by every facet, offset to its own share.
                    backgroundImage: img ? `url("${img.src}")` : undefined,
                    backgroundSize: `${u(aspectRatio)} ${u(1)}`,
                    backgroundPosition: `calc(-1 * ${u(k * share)}) 0`,
                  }}
                />
              ))}
            </div>
          )
        })}
      </div>

      {/* The ends fade into the page with two still overlays: a mask over a
          moving 3D subtree forces a full offscreen render on every frame. */}
      {/* Taller than the band so they also cover end tiles that grow past it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-1/2 left-0"
        style={{ width: `${fade}%`, background: 'linear-gradient(90deg, var(--background), transparent)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-1/2 right-0"
        style={{ width: `${fade}%`, background: 'linear-gradient(270deg, var(--background), transparent)' }}
      />

      {children}
    </div>
  )
}

export default TiltedGridHero
