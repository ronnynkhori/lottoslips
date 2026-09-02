# LottoSlips

Multi-market lotto slip tracker: TTS, O1.5, U4.5, DC, Straight Win, and Mixed quality folds.

## Live app (permanent)

**https://ronnynkhori.github.io/lottoslips/**

Every push to `main` auto-deploys via GitHub Actions → `gh-pages` branch.

## Local dev

```bash
npm install
npm run dev
```

## Manual Pages deploy

```bash
npm run deploy:pages
```

## Vercel (optional permanent URL)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **ronnynkhori/lottoslips**
3. Framework: Vite · Build: `npm run build` · Output: `dist`
4. Deploy — every `main` push gets a permanent `*.vercel.app` URL

## Repo

https://github.com/ronnynkhori/lottoslips
