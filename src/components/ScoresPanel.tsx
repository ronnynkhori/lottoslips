import { useMemo, useState } from 'react'
import type { ScoreMap, Slip } from '../types'
import { uniqueFixtures } from '../lib/settle'

interface Props {
  slips: Slip[]
  scores: ScoreMap
  onSetScore: (key: string, home: number, away: number) => void
  onClearScore: (key: string) => void
  onApplyScores: () => void
}

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ScoresPanel({
  slips,
  scores,
  onSetScore,
  onClearScore,
  onApplyScores,
}: Props) {
  const fixtures = useMemo(() => uniqueFixtures(slips.filter((s) => !s.rebetOf)), [slips])
  const scored = fixtures.filter((f) => scores[f.key]).length

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>FT scores</h2>
        <button type="button" className="btn btn-primary" onClick={onApplyScores}>
          Apply → settle
        </button>
      </div>
      <div className="panel-body">
        <p className="empty" style={{ paddingTop: 0 }}>
          Enter full-time scores, then apply. Settles TTS / O1.5 / U4.5 / DC / SW automatically.
          Manual W/L/V still wins if you override.
        </p>
        <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.8rem' }}>
          {scored}/{fixtures.length} fixtures scored
        </p>
        <div className="scores-list">
          {fixtures.map((f) => (
            <ScoreRow
              key={f.key}
              kickoff={f.kickoff}
              home={f.home}
              away={f.away}
              competition={f.competition}
              score={scores[f.key]}
              onSave={(h, a) => onSetScore(f.key, h, a)}
              onClear={() => onClearScore(f.key)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ScoreRow({
  kickoff,
  home,
  away,
  competition,
  score,
  onSave,
  onClear,
}: {
  kickoff: string
  home: string
  away: string
  competition: string
  score?: { home: number; away: number }
  onSave: (home: number, away: number) => void
  onClear: () => void
}) {
  const [h, setH] = useState(score?.home ?? 0)
  const [a, setA] = useState(score?.away ?? 0)
  const saved = score != null

  return (
    <div className={`score-row ${saved ? 'saved' : ''}`}>
      <div className="score-meta">
        <strong>
          {home} vs {away}
        </strong>
        <small>
          {competition} · {formatKickoff(kickoff)}
        </small>
      </div>
      <div className="score-inputs">
        <input
          type="number"
          min={0}
          max={20}
          value={h}
          onChange={(e) => setH(Math.max(0, Number(e.target.value) || 0))}
          aria-label={`${home} goals`}
        />
        <span>–</span>
        <input
          type="number"
          min={0}
          max={20}
          value={a}
          onChange={(e) => setA(Math.max(0, Number(e.target.value) || 0))}
          aria-label={`${away} goals`}
        />
        <button type="button" className="btn btn-primary" onClick={() => onSave(h, a)}>
          Save
        </button>
        {saved && (
          <button type="button" className="btn btn-ghost" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
