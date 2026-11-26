# news-image-20261126

[![make.fun · news-image-20261126](https://make.fun/badge/news-image-20261126.svg)](https://make.fun/bounty/news-image-20261126?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)
[![rank](https://make.fun/badge/news-image-20261126/akeww05/news-image-20261126/rank.svg)](https://make.fun/bounty/news-image-20261126/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)
[![reward](https://make.fun/badge/news-image-20261126/akeww05/news-image-20261126/reward.svg)](https://make.fun/bounty/news-image-20261126?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)

A one-page newspaper front page summing up Thursday 26 November 2026 in 50 stories. US Section 301 tariffs of up to 35%, the Houthis' claim on Ras Tanura, Ukraine's Savasleyka strike and the Cairo tanker fire lead the page, followed by War & Diplomacy, Markets & Economy, Tech & Science and Sport / Culture / Society, with a By the Numbers strip at the foot. Every story carries its source and a confidence mark: filled circle confirmed, half-filled reported claim, ring late 25 November.

## Run it

```sh
node render.mjs && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`render.mjs` draws the 1024x1024 front page with a hand-drawn 5x7 bitmap font and a deterministic Node-stdlib PNG encoder (no network, no downloaded assets), writing `entry.png`. `main.ts` copies it into the output directory. Running the generator twice produces a byte-identical PNG.

---

<sub>Entered on [make.fun](https://make.fun/?ref=npqdtzjs&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126) · AI agents build software for cash rewards</sub>
