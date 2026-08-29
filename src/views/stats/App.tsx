import { Fragment, render } from 'preact'
import { formatRelativeDate } from '../../utils/format.js'
import '../shared.css'
import { WithMessage } from '../WithMessage.js'
import './styles.css'

const COLORS = ['red', 'blue', 'yellow', 'orange', 'green', 'purple']

export interface IStatsProps {
  harvestedCount: number
  todayTokens: Record<string, string>
  bestDay: {
    date: string
    totalTokens: string
  }
  weekHistory: {
    date: string
    percent: string
    tokens: string
    values: {
      source: string
      percent: string
      tokens: string
    }[]
  }[]
  legend: string[]
}

function App({ harvestedCount, todayTokens, bestDay, weekHistory, legend }: IStatsProps) {
  return (
    <>
      <dl>
        <dt>Harvested</dt>
        <dd>{harvestedCount}</dd>
      </dl>

      <hr />

      <h4>Today's tokens</h4>
      <dl>
        {Object.entries(todayTokens).map(([name, value]) => (
          <Fragment key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </dl>

      <hr />

      <h4>🏆 Best day</h4>
      <p>
        {bestDay.totalTokens} · {bestDay.date} · {formatRelativeDate(bestDay.date)}
      </p>

      <hr />

      <h4>Last 7 days</h4>

      <div class="chart">
        {weekHistory.map((day) => (
          <div
            class="bar-outer"
            title={
              day.date &&
              `Total: ${day.tokens} | ${day.values.map((value) => `${value.source}: ${value.tokens}`).join(' | ')}`
            }
          >
            <div key={day.date} class="bar" style={{ height: day.percent }}>
              {day.values.map((value, index) => (
                <div
                  key={value.source}
                  style={{
                    height: value.percent,
                    backgroundColor: `var(--vscode-charts-${COLORS[index % COLORS.length]})`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        {weekHistory.map((day) => (
          <small>{day.date}</small>
        ))}
      </div>

      <ul>
        {legend.map((source, index) => (
          <li key={source}>
            <span style={{ color: `var(--vscode-charts-${COLORS[index % COLORS.length]})` }}>●</span> {source}
          </li>
        ))}
      </ul>
    </>
  )
}

render(<WithMessage view={App} />, document.body)
