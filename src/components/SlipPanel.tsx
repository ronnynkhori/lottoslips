import { useMemo } from 'react'
import { MARKETS } from '../data/markets'
import type { Leg, LegResult, Slip } from '../types'
import { potentialReturn, slipLegSummary } from '../lib/stats'

function formatKickoff(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Preferred display order for competitions */
const COMP_ORDER = [
  'Premier League',
  'La Liga',
  'EFL Cup',
  'UCL Play-offs',
  'Saudi Pro League',
]

function groupLegsByCompetition(legs: Leg[]): { competition: string; legs: Leg[] }[] {
  const map = new Map<string, Leg[]>()
  for (const leg of legs) {
    const key = leg.competition?.trim() || 'Other'
    const list = map.get(key) ?? []
    list.push(leg)
    map.set(key, list)
  }

  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
  }

  return [...map.entries()]
    .map(([competition, groupLegs]) => ({ competition, legs: groupLegs }))
    .sort((a, b) => {
      const ai = COMP_ORDER.indexOf(a.competition)
      const bi = COMP_ORDER.indexOf(b.competition)
      const ao = ai === -1 ? 999 : ai
      const bo = bi === -1 ? 999 : bi
      if (ao !== bo) return ao - bo
      return a.competition.localeCompare(b.competition)
    })
}

const RESULTS: { key: LegResult; label: string }[] = [
  { key: 'won', label: 'W' },
  { key: 'lost', label: 'L' },
  { key: 'void', label: 'V' },
  { key: 'pending', label: '–' },
]

interface Props {
  slip: Slip
  onSetResult: (legId: string, result: LegResult) => void
}

export function SlipPanel({ slip, onSetResult }: Props) {
  const meta = MARKETS[slip.marketId]
  const summary = slipLegSummary(slip)
  const estReturn = potentialReturn(slip)
  const groups = useMemo(() => groupLegsByCompetition(slip.legs), [slip.legs])

  return (
    <div>
      <div className="slip-meta">
        <span className={`pill ${summary.dead ? 'dead' : summary.fullHit ? 'ok' : 'open'}`}>
          {summary.dead ? 'DEAD' : summary.fullHit ? 'HIT' : 'OPEN'}
        </span>
        <span>
          {summary.won}W · {summary.lost}L · {summary.pending} left
        </span>
        <span>Stake {slip.stake}</span>
        <span>Est. return {summary.dead ? '0' : `~${estReturn}`}</span>
        {slip.rebetOf && <span className="pill">REBET</span>}
      </div>

      <p style={{ margin: '0 0 0.85rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
        {slip.description} · avg prob{' '}
        {(
          slip.legs.reduce((s, l) => s + l.probability, 0) / Math.max(1, slip.legs.length)
        ).toFixed(0)}
        % · {groups.length} competitions
      </p>

      <div className="legs">
        {groups.map((group) => (
          <section key={group.competition} className="comp-group">
            <header className="comp-group-head">
              <h3>{group.competition}</h3>
              <span>{group.legs.length} legs</span>
            </header>
            <div className="comp-group-legs">
              {group.legs.map((leg) => (
                <LegRow
                  key={leg.id}
                  leg={leg}
                  accent={meta.color}
                  onSetResult={(result) => onSetResult(leg.id, result)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function LegRow({
  leg,
  accent,
  onSetResult,
}: {
  leg: Leg
  accent: string
  onSetResult: (result: LegResult) => void
}) {
  return (
    <div className={`leg ${leg.result}`}>
      <div className="leg-main">
        <div className="leg-fixture">
          {leg.home} vs {leg.away}
        </div>
        <div className="leg-sub">
          <span style={{ color: accent }}>{leg.selection}</span>
          <span>{formatKickoff(leg.kickoff)}</span>
          <span>{leg.probability}%</span>
          <span className="leg-odds">@{leg.odds?.toFixed(2) ?? '—'}</span>
        </div>
      </div>
      <div className="leg-actions">
        {RESULTS.map((r) => (
          <button
            key={r.key}
            type="button"
            className={`chip ${leg.result === r.key ? `active-${r.key === 'pending' ? 'void' : r.key}` : ''}`}
            onClick={() => onSetResult(r.key)}
            title={r.key}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}
