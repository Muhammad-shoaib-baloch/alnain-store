import { useState } from 'react'
import { cn, formatNumber } from '@/lib/format'

const GOLD = '#B99338'
const GOLD_LIGHT = '#F2D07E'
const INK = '#111009'

/** Smooth-ish area chart (pure SVG, no deps). data: [{label, value}] */
export function AreaChart({ data = [], height = 230, formatValue = formatNumber, color = GOLD }) {
  const [hover, setHover] = useState(null)
  const W = 640
  const H = height
  const PAD = { t: 14, r: 10, b: 26, l: 42 }
  const max = Math.max(...data.map((d) => d.value), 1)
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const x = (i) => PAD.l + (data.length <= 1 ? innerW / 2 : (i * innerW) / (data.length - 1))
  const y = (v) => PAD.t + (1 - v / max) * innerH

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1).toFixed(1)},${PAD.t + innerH} L${x(0).toFixed(1)},${PAD.t + innerH} Z`
  const gridLines = [0.25, 0.5, 0.75, 1]
  const labelEvery = Math.ceil(data.length / 6)

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round(((px - PAD.l) / innerW) * (data.length - 1))
    setHover(Math.min(Math.max(idx, 0), data.length - 1))
  }

  if (!data.length) return <p className="py-10 text-center text-sm text-smoke">No data yet.</p>

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridLines.map((g) => (
          <g key={g}>
            <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + innerH * (1 - g)} y2={PAD.t + innerH * (1 - g)} stroke={INK} strokeOpacity="0.06" />
            <text x={PAD.l - 6} y={PAD.t + innerH * (1 - g) + 3.5} textAnchor="end" fontSize="10" fill={INK} fillOpacity="0.45">
              {formatValue(max * g)}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#areaFill)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fill={INK} fillOpacity="0.45">
              {d.label}
            </text>
          ) : null
        )}
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + innerH} stroke={INK} strokeOpacity="0.18" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(data[hover].value)} r="4.5" fill={color} stroke="#fff" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover != null && (
        <div
          className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 whitespace-nowrap bg-ink px-2.5 py-1.5 text-[11px] font-medium text-ivory shadow-soft"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          {data[hover].label} · {formatValue(data[hover].value)}
        </div>
      )}
    </div>
  )
}

/** Vertical bars. data: [{label, value}] */
export function BarsChart({ data = [], height = 180, color = GOLD_LIGHT, formatValue = formatNumber }) {
  const W = 640
  const H = height
  const PAD = { t: 12, r: 6, b: 24, l: 6 }
  const max = Math.max(...data.map((d) => d.value), 1)
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const bw = Math.max((innerW / data.length) * 0.55, 2)
  const labelEvery = Math.ceil(data.length / 6)

  if (!data.length) return <p className="py-10 text-center text-sm text-smoke">No data yet.</p>

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {data.map((d, i) => {
        const cx = PAD.l + (i + 0.5) * (innerW / data.length)
        const h = (d.value / max) * innerH
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={PAD.t + innerH - h} width={bw} height={Math.max(h, d.value > 0 ? 2 : 0)} fill={d.value ? GOLD : color} fillOpacity={d.value ? 0.9 : 0.35} rx="1.5">
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            </rect>
            {i % labelEvery === 0 && (
              <text x={cx} y={H - 7} textAnchor="middle" fontSize="9.5" fill={INK} fillOpacity="0.45">
                {d.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** Donut with legend. data: [{name, revenue, share}] */
export function DonutChart({ data = [], formatValue = formatNumber }) {
  const COLORS = [GOLD, '#211E17', GOLD_LIGHT, '#8A7A5C', '#D2A94C', '#37332A', '#EAE0CC']
  const R = 54
  const C = 2 * Math.PI * R
  let acc = 0

  if (!data.length) return <p className="py-10 text-center text-sm text-smoke">No data yet.</p>

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#F5F0E6" strokeWidth="16" />
        {data.map((d, i) => {
          const frac = d.share / 100
          const dash = `${frac * C} ${C}`
          const offset = -acc * C
          acc += frac
          return (
            <circle
              key={d.name}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth="16"
              strokeDasharray={dash}
              strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
            >
              <title>{`${d.name}: ${d.share}%`}</title>
            </circle>
          )
        })}
        <text x="70" y="66" textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}>
          {data.length}
        </text>
        <text x="70" y="80" textAnchor="middle" fontSize="8.5" fill={INK} fillOpacity="0.5">
          CATEGORIES
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2.5 text-sm">
            <span className="h-3 w-3 shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate">{d.name}</span>
            <span className="text-xs text-smoke">{formatValue(d.revenue)}</span>
            <span className="w-10 text-right text-xs font-semibold">{d.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Horizontal ranked bars. items: [{label, sub, value, pct}] */
export function BarList({ items = [], formatValue = formatNumber }) {
  if (!items.length) return <p className="py-10 text-center text-sm text-smoke">No data yet.</p>
  return (
    <ul className="space-y-4">
      {items.map((item, i) => (
        <li key={i}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{item.label}</span>
            <span className="shrink-0 text-xs text-smoke">{item.sub}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 bg-cream">
              <div className={cn('h-full bg-gold-500 transition-all duration-500')} style={{ width: `${item.pct}%` }} />
            </div>
            <span className="w-20 shrink-0 text-right text-xs font-semibold">{formatValue(item.value)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
