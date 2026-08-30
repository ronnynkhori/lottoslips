import type { MarketMeta, MarketId, Slip, WeekBundle } from '../types'

/** Bump when the fixture card changes so clients auto-refresh */
export const CARD_VERSION = 7

export const MARKETS: Record<MarketId, MarketMeta> = {
  team_to_score: {
    id: 'team_to_score',
    label: 'Team to Score',
    shortLabel: 'TTS',
    color: '#1fa97a',
  },
  over_1_5: {
    id: 'over_1_5',
    label: 'Over 1.5 Goals',
    shortLabel: 'O1.5',
    color: '#e8a317',
  },
  under_4_5: {
    id: 'under_4_5',
    label: 'Under 4.5 Goals',
    shortLabel: 'U4.5',
    color: '#3d8bfd',
  },
  double_chance: {
    id: 'double_chance',
    label: 'Double Chance',
    shortLabel: 'DC',
    color: '#e85d4c',
  },
}

export const MARKET_ORDER: MarketId[] = [
  'team_to_score',
  'over_1_5',
  'under_4_5',
  'double_chance',
]

function leg(
  kickoff: string,
  home: string,
  away: string,
  competition: string,
  selection: string,
  probability: number,
  extras?: { odds?: number; dcSide?: '1X' | 'X2' | '12' },
) {
  return {
    id: crypto.randomUUID(),
    kickoff,
    home,
    away,
    competition,
    selection,
    probability,
    odds: extras?.odds,
    dcSide: extras?.dcSide,
    result: 'pending' as const,
  }
}

