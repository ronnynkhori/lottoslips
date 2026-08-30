import { MARKETS } from '../data/markets'
import type { Leg, RebetSuggestion, Slip } from '../types'
import { chronologicalLegs, slipLegSummary } from './stats'

/**
 * Suggest a rebet when the first one or two kickoffs on a slip have lost,
 * while later legs are still pending.
 */
export function getRebetSuggestions(slips: Slip[], defaultStake: number): RebetSuggestion[] {
  const suggestions: RebetSuggestion[] = []

  for (const slip of slips) {
    if (slip.rebetOf) continue
    if (slip.status === 'settled') continue

    // Already has a rebet child?
    const hasRebet = slips.some((s) => s.rebetOf === slip.id)
    if (hasRebet) continue

    const ordered = chronologicalLegs(slip)
    const firstTwo = ordered.slice(0, 2)
    const earlyLost = firstTwo.filter((l) => l.result === 'lost').length
    if (earlyLost === 0) continue

    // Only suggest if original is already dead and there are remaining pending legs worth tracking as a fresh ticket
    const summary = slipLegSummary(slip)
    if (!summary.dead) continue

    const remainingLegs = ordered.filter((l) => l.result === 'pending')
    if (remainingLegs.length < 8) continue

    suggestions.push({
      slipId: slip.id,
      marketId: slip.marketId,
      marketLabel: MARKETS[slip.marketId].label,
      earlyLost,
      remainingLegs,
      reason:
        earlyLost >= 2
          ? `First two kickoffs lost on ${MARKETS[slip.marketId].shortLabel}. Rebuild with the ${remainingLegs.length} remaining legs.`
          : `Opening leg lost on ${MARKETS[slip.marketId].shortLabel}. Optional rebet on the ${remainingLegs.length} legs still to play.`,
      suggestedStake: Number((defaultStake * (earlyLost >= 2 ? 0.5 : 0.75)).toFixed(2)),
      urgency: earlyLost >= 2 ? 'high' : 'medium',
    })
  }

  return suggestions.sort((a, b) => {
    if (a.urgency !== b.urgency) return a.urgency === 'high' ? -1 : 1
    return b.remainingLegs.length - a.remainingLegs.length
  })
}

export function buildRebetSlip(original: Slip, remainingLegs: Leg[], stake: number): Slip {
  return {
    id: crypto.randomUUID(),
    marketId: original.marketId,
    title: `${original.title.replace(' · 20-fold', '')} · Rebet ${remainingLegs.length}`,
    description: `Rebet of dead slip — ${remainingLegs.length} remaining legs`,
    createdAt: new Date().toISOString(),
    weekKey: original.weekKey,
    stake,
    status: 'open',
    rebetOf: original.id,
    legs: remainingLegs.map((l) => ({
      ...l,
      id: crypto.randomUUID(),
      result: 'pending' as const,
    })),
  }
}
