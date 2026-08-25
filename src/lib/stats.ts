import { MARKETS, MARKET_ORDER } from '../data/seedSlips'
import type { Leg, MarketId, MarketStats, Slip, WeekBundle } from '../types'

export function slipLegSummary(slip: Slip) {
  const won = slip.legs.filter((l) => l.result === 'won').length
  const lost = slip.legs.filter((l) => l.result === 'lost').length
  const voided = slip.legs.filter((l) => l.result === 'void').length
  const pending = slip.legs.filter((l) => l.result === 'pending').length
  const settled = won + lost + voided
  const dead = lost > 0
  const complete = pending === 0
  const fullHit = complete && lost === 0 && won > 0
  return { won, lost, voided, pending, settled, dead, complete, fullHit }
}

export function earliestPendingLegs(slip: Slip, count = 2): Leg[] {
  return [...slip.legs]
    .filter((l) => l.result === 'pending')
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
    .slice(0, count)
}

export function chronologicalLegs(slip: Slip): Leg[] {
  return [...slip.legs].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
  )
}

/** First N legs by kickoff that are already settled (won/lost/void) */
export function firstSettledLegs(slip: Slip, n = 2): Leg[] {
  return chronologicalLegs(slip)
    .filter((l) => l.result !== 'pending')
    .slice(0, n)
}

export function estimateCombinedOdds(legs: Leg[]): number {
  return legs.reduce((acc, leg) => {
    if (leg.result === 'void') return acc
    if (leg.odds && leg.odds > 1) return acc * leg.odds
    // Approximate decimal odds from probability
    const p = Math.min(0.95, Math.max(0.5, leg.probability / 100))
    return acc * (1 / p)
  }, 1)
}

export function potentialReturn(slip: Slip): number {
  if (slip.legs.some((l) => l.result === 'lost')) return 0
  const active = slip.legs.filter((l) => l.result === 'pending' || l.result === 'won')
  return Number((slip.stake * estimateCombinedOdds(active)).toFixed(2))
}

export function computeMarketStats(weeks: WeekBundle[]): MarketStats[] {
  const allSlips = weeks.flatMap((w) => w.slips)

  return MARKET_ORDER.map((marketId) => {
    const slips = allSlips.filter((s) => s.marketId === marketId && !s.rebetOf)
    const rebets = allSlips.filter((s) => s.marketId === marketId && s.rebetOf)
    const pool = [...slips, ...rebets]

    let legsPlayed = 0
    let legsWon = 0
    let unitsStaked = 0
    let unitsReturned = 0
    let settledSlips = 0
    let fullHits = 0

    for (const slip of pool) {
      const summary = slipLegSummary(slip)
      const playedLegs = slip.legs.filter((l) => l.result === 'won' || l.result === 'lost')
      legsPlayed += playedLegs.length
      legsWon += playedLegs.filter((l) => l.result === 'won').length

      if (summary.complete) {
        settledSlips += 1
        unitsStaked += slip.stake
        if (summary.fullHit) {
          fullHits += 1
          unitsReturned += slip.stake * estimateCombinedOdds(slip.legs)
        }
      }
    }

    const legHitRate = legsPlayed ? (legsWon / legsPlayed) * 100 : 0
    const slipHitRate = settledSlips ? (fullHits / settledSlips) * 100 : 0
    const roi = unitsStaked ? ((unitsReturned - unitsStaked) / unitsStaked) * 100 : 0

    // Rank score blends leg reliability (main signal for long folds) + ROI when settled
    const rankScore =
      legHitRate * 0.7 +
      Math.min(100, Math.max(0, 50 + roi / 2)) * 0.2 +
      slipHitRate * 0.1

    return {
      marketId,
      label: MARKETS[marketId].label,
      slips: pool.length,
      settledSlips,
      fullHits,
      slipHitRate,
      legsPlayed,
      legsWon,
      legHitRate,
      unitsStaked,
      unitsReturned,
      roi,
      rankScore,
    }
  }).sort((a, b) => b.rankScore - a.rankScore)
}

export function bestMarket(weeks: WeekBundle[]): MarketId | null {
  const stats = computeMarketStats(weeks).filter((s) => s.legsPlayed >= 3)
  return stats[0]?.marketId ?? null
}
