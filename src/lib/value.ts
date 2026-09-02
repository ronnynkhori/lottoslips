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
  minProbability: 72,
  minOdds: 1.25,
  minEdge: 1.02,
  maxOdds: 1.9,
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