/** Current card: Mon 31 Aug → Sun 6 Sep 2026 */
export function createFourSlips(weekKey: string, stake: number): Slip[] {
  const createdAt = new Date().toISOString()

  const teamToScore: Slip = {
    id: crypto.randomUUID(),
    marketId: 'team_to_score',
    title: 'Team to Score · 20-fold',
    description: 'Each listed side scores ≥1 (team Over 0.5). Skip games with no TTS market.',
    createdAt,
    weekKey,
    stake,
    status: 'open',
    legs: [
      leg('2026-08-31T18:30:00Z', 'Barcelona', 'Rayo Vallecano', 'La Liga', 'Barcelona to score', 93),
      leg('2026-09-05T14:00:00Z', 'Man City', 'Coventry', 'Premier League', 'Man City to score', 93),
      leg('2026-09-04T19:00:00Z', 'Ipswich', 'Liverpool', 'Premier League', 'Liverpool to score', 91),
      leg('2026-09-04T19:00:00Z', 'Real Betis', 'Real Madrid', 'La Liga', 'Real Madrid to score', 90),
      leg('2026-09-06T14:15:00Z', 'Valencia', 'Barcelona', 'La Liga', 'Barcelona to score', 90),
      leg('2026-08-31T19:00:00Z', 'Aston Villa', 'Arsenal', 'Premier League', 'Arsenal to score', 88),
      leg('2026-09-06T13:00:00Z', 'Everton', 'Man United', 'Premier League', 'Man United to score', 87),
      leg('2026-09-05T14:00:00Z', 'Nott’m Forest', 'Tottenham', 'Premier League', 'Tottenham to score', 86),
      leg('2026-09-06T15:30:00Z', 'Arsenal', 'Chelsea', 'Premier League', 'Arsenal to score', 86),
      leg('2026-09-05T11:30:00Z', 'Newcastle', 'Bournemouth', 'Premier League', 'Newcastle to score', 85),
      leg('2026-09-06T15:30:00Z', 'Arsenal', 'Chelsea', 'Premier League', 'Chelsea to score', 84),
      leg('2026-09-05T14:00:00Z', 'Brighton', 'Leeds', 'Premier League', 'Brighton to score', 84),
      leg('2026-09-05T14:00:00Z', 'Fulham', 'Crystal Palace', 'Premier League', 'Fulham to score', 83),
      leg('2026-08-31T19:00:00Z', 'Aston Villa', 'Arsenal', 'Premier League', 'Aston Villa to score', 82),
      leg('2026-09-05T16:30:00Z', 'Hull', 'Aston Villa', 'Premier League', 'Aston Villa to score', 82),
      leg('2026-09-04T19:00:00Z', 'Real Betis', 'Real Madrid', 'La Liga', 'Real Betis to score', 81),
      leg('2026-09-05T14:00:00Z', 'Brentford', 'Sunderland', 'Premier League', 'Brentford to score', 80),
      leg('2026-08-31T16:30:00Z', 'Osasuna', 'Getafe', 'La Liga', 'Osasuna to score', 79),
      leg('2026-09-05T14:00:00Z', 'Nott’m Forest', 'Tottenham', 'Premier League', 'Nott’m Forest to score', 78),
      leg('2026-09-06T13:00:00Z', 'Everton', 'Man United', 'Premier League', 'Everton to score', 77),
    ],
  }

  const over15: Slip = {
    id: crypto.randomUUID(),
    marketId: 'over_1_5',
    title: 'Over 1.5 Goals · 20-fold',
    description: '2+ total goals in each match',
    createdAt,
    weekKey,
    stake,
    status: 'open',
    legs: [
      leg('2026-09-05T14:00:00Z', 'Man City', 'Coventry', 'Premier League', 'Over 1.5', 92),
      leg('2026-08-31T18:30:00Z', 'Barcelona', 'Rayo Vallecano', 'La Liga', 'Over 1.5', 91),
      leg('2026-09-06T15:30:00Z', 'Arsenal', 'Chelsea', 'Premier League', 'Over 1.5', 90),
      leg('2026-09-04T19:00:00Z', 'Ipswich', 'Liverpool', 'Premier League', 'Over 1.5', 89),
      leg('2026-09-04T19:00:00Z', 'Real Betis', 'Real Madrid', 'La Liga', 'Over 1.5', 88),
      leg('2026-09-06T14:15:00Z', 'Valencia', 'Barcelona', 'La Liga', 'Over 1.5', 88),
      leg('2026-08-31T19:00:00Z', 'Aston Villa', 'Arsenal', 'Premier League', 'Over 1.5', 87),
      leg('2026-09-06T13:00:00Z', 'Everton', 'Man United', 'Premier League', 'Over 1.5', 86),
      leg('2026-09-05T14:00:00Z', 'Nott’m Forest', 'Tottenham', 'Premier League', 'Over 1.5', 86),
      leg('2026-09-05T11:30:00Z', 'Newcastle', 'Bournemouth', 'Premier League', 'Over 1.5', 85),
      leg('2026-09-05T14:00:00Z', 'Brighton', 'Leeds', 'Premier League', 'Over 1.5', 85),
      leg('2026-09-05T16:30:00Z', 'Hull', 'Aston Villa', 'Premier League', 'Over 1.5', 84),
      leg('2026-09-05T14:00:00Z', 'Fulham', 'Crystal Palace', 'Premier League', 'Over 1.5', 84),
      leg('2026-09-05T14:00:00Z', 'Brentford', 'Sunderland', 'Premier League', 'Over 1.5', 83),
      leg('2026-08-31T16:30:00Z', 'Osasuna', 'Getafe', 'La Liga', 'Over 1.5', 82),
      leg('2026-09-12T14:00:00Z', 'Liverpool', 'Fulham', 'Premier League', 'Over 1.5', 86),
      leg('2026-09-12T16:30:00Z', 'Tottenham', 'Everton', 'Premier League', 'Over 1.5', 85),
      leg('2026-09-13T15:30:00Z', 'Man United', 'Man City', 'Premier League', 'Over 1.5', 90),
      leg('2026-09-12T14:00:00Z', 'Chelsea', 'Hull', 'Premier League', 'Over 1.5', 88),
      leg('2026-09-12T19:00:00Z', 'Sunderland', 'Arsenal', 'Premier League', 'Over 1.5', 84),
    ],
  }

  const under45: Slip = {
    id: crypto.randomUUID(),
    marketId: 'under_4_5',
    title: 'Under 4.5 Goals · 20-fold',
    description: 'Fewer than 5 total goals',
    createdAt,
    weekKey,
    stake,
    status: 'open',
    legs: [
      leg('2026-08-31T16:30:00Z', 'Osasuna', 'Getafe', 'La Liga', 'Under 4.5', 92),
      leg('2026-09-05T14:00:00Z', 'Fulham', 'Crystal Palace', 'Premier League', 'Under 4.5', 90),
      leg('2026-09-05T14:00:00Z', 'Brentford', 'Sunderland', 'Premier League', 'Under 4.5', 89),
      leg('2026-09-05T11:30:00Z', 'Newcastle', 'Bournemouth', 'Premier League', 'Under 4.5', 88),
      leg('2026-09-06T13:00:00Z', 'Everton', 'Man United', 'Premier League', 'Under 4.5', 87),
      leg('2026-08-31T19:00:00Z', 'Aston Villa', 'Arsenal', 'Premier League', 'Under 4.5', 87),
      leg('2026-09-05T14:00:00Z', 'Brighton', 'Leeds', 'Premier League', 'Under 4.5', 86),
      leg('2026-09-05T14:00:00Z', 'Nott’m Forest', 'Tottenham', 'Premier League', 'Under 4.5', 86),
      leg('2026-09-05T16:30:00Z', 'Hull', 'Aston Villa', 'Premier League', 'Under 4.5', 86),
      leg('2026-09-04T19:00:00Z', 'Real Betis', 'Real Madrid', 'La Liga', 'Under 4.5', 85),
      leg('2026-09-06T14:15:00Z', 'Valencia', 'Barcelona', 'La Liga', 'Under 4.5', 84),
      leg('2026-09-06T15:30:00Z', 'Arsenal', 'Chelsea', 'Premier League', 'Under 4.5', 84),
      leg('2026-09-12T14:00:00Z', 'AFC Bournemouth', 'Brentford', 'Premier League', 'Under 4.5', 88),
      leg('2026-09-12T14:00:00Z', 'Crystal Palace', 'Ipswich', 'Premier League', 'Under 4.5', 88),
      leg('2026-09-12T14:00:00Z', 'Aston Villa', 'Nott’m Forest', 'Premier League', 'Under 4.5', 87),
      leg('2026-09-12T16:30:00Z', 'Tottenham', 'Everton', 'Premier League', 'Under 4.5', 86),
      leg('2026-09-12T14:00:00Z', 'Liverpool', 'Fulham', 'Premier League', 'Under 4.5', 85),
      leg('2026-09-13T13:00:00Z', 'Coventry', 'Brighton', 'Premier League', 'Under 4.5', 87),
      leg('2026-09-14T19:00:00Z', 'Leeds', 'Newcastle', 'Premier League', 'Under 4.5', 86),
      leg('2026-09-12T19:00:00Z', 'Sunderland', 'Arsenal', 'Premier League', 'Under 4.5', 85),
    ],
  }

  const doubleChance: Slip = {
    id: crypto.randomUUID(),
    marketId: 'double_chance',
    title: 'Double Chance · 20-fold',
    description: 'Favourite win or draw (1X / X2)',
    createdAt,
    weekKey,
    stake,
    status: 'open',
    legs: [
      leg('2026-09-05T14:00:00Z', 'Man City', 'Coventry', 'Premier League', 'Man City 1X', 96, { dcSide: '1X' }),
      leg('2026-08-31T18:30:00Z', 'Barcelona', 'Rayo Vallecano', 'La Liga', 'Barcelona 1X', 95, { dcSide: '1X' }),
      leg('2026-09-04T19:00:00Z', 'Ipswich', 'Liverpool', 'Premier League', 'Liverpool X2', 93, { dcSide: 'X2' }),
      leg('2026-09-04T19:00:00Z', 'Real Betis', 'Real Madrid', 'La Liga', 'Real Madrid X2', 92, { dcSide: 'X2' }),
      leg('2026-09-06T14:15:00Z', 'Valencia', 'Barcelona', 'La Liga', 'Barcelona X2', 91, { dcSide: 'X2' }),
      leg('2026-08-31T19:00:00Z', 'Aston Villa', 'Arsenal', 'Premier League', 'Arsenal X2', 88, { dcSide: 'X2' }),
      leg('2026-09-06T13:00:00Z', 'Everton', 'Man United', 'Premier League', 'Man United X2', 88, { dcSide: 'X2' }),
      leg('2026-09-06T15:30:00Z', 'Arsenal', 'Chelsea', 'Premier League', 'Arsenal 1X', 87, { dcSide: '1X' }),
      leg('2026-09-05T14:00:00Z', 'Nott’m Forest', 'Tottenham', 'Premier League', 'Tottenham X2', 86, { dcSide: 'X2' }),
      leg('2026-09-05T11:30:00Z', 'Newcastle', 'Bournemouth', 'Premier League', 'Newcastle 1X', 88, { dcSide: '1X' }),
      leg('2026-09-05T14:00:00Z', 'Brighton', 'Leeds', 'Premier League', 'Brighton 1X', 86, { dcSide: '1X' }),
      leg('2026-09-05T16:30:00Z', 'Hull', 'Aston Villa', 'Premier League', 'Aston Villa X2', 85, { dcSide: 'X2' }),
      leg('2026-09-05T14:00:00Z', 'Fulham', 'Crystal Palace', 'Premier League', 'Fulham 1X', 84, { dcSide: '1X' }),
      leg('2026-09-12T14:00:00Z', 'Chelsea', 'Hull', 'Premier League', 'Chelsea 1X', 94, { dcSide: '1X' }),
      leg('2026-09-12T14:00:00Z', 'Liverpool', 'Fulham', 'Premier League', 'Liverpool 1X', 91, { dcSide: '1X' }),
      leg('2026-09-13T15:30:00Z', 'Man United', 'Man City', 'Premier League', 'Man City X2', 82, { dcSide: 'X2' }),
      leg('2026-09-12T16:30:00Z', 'Tottenham', 'Everton', 'Premier League', 'Tottenham 1X', 87, { dcSide: '1X' }),
      leg('2026-09-12T19:00:00Z', 'Sunderland', 'Arsenal', 'Premier League', 'Arsenal X2', 90, { dcSide: 'X2' }),
      leg('2026-09-05T14:00:00Z', 'Brentford', 'Sunderland', 'Premier League', 'Brentford 1X', 83, { dcSide: '1X' }),
      leg('2026-08-31T16:30:00Z', 'Osasuna', 'Getafe', 'La Liga', 'Osasuna 1X', 82, { dcSide: '1X' }),
    ],
  }

  return [teamToScore, over15, under45, doubleChance].map((slip) => ({
    ...slip,
    legs: [...slip.legs].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
    ),
  }))
}

export function weekLabelFromKey(weekKey: string): string {
  return `Week ${weekKey.split('-W')[1] ?? weekKey}`
}

export function currentWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function createWeekBundle(stake = 1): WeekBundle {
  const weekKey = currentWeekKey()
  return {
    weekKey,
    label: `${weekLabelFromKey(weekKey)} · Aug 31–Sep 6`,
    createdAt: new Date().toISOString(),
    cardVersion: CARD_VERSION,
    slips: createFourSlips(weekKey, stake),
  }
}
