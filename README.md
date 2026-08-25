# LottoSlips

Web app that always builds **four 20-fold betting slips**, tracks results, suggests rebets after early losses, and ranks which market performs best.

## Markets

1. **Team to Score**
2. **Over 1.5 Goals**
3. **Under 4.5 Goals**
4. **Double Chance** (1X / X2)

## Deploy on Vercel

### Option A — CLI

```bash
cd slip-tracker   # or this repo root if that's the project
npm i -g vercel
vercel
```

Follow the prompts, then for production:

```bash
vercel --prod
```

### Option B — Dashboard

1. Push this project to GitHub / GitLab / Bitbucket  
2. Go to [vercel.com/new](https://vercel.com/new)  
3. Import the repo  
4. Vercel auto-detects **Vite** via `vercel.json`  
   - Build command: `npm run build`  
   - Output: `dist`  
5. Deploy  

SPA routes rewrite to `index.html`. No env vars required (data is `localStorage` in the browser).

## Local development

```bash
npm install
npm run dev
```

Production build check:

```bash
npm run build
npm run preview
```

## Features

- Always generates the four core slips  
- Mark each leg **W / L / V / pending**  
- **Rebet suggestions** when the first 1–2 kickoffs lose  
- **Market rankings** by leg hit-rate, slip hits, and ROI  
- Persistence in `localStorage`

Not betting advice — for tracking lotto-style accumulators only.
