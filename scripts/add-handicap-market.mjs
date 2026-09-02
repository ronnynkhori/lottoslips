/**
 * Add Asian handicap market + boost odds for MIX payout focus.
 * Run: node scripts/add-handicap-market.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function handicapOdds(probability, line) {
  const p = Math.min(86, Math.max(65, probability))
  const lineBoost = Math.abs(line) >= 1.5 ? 0.14 : 0.08
  const targetEdge = 1.04 + (84 - p) * 0.003 + lineBoost
  const raw = (targetEdge * 100) / p
  const min = Math.abs(line) >= 1.5 ? 1.55 : 1.42
  const max = Math.abs(line) >= 1.5 ? 2.15 : 1.78
  return Math.round(Math.min(max, Math.max(min, raw)) * 100) / 100
}

function lineLabel(line) {
  return line > 0 ? `+${line}` : `${line}`
}

function buildHandicapFromWin(leg) {
  const side = leg.winSide ?? 'home'
  const team = side === 'home' ? leg.home : leg.away
  const line = leg.probability >= 82 ? -1 : -1.5
  const probability =
    line === -1
      ? Math.max(70, Math.min(82, leg.probability - 12))
      : Math.max(66, Math.min(78, leg.probability - 16))

  return {
    kickoff: leg.kickoff,
    home: leg.home,
    away: leg.away,
    competition: leg.competition,
    selection: `${team} ${lineLabel(line)}`,
    probability,
    odds: handicapOdds(probability, line),
    settleKind: 'handicap',
    handicapSide: side,
    handicapLine: line,
  }
}

function buildUnderdogCover(leg) {
  const side = leg.scoringSide === 'home' ? 'home' : 'away'
  const team = side === 'home' ? leg.home : leg.away
  const line = 1.5
  const probability = Math.max(66, Math.min(76, leg.probability - 6))

  return {
    kickoff: leg.kickoff,
    home: leg.home,
    away: leg.away,
    competition: leg.competition,
    selection: `${team} ${lineLabel(line)}`,
    probability,
    odds: handicapOdds(probability, line),
    settleKind: 'handicap',
    handicapSide: side,
    handicapLine: line,
  }
}

function boostForMix(leg, marketId) {
  const next = { ...leg }
  if (marketId === 'team_to_score') {
    next.odds = Math.max(next.odds, 1.38)
  }
  if (marketId === 'over_1_5') {
    next.odds = Math.max(next.odds, 1.35)
  }
  if (marketId === 'double_chance') {
    next.odds = Math.max(next.odds, 1.38)
  }
  return next
}

function main() {
  const paths = [
    join(root, 'src/data/currentCard.json'),
    join(root, 'public/cards/current.json'),
  ]

  for (const path of paths) {
    const card = JSON.parse(readFileSync(path, 'utf8'))
    card.cardVersion = 16
    card.label = 'Week 36 · handicap + payout mix card'
    card.updatedAt = new Date().toISOString()

    const swLegs = card.markets.straight_win?.legs ?? []
    const ttsLegs = card.markets.team_to_score?.legs ?? []

    const favHandicaps = swLegs.map(buildHandicapFromWin)
    const underdogCovers = ttsLegs
      .filter((_, i) => i % 4 === 0)
      .slice(0, 8)
      .map(buildUnderdogCover)

    const seen = new Set()
    const handicapLegs = [...favHandicaps, ...underdogCovers].filter((leg) => {
      const key = `${leg.kickoff}|${leg.home}|${leg.away}|${leg.handicapSide}|${leg.handicapLine}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    card.markets.handicap = {
      title: `Asian Handicap · ${handicapLegs.length}-fold`,
      description:
        'Favourite -1 / -1.5 and underdog +1.5 covers. Higher odds than outright wins, still solid hit rates.',
      legs: handicapLegs,
    }

    for (const [marketId, draft] of Object.entries(card.markets)) {
      if (marketId === 'mixed') {
        draft.title = 'Payout mix (auto-built)'
        draft.description =
          'Built at load — handicap-heavy, 68%+ at 1.38+ odds, best payout per fixture.'
        continue
      }
      if (marketId === 'handicap') continue
      draft.legs = draft.legs.map((leg) => boostForMix(leg, marketId))
    }

    writeFileSync(path, `${JSON.stringify(card, null, 2)}\n`)
    console.log('Updated', path, '—', handicapLegs.length, 'handicap legs')
  }

  const card = JSON.parse(readFileSync(paths[0], 'utf8'))
  const hc = card.markets.handicap.legs
  console.log(
    'AH odds range',
    Math.min(...hc.map((l) => l.odds)),
    '–',
    Math.max(...hc.map((l) => l.odds)),
  )
}

main()
