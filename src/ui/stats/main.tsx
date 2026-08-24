import { render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { formatTokensCompact, GardenColor, GardenKind, KindRarity } from '../shared.js'

interface GardenCounts {
  tree: Record<GardenColor, number>
  crop: Record<GardenColor, number>
}

interface DayUsage {
  date: string
  aiTokens: number
  typedTokens: number
}

interface BestDay {
  date: string
  aiTokens: number
  typedTokens: number
}

interface CompanionStats {
  harvestedCount: number
  counts: GardenCounts
  todayTokens: number
  todayChars: number
  aiTokensSinceInstall: number
  typedTokensSinceInstall: number
  weekHistory: DayUsage[]
  bestDay: BestDay | null
}

interface StatsMessage {
  type: 'stats'
  stats: CompanionStats
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const COUNT_ROWS: { kind: GardenKind; color: GardenColor }[] = [
  { kind: 'tree', color: 'normal' },
  { kind: 'tree', color: 'silver' },
  { kind: 'tree', color: 'gold' },
  { kind: 'crop', color: 'normal' },
  { kind: 'crop', color: 'silver' },
  { kind: 'crop', color: 'gold' },
]

function daysAgoLabel(date: Date): string {
  const today = new Date()
  const msPerDay = 24 * 60 * 60 * 1000
  const daysAgo = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - date.getTime()) / msPerDay,
  )
  if (daysAgo <= 0) return 'today'
  if (daysAgo === 1) return 'yesterday'
  return `${daysAgo} days ago`
}

function parseLocalDate(date: string): Date {
  const [year, month, dayOfMonth] = date.split('-').map(Number) as [number, number, number]
  return new Date(year, month - 1, dayOfMonth)
}

function App() {
  const [stats, setStats] = useState<CompanionStats | null>(null)

  useEffect(() => {
    const onMessage = (event: MessageEvent<StatsMessage>) => {
      if (event.data.type !== 'stats') return
      setStats(event.data.stats)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (!stats) return null

  const total = stats.aiTokensSinceInstall + stats.typedTokensSinceInstall
  const aiPercent = total > 0 ? (stats.aiTokensSinceInstall / total) * 100 : 50

  return (
    <>
      <div className="stat-row">
        <span className="stat-label">Harvested</span>
        <span className="stat-value">{stats.harvestedCount}</span>
      </div>
      <div className="rarity-section">
        {COUNT_ROWS.map(({ kind, color }) => (
          <div className="rarity-row" key={`${kind}|${color}`}>
            <span>
              <KindRarity kind={kind} color={color} />
            </span>
            <span className="stat-value">{stats.counts[kind][color]}</span>
          </div>
        ))}
      </div>
      <div className="stat-section">
        <div className="stat-row">
          <span className="stat-label">Tokens today</span>
          <span className="stat-value">{formatTokensCompact(stats.todayTokens)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Characters today</span>
          <span className="stat-value">{formatTokensCompact(stats.todayChars)}</span>
        </div>
      </div>
      <div className="stat-section">
        <div id="ratio-donut" style={{ '--ratio-ai-percent': `${aiPercent}%` }} />
        <div className="legend-row">
          <span className="legend-dot legend-ai" />
          <span className="legend-label">AI</span>
          <span className="stat-value">{Math.round(aiPercent)}%</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot legend-typed" />
          <span className="legend-label">Typed</span>
          <span className="stat-value">{Math.round(100 - aiPercent)}%</span>
        </div>
      </div>
      <div className="stat-section">
        <WeekChart weekHistory={stats.weekHistory} />
        <div className="legend-row">
          <span className="legend-dot legend-ai" />
          <span className="legend-label">AI</span>
          <span className="legend-dot legend-typed" />
          <span className="legend-label">Typed</span>
        </div>
        <BestDayCard bestDay={stats.bestDay} />
      </div>
    </>
  )
}

function WeekChart({ weekHistory }: { weekHistory: DayUsage[] }) {
  const maxTotal = Math.max(1, ...weekHistory.map((day) => day.aiTokens + day.typedTokens))

  return (
    <div id="week-chart">
      {weekHistory.map((day) => {
        const dayTotal = day.aiTokens + day.typedTokens
        const stackHeight = (dayTotal / maxTotal) * 100
        const aiHeight = dayTotal > 0 ? (day.aiTokens / dayTotal) * 100 : 0
        const typedHeight = dayTotal > 0 ? (day.typedTokens / dayTotal) * 100 : 0
        const label = weekdayLabels[parseLocalDate(day.date).getDay()]

        return (
          <div className="week-bar-column" key={day.date}>
            <div
              className="week-bar-stack"
              style={{ height: `${stackHeight}%` }}
              title={`${formatTokensCompact(dayTotal)} (AI ${formatTokensCompact(day.aiTokens)} / Typed ${formatTokensCompact(day.typedTokens)})`}
            >
              <div className="week-bar-ai" style={{ height: `${aiHeight}%` }} />
              <div className="week-bar-typed" style={{ height: `${typedHeight}%` }} />
            </div>
            <div className="week-bar-label">{label}</div>
          </div>
        )
      })}
    </div>
  )
}

function BestDayCard({ bestDay }: { bestDay: BestDay | null }) {
  if (!bestDay) return <div id="best-day-card" style={{ display: 'none' }} />

  const date = parseLocalDate(bestDay.date)
  const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div id="best-day-card" style={{ display: 'flex' }}>
      <div id="best-day-trophy">🏆</div>
      <div id="best-day-info">
        <div id="best-day-title">Best day</div>
        <div id="best-day-value">{formatTokensCompact(bestDay.aiTokens + bestDay.typedTokens)}</div>
        <div id="best-day-date">
          {label} · {daysAgoLabel(date)}
        </div>
      </div>
    </div>
  )
}

render(<App />, document.body)
