const harvestedCountEl = document.getElementById('harvested-count')
const countsListEl = document.getElementById('counts-list')
const todayTokensEl = document.getElementById('today-tokens')
const todayCharsEl = document.getElementById('today-chars')
const ratioDonutEl = document.getElementById('ratio-donut')
const ratioAiPctEl = document.getElementById('ratio-ai-pct')
const ratioTypedPctEl = document.getElementById('ratio-typed-pct')
const weekChartEl = document.getElementById('week-chart')
const bestDayCardEl = document.getElementById('best-day-card')
const bestDayValueEl = document.getElementById('best-day-value')
const bestDayDateEl = document.getElementById('best-day-date')

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

window.addEventListener('message', (event) => {
  const message = event.data
  if (message.type !== 'stats') return
  render(message.stats)
})

const COUNT_ROWS = [
  { kind: 'tree', color: 'normal' },
  { kind: 'tree', color: 'silver' },
  { kind: 'tree', color: 'gold' },
  { kind: 'crop', color: 'normal' },
  { kind: 'crop', color: 'silver' },
  { kind: 'crop', color: 'gold' },
]

function render(stats) {
  harvestedCountEl.textContent = stats.harvestedCount
  renderCounts(stats.counts)
  todayTokensEl.textContent = formatTokensCompact(stats.todayTokens)
  todayCharsEl.textContent = formatTokensCompact(stats.todayChars)

  const total = stats.aiTokensSinceInstall + stats.typedTokensSinceInstall
  const aiPercent = total > 0 ? (stats.aiTokensSinceInstall / total) * 100 : 50
  ratioDonutEl.style.setProperty('--ratio-ai-percent', `${aiPercent}%`)
  ratioAiPctEl.textContent = `${Math.round(aiPercent)}%`
  ratioTypedPctEl.textContent = `${Math.round(100 - aiPercent)}%`

  renderWeekChart(stats.weekHistory)
  renderBestDay(stats.bestDay)
}

function renderCounts(counts) {
  countsListEl.innerHTML = ''
  for (const { kind, color } of COUNT_ROWS) {
    const row = document.createElement('div')
    row.className = 'rarity-row'

    const kindRarity = document.createElement('span')
    renderKindAndRarity(kindRarity, kind, color)
    row.appendChild(kindRarity)

    const value = document.createElement('span')
    value.className = 'stat-value'
    value.textContent = counts[kind][color]
    row.appendChild(value)

    countsListEl.appendChild(row)
  }
}

function renderBestDay(bestDay) {
  if (!bestDay) {
    bestDayCardEl.style.display = 'none'
    return
  }
  bestDayCardEl.style.display = 'flex'

  const [year, month, dayOfMonth] = bestDay.date.split('-').map(Number)
  const date = new Date(year, month - 1, dayOfMonth)
  const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  bestDayValueEl.textContent = formatTokensCompact(bestDay.aiTokens + bestDay.typedTokens)
  bestDayDateEl.textContent = `${label} · ${daysAgoLabel(date)}`
}

function daysAgoLabel(date) {
  const today = new Date()
  const msPerDay = 24 * 60 * 60 * 1000
  const daysAgo = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - date) / msPerDay)
  if (daysAgo <= 0) return 'today'
  if (daysAgo === 1) return 'yesterday'
  return `${daysAgo} days ago`
}

function renderWeekChart(weekHistory) {
  const maxTotal = Math.max(1, ...weekHistory.map((day) => day.aiTokens + day.typedTokens))

  weekChartEl.innerHTML = ''
  for (const day of weekHistory) {
    const dayTotal = day.aiTokens + day.typedTokens
    const stackHeight = (dayTotal / maxTotal) * 100

    const column = document.createElement('div')
    column.className = 'week-bar-column'

    const stack = document.createElement('div')
    stack.className = 'week-bar-stack'
    stack.style.height = `${stackHeight}%`
    stack.title = `${formatTokensCompact(dayTotal)} (AI ${formatTokensCompact(day.aiTokens)} / Typed ${formatTokensCompact(day.typedTokens)})`

    const aiBar = document.createElement('div')
    aiBar.className = 'week-bar-ai'
    aiBar.style.height = dayTotal > 0 ? `${(day.aiTokens / dayTotal) * 100}%` : '0%'

    const typedBar = document.createElement('div')
    typedBar.className = 'week-bar-typed'
    typedBar.style.height = dayTotal > 0 ? `${(day.typedTokens / dayTotal) * 100}%` : '0%'

    stack.appendChild(aiBar)
    stack.appendChild(typedBar)

    const [year, month, dayOfMonth] = day.date.split('-').map(Number)
    const label = document.createElement('div')
    label.className = 'week-bar-label'
    label.textContent = weekdayLabels[new Date(year, month - 1, dayOfMonth).getDay()]

    column.appendChild(stack)
    column.appendChild(label)
    weekChartEl.appendChild(column)
  }
}
