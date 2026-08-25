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

/** Seed the four 20-folds from the Aug 25–30 2026 card */
export function createFourSlips(weekKey: string, stake: number): Slip[] {
  const createdAt = new Date().toISOString()

  // Team to Score = Over 0.5 for that side (score ≥1). Skip fixtures with no TTS market.
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
      leg('2026-08-27T18:30:00Z', 'Chelsea', 'Luton', 'EFL Cup', 'Chelsea to score', 93),
      leg('2026-08-26T18:45:00Z', 'Tottenham', 'Charlton', 'EFL Cup', 'Tottenham to score', 92),
      leg('2026-08-25T16:00:00Z', 'Al-Ettifaq', 'Al-Nassr', 'Saudi Pro League', 'Al-Nassr to score', 91),
      leg('2026-08-27T19:00:00Z', 'Barcelona', 'Athletic', 'La Liga', 'Barcelona to score', 90),
      leg('2026-08-26T19:00:00Z', 'Real Madrid', 'Real Sociedad', 'La Liga', 'Real Madrid to score', 90),
      leg('2026-08-25T19:00:00Z', 'Bodø/Glimt', 'NEC', 'UCL Play-offs', 'Bodø/Glimt to score', 90),
      leg('2026-08-27T19:00:00Z', 'Fulham', 'AFC Wimbledon', 'EFL Cup', 'Fulham to score', 89),
      leg('2026-08-25T19:00:00Z', 'LASK', 'Celtic', 'UCL Play-offs', 'Celtic to score', 88),
      leg('2026-08-26T18:45:00Z', 'Newcastle', 'West Brom', 'EFL Cup', 'Newcastle to score', 87),
      leg('2026-08-25T19:00:00Z', 'LASK', 'Celtic', 'UCL Play-offs', 'LASK to score', 86),
      leg('2026-08-26T19:00:00Z', 'Lyon', 'Fenerbahçe', 'UCL Play-offs', 'Lyon to score', 85),
      leg('2026-08-26T19:00:00Z', 'AEK Athens', 'Levski', 'UCL Play-offs', 'AEK Athens to score', 84),
      leg('2026-08-25T18:45:00Z', 'Sheff Wed', 'Wolves', 'EFL Cup', 'Wolves to score', 83),
      leg('2026-08-26T18:45:00Z', 'Bradford', 'Burnley', 'EFL Cup', 'Burnley to score', 82),
      leg('2026-08-25T16:45:00Z', 'Sabah', 'Hapoel Beer-Sheva', 'UCL Play-offs', 'Hapoel to score', 82),
      leg('2026-08-25T18:30:00Z', 'Doncaster', 'Middlesbrough', 'EFL Cup', 'Middlesbrough to score', 80),
      leg('2026-08-26T19:00:00Z', 'Preston', 'Everton', 'EFL Cup', 'Everton to score', 80),
      leg('2026-08-25T19:00:00Z', 'Nott’m Forest', 'Leeds', 'EFL Cup', 'Nott’m Forest to score', 77),
      leg('2026-08-25T19:00:00Z', 'Valencia', 'Real Betis', 'La Liga', 'Real Betis to score', 76),
      leg('2026-08-26T19:00:00Z', 'Lyon', 'Fenerbahçe', 'UCL Play-offs', 'Fenerbahçe to score', 75),
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
      leg('2026-08-25T16:00:00Z', 'Al-Ettifaq', 'Al-Nassr', 'Saudi Pro League', 'Over 1.5', 93),
      leg('2026-08-26T18:45:00Z', 'Tottenham', 'Charlton', 'EFL Cup', 'Over 1.5', 92),
      leg('2026-08-27T18:30:00Z', 'Chelsea', 'Luton', 'EFL Cup', 'Over 1.5', 91),
      leg('2026-08-30T15:00:00Z', 'Real Madrid', 'Málaga', 'La Liga', 'Over 1.5', 91),
      leg('2026-08-27T19:00:00Z', 'Fulham', 'AFC Wimbledon', 'EFL Cup', 'Over 1.5', 89),
      leg('2026-08-25T19:00:00Z', 'Bodø/Glimt', 'NEC', 'UCL Play-offs', 'Over 1.5', 88),
      leg('2026-08-28T19:00:00Z', 'Crystal Palace', 'Man City', 'Premier League', 'Over 1.5', 88),
      leg('2026-08-30T15:30:00Z', 'Man United', 'Ipswich', 'Premier League', 'Over 1.5', 87),
      leg('2026-08-26T19:00:00Z', 'Real Madrid', 'Real Sociedad', 'La Liga', 'Over 1.5', 86),
      leg('2026-08-29T11:30:00Z', 'Liverpool', 'Nott’m Forest', 'Premier League', 'Over 1.5', 86),
      leg('2026-08-26T19:00:00Z', 'Lyon', 'Fenerbahçe', 'UCL Play-offs', 'Over 1.5', 85),
      leg('2026-08-26T18:45:00Z', 'Newcastle', 'West Brom', 'EFL Cup', 'Over 1.5', 85),
      leg('2026-08-29T16:30:00Z', 'Tottenham', 'Newcastle', 'Premier League', 'Over 1.5', 84),
      leg('2026-08-25T18:45:00Z', 'Sheff Wed', 'Wolves', 'EFL Cup', 'Over 1.5', 83),
      leg('2026-08-26T19:00:00Z', 'Preston', 'Everton', 'EFL Cup', 'Over 1.5', 83),
      leg('2026-08-27T19:00:00Z', 'Barcelona', 'Athletic', 'La Liga', 'Over 1.5', 83),
      leg('2026-08-25T18:45:00Z', 'Southampton', 'West Ham', 'EFL Cup', 'Over 1.5', 82),
      leg('2026-08-26T18:45:00Z', 'Bradford', 'Burnley', 'EFL Cup', 'Over 1.5', 82),
      leg('2026-08-25T16:45:00Z', 'Sabah', 'Hapoel Beer-Sheva', 'UCL Play-offs', 'Over 1.5', 82),
      leg('2026-08-25T19:00:00Z', 'LASK', 'Celtic', 'UCL Play-offs', 'Over 1.5', 81),
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
      leg('2026-08-25T19:00:00Z', 'Nott’m Forest', 'Leeds', 'EFL Cup', 'Under 4.5', 92),
      leg('2026-08-25T19:00:00Z', 'Valencia', 'Real Betis', 'La Liga', 'Under 4.5', 91),
      leg('2026-08-26T19:00:00Z', 'AEK Athens', 'Levski', 'UCL Play-offs', 'Under 4.5', 91),
      leg('2026-08-25T18:30:00Z', 'Doncaster', 'Middlesbrough', 'EFL Cup', 'Under 4.5', 90),
      leg('2026-08-25T18:45:00Z', 'Cambridge', 'Millwall', 'EFL Cup', 'Under 4.5', 90),
      leg('2026-08-30T13:00:00Z', 'Sunderland', 'Fulham', 'Premier League', 'Under 4.5', 89),
      leg('2026-08-26T19:00:00Z', 'Lyon', 'Fenerbahçe', 'UCL Play-offs', 'Under 4.5', 89),
      leg('2026-08-29T17:00:00Z', 'Real Sociedad', 'Espanyol', 'La Liga', 'Under 4.5', 89),
      leg('2026-08-25T18:45:00Z', 'Blackburn', 'Sheff Utd', 'EFL Cup', 'Under 4.5', 88),
      leg('2026-08-26T19:00:00Z', 'Viking', 'Dinamo Zagreb', 'UCL Play-offs', 'Under 4.5', 88),
      leg('2026-08-30T13:00:00Z', 'Leeds', 'Brentford', 'Premier League', 'Under 4.5', 88),
      leg('2026-08-26T19:00:00Z', 'Real Madrid', 'Real Sociedad', 'La Liga', 'Under 4.5', 88),
      leg('2026-08-25T18:00:00Z', 'Cardiff', 'Norwich', 'EFL Cup', 'Under 4.5', 87),
      leg('2026-08-29T19:30:00Z', 'Sevilla', 'Atlético Madrid', 'La Liga', 'Under 4.5', 87),
      leg('2026-08-29T14:00:00Z', 'Bournemouth', 'Everton', 'Premier League', 'Under 4.5', 87),
      leg('2026-08-26T18:45:00Z', 'Newcastle', 'West Brom', 'EFL Cup', 'Under 4.5', 86),
      leg('2026-08-26T19:00:00Z', 'Celje', 'Slovan Bratislava', 'UCL Play-offs', 'Under 4.5', 86),
      leg('2026-08-30T13:00:00Z', 'Chelsea', 'Brighton', 'Premier League', 'Under 4.5', 86),
      leg('2026-08-29T16:30:00Z', 'Tottenham', 'Newcastle', 'Premier League', 'Under 4.5', 85),
      leg('2026-08-26T19:00:00Z', 'Preston', 'Everton', 'EFL Cup', 'Under 4.5', 85),
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
      leg('2026-08-26T18:45:00Z', 'Tottenham', 'Charlton', 'EFL Cup', 'Tottenham 1X', 96, { dcSide: '1X' }),
      leg('2026-08-27T18:30:00Z', 'Chelsea', 'Luton', 'EFL Cup', 'Chelsea 1X', 95, { dcSide: '1X' }),
      leg('2026-08-30T15:00:00Z', 'Real Madrid', 'Málaga', 'La Liga', 'Real Madrid 1X', 95, { dcSide: '1X' }),
      leg('2026-08-27T19:00:00Z', 'Fulham', 'AFC Wimbledon', 'EFL Cup', 'Fulham 1X', 94, { dcSide: '1X' }),
      leg('2026-08-30T15:30:00Z', 'Man United', 'Ipswich', 'Premier League', 'Man United 1X', 92, { dcSide: '1X' }),
      leg('2026-08-25T19:00:00Z', 'Bodø/Glimt', 'NEC', 'UCL Play-offs', 'Bodø/Glimt 1X', 91, { dcSide: '1X' }),
      leg('2026-08-25T16:00:00Z', 'Al-Ettifaq', 'Al-Nassr', 'Saudi Pro League', 'Al-Nassr X2', 90, { dcSide: 'X2' }),
      leg('2026-08-27T19:00:00Z', 'Barcelona', 'Athletic', 'La Liga', 'Barcelona 1X', 90, { dcSide: '1X' }),
      leg('2026-08-29T11:30:00Z', 'Liverpool', 'Nott’m Forest', 'Premier League', 'Liverpool 1X', 89, { dcSide: '1X' }),
      leg('2026-08-28T19:00:00Z', 'Crystal Palace', 'Man City', 'Premier League', 'Man City X2', 88, { dcSide: 'X2' }),
      leg('2026-08-26T18:45:00Z', 'Newcastle', 'West Brom', 'EFL Cup', 'Newcastle 1X', 88, { dcSide: '1X' }),
      leg('2026-08-26T19:00:00Z', 'Real Madrid', 'Real Sociedad', 'La Liga', 'Real Madrid 1X', 87, { dcSide: '1X' }),
      leg('2026-08-26T19:00:00Z', 'AEK Athens', 'Levski', 'UCL Play-offs', 'AEK Athens 1X', 87, { dcSide: '1X' }),
      leg('2026-08-26T18:45:00Z', 'Bradford', 'Burnley', 'EFL Cup', 'Burnley X2', 86, { dcSide: 'X2' }),
      leg('2026-08-26T19:00:00Z', 'Lyon', 'Fenerbahçe', 'UCL Play-offs', 'Lyon 1X', 85, { dcSide: '1X' }),
      leg('2026-08-25T18:45:00Z', 'Sheff Wed', 'Wolves', 'EFL Cup', 'Wolves X2', 84, { dcSide: 'X2' }),
      leg('2026-08-25T19:00:00Z', 'LASK', 'Celtic', 'UCL Play-offs', 'Celtic X2', 83, { dcSide: 'X2' }),
      leg('2026-08-26T19:00:00Z', 'Preston', 'Everton', 'EFL Cup', 'Everton X2', 83, { dcSide: 'X2' }),
      leg('2026-08-29T16:30:00Z', 'Tottenham', 'Newcastle', 'Premier League', 'Tottenham 1X', 82, { dcSide: '1X' }),
      leg('2026-08-25T19:00:00Z', 'Birmingham', 'Brentford', 'EFL Cup', 'Brentford X2', 81, { dcSide: 'X2' }),
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
