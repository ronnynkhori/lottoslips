import { useMemo } from 'react'
import { MARKETS } from '../data/markets'
import type { Leg, LegResult, Slip } from '../types'
import { potentialReturn, slipLegSummary } from '../lib/stats'
import { valueEdge, valueScore } from '../lib/value'

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
  'Bundesliga',
  'Serie A',
  'Ligue 1',
  'EFL Cup',
  'FA Cup',
  'UCL',
  'Saudi Pro League',
  'Scotland',
  'Portugal',
  'Turkey',
  'Egypt',
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
  const sortByProb =
    slip.marketId === 'straight_win' || slip.marketId === 'mixed'
  const groups = useMemo(() => {
    if (sortByProb) {
      const sorted = [...slip.legs].sort(
        (a, b) =>
          valueScore(b.probability, b.odds) - valueScore(a.probability, a.odds) ||
          b.odds - a.odds,
      )
      const label =
        slip.marketId === 'straight_win'
          ? 'Value 1X2 · sorted by edge'
          : 'Value mix · best edge per fixture'
      return [{ competition: label, legs: sorted }]
    }
    return groupLegsByCompetition(slip.legs)
  }, [slip.legs, sortByProb, slip.marketId])

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
        %
        {sortByProb
          ? ` · sorted by value · min edge ${(
              (Math.min(...slip.legs.map((l) => valueEdge(l.probability, l.odds))) - 1) *
              100
            ).toFixed(0)}% · avg odds ${(
              slip.legs.reduce((s, l) => s + l.odds, 0) / Math.max(1, slip.legs.length)
            ).toFixed(2)}`
          : ` · ${groups.length} competitions`}
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
                  showCompetition={sortByProb}
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
  showCompetition,
}: {
  leg: Leg
  accent: string
  onSetResult: (result: LegResult) => void
  showCompetition?: boolean
}) {
  return (
    <div className={`leg ${leg.result}`}>
      <div className="leg-main">
        <div className="leg-fixture">
          {leg.home} vs {leg.away}
        </div>
        <div className="leg-sub">
          <span style={{ color: accent }}>{leg.selection}</span>
          {showCompetition && (
            <span>
              {leg.settleKind === 'double_chance'
                ? 'Double Chance'
                : leg.settleKind === 'straight_win'
                  ? '1X2'
                  : leg.competition}
              {(leg.settleKind === 'straight_win' || leg.settleKind === 'double_chance') &&
                ` · ${leg.competition}`}
            </span>
          )}
          <span>{formatKickoff(leg.kickoff)}</span>
          <span>{leg.probability}%</span>
          <span className="leg-odds">@{leg.odds?.toFixed(2) ?? '—'}</span>
          {showCompetition && (
            <span>edge +{((valueEdge(leg.probability, leg.odds) - 1) * 100).toFixed(0)}%</span>
          )}
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
