# LottoSlips

Multi-market lotto slip tracker: TTS, O1.5, U4.5, DC, Straight Win, and Mixed quality folds.

## Live app (permanent)

**https://ronnynkhori.github.io/lottoslips/**

Hosted from the `gh-pages` branch — does not expire.

## Deploy after changes

```bash
npm run deploy
```

## Auto-deploy on every push (one-time setup)

GitHub blocks workflow files from this agent token. Enable it once in your browser:

1. Open [Add workflow file on GitHub](https://github.com/ronnynkhori/lottoslips/new/main?filename=.github%2Fworkflows%2Fdeploy-pages.yml)
2. Paste the contents of [`scripts/deploy-pages.workflow.yml`](scripts/deploy-pages.workflow.yml)
3. Commit to `main`

Every future push to `main` will auto-deploy to Pages.

## Permanent Vercel URL (recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fronnynkhori%2Flottoslips&project-name=lottoslips&framework=vite&build-command=npm%20run%20build&output-directory=dist)

Or manually: [vercel.com/new](https://vercel.com/new) → Import **ronnynkhori/lottoslips** → Build `npm run build` → Output `dist`.

## Local dev

```bash
npm install
npm run dev
```

## Repo

https://github.com/ronnynkhori/lottoslips
