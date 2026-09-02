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

/** Favour juicier MIX legs — handicaps and higher prices score higher */
export function mixPayoutScore(
  probability: number,
  odds: number,
  settleKind?: string,
): number {
  const edge = valueEdge(probability, odds)
  const juice = odds - 1
  const kindBoost = settleKind === 'handicap' ? 1.35 : settleKind === 'straight_win' ? 1.1 : 1
  return edge * (1 + juice * 0.65) * kindBoost
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
