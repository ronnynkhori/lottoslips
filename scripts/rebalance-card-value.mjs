/**
 * Rebalance weekly card toward value picks: high % but odds with upside.
 * Run: node scripts/rebalance-card-value.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function valueOddsFromProbability(probability, { min = 1.28, max = 1.75 } = {}) {
  const p = Math.min(88, Math.max(70, probability))
  const targetEdge = 1.05 + (86 - p) * 0.004
  const raw = (targetEdge * 100) / p
  return Math.round(Math.min(max, Math.max(min, raw)) * 100) / 100
}

function edge(p, o) {
  return (p * o) / 100
}

function rebalanceLeg(leg, marketId) {
  const next = { ...leg }

  if (marketId === 'straight_win') {
    // Favourites priced with juice — trim ultra-bankers, lift odds
    next.probability = Math.min(86, Math.max(72, leg.probability - 6))
    next.odds = valueOddsFromProbability(next.probability, { min: 1.3, max: 1.72 })
    return next
  }

  if (marketId === 'team_to_score') {
    next.odds = Math.max(leg.odds, valueOddsFromProbability(leg.probability, { min: 1.28, max: 1.55 }))
    return next
  }

  if (marketId === 'over_1_5') {
    next.probability = Math.min(88, leg.probability)
    next.odds = Math.max(leg.odds, valueOddsFromProbability(next.probability, { min: 1.22, max: 1.42 }))
    return next
  }

  if (marketId === 'under_4_5') {
    next.odds = Math.max(leg.odds, valueOddsFromProbability(leg.probability, { min: 1.18, max: 1.38 }))
    return next
  }

  if (marketId === 'double_chance') {
    // DC bankers were crushed — nudge prob down slightly and lift odds
    next.probability = Math.min(90, Math.max(78, leg.probability - 4))
    next.odds = Math.max(leg.odds, valueOddsFromProbability(next.probability, { min: 1.22, max: 1.48 }))
    return next
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
    card.cardVersion = 15
    card.label = 'Week 36 · value multibet card'
    card.updatedAt = new Date().toISOString()

    for (const [marketId, draft] of Object.entries(card.markets)) {
      if (marketId === 'mixed') {
        draft.title = 'Value mix (auto-built)'
        draft.description =
          'Built at load from best value legs across all markets — 72%+ with odds 1.25+.'
        continue
      }

      draft.legs = draft.legs.map((leg) => rebalanceLeg(leg, marketId))

      if (marketId === 'straight_win') {
        draft.title = `Value wins · ${draft.legs.length}-fold`
        draft.description =
          'Confident 1X2 picks with upside — not ultra-short bankers. 72%+ at 1.30+.'
      }
    }

    writeFileSync(path, `${JSON.stringify(card, null, 2)}\n`)
    console.log('Updated', path)
  }

  const card = JSON.parse(readFileSync(paths[0], 'utf8'))
  const all = []
  for (const [m, d] of Object.entries(card.markets)) {
    for (const l of d.legs) all.push({ ...l, market: m, edge: edge(l.probability, l.odds) })
  }
  const sw = card.markets.straight_win.legs
  console.log('SW odds', Math.min(...sw.map((l) => l.odds)), '–', Math.max(...sw.map((l) => l.odds)))
  console.log(
    'Value pool (72%+, 1.25+, edge 1.02+):',
    all.filter((l) => l.probability >= 72 && l.odds >= 1.25 && l.edge >= 1.02).length,
  )
}

main()
