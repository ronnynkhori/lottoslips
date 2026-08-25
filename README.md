# LottoSlips

Web app that always builds **four 20-fold betting slips**, tracks results, suggests rebets after early losses, and ranks which market performs best.

## Markets

1. **Team to Score**
2. **Over 1.5 Goals**
3. **Under 4.5 Goals**
4. **Double Chance** (1X / X2)

Seeded with the Aug 25–30 2026 card discussed in chat. Click **New week · 4 slips** to generate another set.

## Features

- Mark each leg **W / L / V / pending**
- **Rebet suggestions** when the first 1–2 kickoffs lose (rebuilds remaining legs at a reduced stake)
- **Market rankings** by leg hit-rate, slip hits, and ROI
- Persistence in `localStorage`

## Run

```bash
cd slip-tracker
npm install
npm run dev
```

Build:

```bash
npm run build
```

Not betting advice — for tracking lotto-style accumulators only.
