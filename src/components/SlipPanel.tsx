import { MARKETS } from '../data/seedSlips'
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
      </p>

      <div className="legs">
        {slip.legs.map((leg) => (
          <LegRow
            key={leg.id}
            leg={leg}
            accent={meta.color}
            onSetResult={(result) => onSetResult(leg.id, result)}
          />
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
