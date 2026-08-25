import type { MarketMeta, MarketId, Slip, WeekBundle } from '../types'

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
  selection: string,
  probability: number,
  extras?: { odds?: number; dcSide?: '1X' | 'X2' | '12' },
) {
  return {
    id: crypto.randomUUID(),
    kickoff,
    home,
    away,
    selection,
    probability,
    odds: extras?.odds,
    dcSide: extras?.dcSide,
    result: 'pending' as const,
  }
}

/** Seed the four 20-folds from the Aug 25–30 2026 card */
export function createFourSlips(weekKey: string, stake: number): Slip[] {
  const createdAt = new Date().toISOString()

  const teamToScore: Slip = {
    id: crypto.randomUUID(),
    marketId: 'team_to_score',
    title: 'Team to Score · 20-fold',
    description: 'Each listed side scores ≥1 goal',
    createdAt,
    weekKey,
    stake,
    status: 'open',
    legs: [
      leg('2026-08-27T18:30:00Z', 'Chelsea', 'Luton', 'Chelsea to score', 93),
      leg('2026-08-26T18:45:00Z', 'Tottenham', 'Charlton', 'Tottenham to score', 92),
      leg('2026-08-25T16:00:00Z', 'Al-Ettifaq', 'Al-Nassr', 'Al-Nassr to score', 91),
      leg('2026-08-27T19:00:00Z', 'Barcelona', 'Athletic', 'Barcelona to score', 90),
      leg('2026-08-26T19:00:00Z', 'Real Madrid', 'Real Sociedad', 'Real Madrid to score', 90),
      leg('2026-08-25T19:00:00Z', 'Bodø/Glimt', 'NEC', 'Bodø/Glimt to score', 90),
      leg('2026-08-27T19:00:00Z', 'Fulham', 'AFC Wimbledon', 'Fulham to score', 89),
      leg('2026-08-25T19:00:00Z', 'LASK', 'Celtic', 'Celtic to score', 88),
      leg('2026-08-26T18:45:00Z', 'Newcastle', 'West Brom', 'Newcastle to score', 87),
      leg('2026-08-25T19:00:00Z', 'LASK', 'Celtic', 'LASK to score', 86),
      leg('2026-08-26T19:00:00Z', 'Lyon', 'Fenerbahçe', 'Lyon to score', 85),
      leg('2026-08-26T19:00:00Z', 'AEK Athens', 'Levski', 'AEK Athens to score', 84),
      leg('2026-08-25T18:45:00Z', 'Sheff Wed', 'Wolves', 'Wolves to score', 83),
      leg('2026-08-26T18:45:00Z', 'Bradford', 'Burnley', 'Burnley to score', 82),
      leg('2026-08-25T16:45:00Z', 'Sabah', 'Hapoel Beer-Sheva', 'Hapoel to score', 82),
      leg('2026-08-25T18:30:00Z', 'Doncaster', 'Middlesbrough', 'Middlesbrough to score', 80),
      leg('2026-08-26T19:00:00Z', 'Preston', 'Everton', 'Everton to score', 80),
      leg('2026-08-25T19:00:00Z', 'Nott’m Forest', 'Leeds', 'Nott’m Forest to score', 77),
      leg('2026-08-25T19:00:00Z', 'Valencia', 'Real Betis', 'Real Betis to score', 76),
      leg('2026-08-26T19:00:00Z', 'Lyon', 'Fenerbahçe', 'Fenerbahçe to score', 75),
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
      leg('2026-08-25T16:00:00Z', 'Al-Ettifaq', 'Al-Nassr', 'Over 1.5', 93),
      leg('2026-08-26T18:45:00Z', 'Tottenham', 'Charlton', 'Over 1.5', 92),
      leg('2026-08-27T18:30:00Z', 'Chelsea', 'Luton', 'Over 1.5', 91),
      leg('2026-08-30T15:00:00Z', 'Real Madrid', 'Málaga', 'Over 1.5', 91),
      leg('2026-08-27T19:00:00Z', 'Fulham', 'AFC Wimbledon', 'Over 1.5', 89),
      leg('2026-08-25T19:00:00Z', 'Bodø/Glimt', 'NEC', 'Over 1.5', 88),
      leg('2026-08-28T19:00:00Z', 'Crystal Palace', 'Man City', 'Over 1.5', 88),
      leg('2026-08-30T15:30:00Z', 'Man United', 'Ipswich', 'Over 1.5', 87),
      leg('2026-08-26T19:00:00Z', 'Real Madrid', 'Real Sociedad', 'Over 1.5', 86),
      leg('2026-08-29T11:30:00Z', 'Liverpool', 'Nott’m Forest', 'Over 1.5', 86),
      leg('2026-08-26T19:00:00Z', 'Lyon', 'Fenerbahçe', 'Over 1.5', 85),
      leg('2026-08-26T18:45:00Z', 'Newcastle', 'West Brom', 'Over 1.5', 85),
      leg('2026-08-29T16:30:00Z', 'Tottenham', 'Newcastle', 'Over 1.5', 84),
      leg('2026-08-25T18:45:00Z', 'Sheff Wed', 'Wolves', 'Over 1.5', 83),
      leg('2026-08-26T19:00:00Z', 'Preston', 'Everton', 'Over 1.5', 83),
      leg('2026-08-27T19:00:00Z', 'Barcelona', 'Athletic', 'Over 1.5', 83),
      leg('2026-08-25T18:45:00Z', 'Southampton', 'West Ham', 'Over 1.5', 82),
      leg('2026-08-26T18:45:00Z', 'Bradford', 'Burnley', 'Over 1.5', 82),
      leg('2026-08-25T16:45:00Z', 'Sabah', 'Hapoel Beer-Sheva', 'Over 1.5', 82),
      leg('2026-08-25T19:00:00Z', 'LASK', 'Celtic', 'Over 1.5', 81),
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
      leg('2026-08-25T19:00:00Z', 'Nott’m Forest', 'Leeds', 'Under 4.5', 92),
      leg('2026-08-25T19:00:00Z', 'Valencia', 'Real Betis', 'Under 4.5', 91),
      leg('2026-08-26T19:00:00Z', 'AEK Athens', 'Levski', 'Under 4.5', 91),
      leg('2026-08-25T18:30:00Z', 'Doncaster', 'Middlesbrough', 'Under 4.5', 90),
      leg('2026-08-25T18:45:00Z', 'Cambridge', 'Millwall', 'Under 4.5', 90),
      leg('2026-08-30T13:00:00Z', 'Sunderland', 'Fulham', 'Under 4.5', 89),
      leg('2026-08-26T19:00:00Z', 'Lyon', 'Fenerbahçe', 'Under 4.5', 89),
      leg('2026-08-29T17:00:00Z', 'Real Sociedad', 'Espanyol', 'Under 4.5', 89),
      leg('2026-08-25T18:45:00Z', 'Blackburn', 'Sheff Utd', 'Under 4.5', 88),
      leg('2026-08-26T19:00:00Z', 'Viking', 'Dinamo Zagreb', 'Under 4.5', 88),
      leg('2026-08-30T13:00:00Z', 'Leeds', 'Brentford', 'Under 4.5', 88),
      leg('2026-08-26T19:00:00Z', 'Real Madrid', 'Real Sociedad', 'Under 4.5', 88),
      leg('2026-08-25T18:00:00Z', 'Cardiff', 'Norwich', 'Under 4.5', 87),
      leg('2026-08-29T19:30:00Z', 'Sevilla', 'Atlético Madrid', 'Under 4.5', 87),
      leg('2026-08-29T14:00:00Z', 'Bournemouth', 'Everton', 'Under 4.5', 87),
      leg('2026-08-26T18:45:00Z', 'Newcastle', 'West Brom', 'Under 4.5', 86),
      leg('2026-08-26T19:00:00Z', 'Celje', 'Slovan Bratislava', 'Under 4.5', 86),
      leg('2026-08-30T13:00:00Z', 'Chelsea', 'Brighton', 'Under 4.5', 86),
      leg('2026-08-29T16:30:00Z', 'Tottenham', 'Newcastle', 'Under 4.5', 85),
      leg('2026-08-26T19:00:00Z', 'Preston', 'Everton', 'Under 4.5', 85),
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
      leg('2026-08-26T18:45:00Z', 'Tottenham', 'Charlton', 'Tottenham 1X', 96, { dcSide: '1X' }),
      leg('2026-08-27T18:30:00Z', 'Chelsea', 'Luton', 'Chelsea 1X', 95, { dcSide: '1X' }),
      leg('2026-08-30T15:00:00Z', 'Real Madrid', 'Málaga', 'Real Madrid 1X', 95, { dcSide: '1X' }),
      leg('2026-08-27T19:00:00Z', 'Fulham', 'AFC Wimbledon', 'Fulham 1X', 94, { dcSide: '1X' }),
      leg('2026-08-30T15:30:00Z', 'Man United', 'Ipswich', 'Man United 1X', 92, { dcSide: '1X' }),
      leg('2026-08-25T19:00:00Z', 'Bodø/Glimt', 'NEC', 'Bodø/Glimt 1X', 91, { dcSide: '1X' }),
      leg('2026-08-25T16:00:00Z', 'Al-Ettifaq', 'Al-Nassr', 'Al-Nassr X2', 90, { dcSide: 'X2' }),
      leg('2026-08-27T19:00:00Z', 'Barcelona', 'Athletic', 'Barcelona 1X', 90, { dcSide: '1X' }),
      leg('2026-08-29T11:30:00Z', 'Liverpool', 'Nott’m Forest', 'Liverpool 1X', 89, { dcSide: '1X' }),
      leg('2026-08-28T19:00:00Z', 'Crystal Palace', 'Man City', 'Man City X2', 88, { dcSide: 'X2' }),
      leg('2026-08-26T18:45:00Z', 'Newcastle', 'West Brom', 'Newcastle 1X', 88, { dcSide: '1X' }),
      leg('2026-08-26T19:00:00Z', 'Real Madrid', 'Real Sociedad', 'Real Madrid 1X', 87, { dcSide: '1X' }),
      leg('2026-08-26T19:00:00Z', 'AEK Athens', 'Levski', 'AEK Athens 1X', 87, { dcSide: '1X' }),
      leg('2026-08-26T18:45:00Z', 'Bradford', 'Burnley', 'Burnley X2', 86, { dcSide: 'X2' }),
      leg('2026-08-26T19:00:00Z', 'Lyon', 'Fenerbahçe', 'Lyon 1X', 85, { dcSide: '1X' }),
      leg('2026-08-25T18:45:00Z', 'Sheff Wed', 'Wolves', 'Wolves X2', 84, { dcSide: 'X2' }),
      leg('2026-08-25T19:00:00Z', 'LASK', 'Celtic', 'Celtic X2', 83, { dcSide: 'X2' }),
      leg('2026-08-26T19:00:00Z', 'Preston', 'Everton', 'Everton X2', 83, { dcSide: 'X2' }),
      leg('2026-08-29T16:30:00Z', 'Tottenham', 'Newcastle', 'Tottenham 1X', 82, { dcSide: '1X' }),
      leg('2026-08-25T19:00:00Z', 'Birmingham', 'Brentford', 'Brentford X2', 81, { dcSide: 'X2' }),
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
  // weekKey format: 2026-W35
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
    label: `${weekLabelFromKey(weekKey)} · Aug 25–30`,
    createdAt: new Date().toISOString(),
    slips: createFourSlips(weekKey, stake),
  }
}
