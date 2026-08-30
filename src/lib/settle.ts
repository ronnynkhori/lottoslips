import type { Leg, LegResult, ScoreMap, Slip } from '../types'

export function fixtureKey(kickoff: string, home: string, away: string): string {
  return `${kickoff}|${home}|${away}`
}

export function settleFromScore(leg: Leg, homeGoals: number, awayGoals: number): LegResult {
  const total = homeGoals + awayGoals

  switch (leg.settleKind) {
    case 'team_to_score': {
      const side = leg.scoringSide ?? 'away'
      const goals = side === 'home' ? homeGoals : awayGoals
      return goals >= 1 ? 'won' : 'lost'
    }
    case 'over_1_5':
      return total >= 2 ? 'won' : 'lost'
    case 'under_4_5':
      return total <= 4 ? 'won' : 'lost'
    case 'double_chance': {
      const side = leg.dcSide ?? '1X'
      if (side === '1X') return homeGoals >= awayGoals ? 'won' : 'lost'
      if (side === 'X2') return awayGoals >= homeGoals ? 'won' : 'lost'
      return homeGoals !== awayGoals ? 'won' : 'lost'
    }
    default:
      return 'pending'
  }
}

/** Apply FT scores to matching pending legs (manual overrides left alone unless force) */
export function applyScoresToSlip(
  slip: Slip,
  scores: ScoreMap,
  opts?: { overwriteManual?: boolean },
): Slip {
  const overwrite = opts?.overwriteManual ?? false
  const legs = slip.legs.map((leg) => {
    const key = fixtureKey(leg.kickoff, leg.home, leg.away)
    const score = scores[key]
    if (!score) return leg
    if (leg.result !== 'pending' && leg.resultSource === 'manual' && !overwrite) {
      return leg
    }
    const result = settleFromScore(leg, score.home, score.away)
    return { ...leg, result, resultSource: 'score' as const }
  })
  const pending = legs.some((l) => l.result === 'pending')
  return { ...slip, legs, status: pending ? 'open' : 'settled' }
}

export function applyScoresToSlips(slips: Slip[], scores: ScoreMap): Slip[] {
  return slips.map((s) => applyScoresToSlip(s, scores))
}

/** Unique fixtures across slips, sorted by kickoff */
export function uniqueFixtures(slips: Slip[]): {
  key: string
  kickoff: string
  home: string
  away: string
  competition: string
}[] {
  const map = new Map<
    string,
    { key: string; kickoff: string; home: string; away: string; competition: string }
  >()
  for (const slip of slips) {
    for (const leg of slip.legs) {
      const key = fixtureKey(leg.kickoff, leg.home, leg.away)
      if (!map.has(key)) {
        map.set(key, {
          key,
          kickoff: leg.kickoff,
          home: leg.home,
          away: leg.away,
          competition: leg.competition,
        })
      }
    }
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
  )
}
