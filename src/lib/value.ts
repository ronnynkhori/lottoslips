import type { MixTier, SettleKind } from '../types'

/** Bookmaker implied win chance from decimal odds */
export function impliedProbability(odds: number): number {
  if (odds <= 1) return 100
  return 100 / odds
}

/** >1 means our estimate beats the price (value edge) */
export function valueEdge(probability: number, odds: number): number {
  return (probability * odds) / 100
}

/** Blend of edge and payout — favours juicy prices that still look solid */
export function valueScore(probability: number, odds: number): number {
  const edge = valueEdge(probability, odds)
  const juice = odds - 1
  return edge * (1 + juice * 0.35)
}

export type ValuePickRules = {
  minProbability: number
  minOdds: number
  minEdge: number
  maxOdds?: number
}

export const SW_VALUE_RULES: ValuePickRules = {
  minProbability: 72,
  minOdds: 1.28,
  minEdge: 1.03,
  maxOdds: 1.85,
}

export const MIX_VALUE_RULES: ValuePickRules = {
  minProbability: 68,
  minOdds: 1.38,
  minEdge: 1.02,
  maxOdds: 2.45,
}

export type MixTierConfig = {
  tier: MixTier
  label: string
  legTarget: number
  rules: ValuePickRules
  maxPerCompetition: number
  /** 0 = pure EV, 1 = max payout bias */
  payoutBias: number
}

export const MIX_TIER_CONFIGS: MixTierConfig[] = [
  {
    tier: 'safe',
    label: 'Safe',
    legTarget: 12,
    rules: { minProbability: 74, minOdds: 1.32, minEdge: 1.03, maxOdds: 1.58 },
    maxPerCompetition: 3,
    payoutBias: 0,
  },
  {
    tier: 'value',
    label: 'Value',
    legTarget: 16,
    rules: { minProbability: 70, minOdds: 1.36, minEdge: 1.02, maxOdds: 1.78 },
    maxPerCompetition: 4,
    payoutBias: 0.35,
  },
  {
    tier: 'moonshot',
    label: 'Moonshot',
    legTarget: 20,
    rules: { minProbability: 66, minOdds: 1.42, minEdge: 1.02, maxOdds: 2.45 },
    maxPerCompetition: 5,
    payoutBias: 0.7,
  },
]

/** Cap handicap share and guarantee a mix of market types per tier */
export const MIX_DIVERSITY: Record<
  MixTier,
  { maxHandicap: number; minByKind: Partial<Record<SettleKind, number>> }
> = {
  safe: {
    maxHandicap: 3,
    minByKind: { team_to_score: 3, over_1_5: 2, double_chance: 2, under_4_5: 1 },
  },
  value: {
    maxHandicap: 5,
    minByKind: { team_to_score: 4, over_1_5: 2, double_chance: 3, straight_win: 1, under_4_5: 1 },
  },
  moonshot: {
    maxHandicap: 7,
    minByKind: {
      team_to_score: 4,
      over_1_5: 3,
      double_chance: 3,
      straight_win: 2,
      handicap: 4,
      under_4_5: 2,
    },
  },
}

/** Goals markets use slightly lower odds floors so they can compete in MIX */
export function mixRulesForKind(
  settleKind: SettleKind,
  base: ValuePickRules,
): ValuePickRules {
  if (settleKind === 'over_1_5') {
    return {
      ...base,
      minOdds: Math.min(base.minOdds, 1.32),
      minProbability: Math.max(72, base.minProbability - 2),
    }
  }
  if (settleKind === 'under_4_5') {
    return {
      ...base,
      minOdds: Math.min(base.minOdds, 1.28),
      minProbability: Math.max(70, base.minProbability - 2),
    }
  }
  return base
}

export function passesMixRules(
  probability: number,
  odds: number,
  settleKind: SettleKind,
  config: MixTierConfig,
): boolean {
  return passesValueRules(probability, odds, mixRulesForKind(settleKind, config.rules))
}

/** Score leg for MIX tier — blends EV with payout juice based on tier */
export function mixTierScore(
  probability: number,
  odds: number,
  payoutBias: number,
): number {
  const edge = valueEdge(probability, odds)
  const evScore = edge
  const payoutScore = edge * (1 + (odds - 1) * 0.65)
  return evScore * (1 - payoutBias) + payoutScore * payoutBias
}

export function handicapOddsFromProbability(
  probability: number,
  line: number,
): number {
  const p = Math.min(86, Math.max(65, probability))
  const lineBoost = Math.abs(line) >= 1.5 ? 0.14 : 0.08
  const targetEdge = 1.04 + (84 - p) * 0.003 + lineBoost
  const raw = (targetEdge * 100) / p
  const min = Math.abs(line) >= 1.5 ? 1.55 : 1.42
  const max = Math.abs(line) >= 1.5 ? 2.15 : 1.78
  return Math.round(Math.min(max, Math.max(min, raw)) * 100) / 100
}

export function passesValueRules(
  probability: number,
  odds: number,
  rules: ValuePickRules,
): boolean {
  if (probability < rules.minProbability) return false
  if (odds < rules.minOdds) return false
  if (rules.maxOdds && odds > rules.maxOdds) return false
  return valueEdge(probability, odds) >= rules.minEdge
}

/** Target decimal odds for a confident pick that still pays */
export function valueOddsFromProbability(probability: number): number {
  const p = Math.min(88, Math.max(70, probability))
  const targetEdge = 1.05 + (86 - p) * 0.004
  const raw = (targetEdge * 100) / p
  return Math.round(Math.min(1.75, Math.max(1.28, raw)) * 100) / 100
}
