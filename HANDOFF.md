# LED Ticker — Project Handoff

## Background

The goal is a lightweight web app that displays cycling stock tickers in the visual style of an RGB LED matrix display (like the Tidbyt / LaMetric devices). Originally I considered building this on a Raspberry Pi with a real HUB75 LED panel, but pivoted to a web app that mimics the pixel-LED aesthetic on a regular monitor. The app is intended to run locally — likely on a Pi connected to a display, served via `npm run dev` or `npm run preview`.

## What's been built

A working vanilla-JS prototype using Vite. No frameworks, no backend — calls the stock API directly from the browser. The whole production bundle is about 3 KB gzipped.

### Project structure

```
led-ticker/
├── index.html              # Entry point with panel framing styles
├── package.json            # Vite is the only dep
├── vite.config.js          # Exposes server on 0.0.0.0 for LAN access
├── config.js               # User-editable: API key, tickers, timing
├── config.example.js       # Template for sharing/version control
├── README.md
└── src/
    ├── font.js             # 5x7 bitmap font (hand-defined glyphs)
    ├── matrix.js           # Canvas-based LED panel renderer
    ├── data.js             # Finnhub API client + demo mode fallback
    └── main.js             # Orchestration: fetch loop, rotation, frame composition
```

### How the pieces work

**`font.js`** — A 5x7 pixel font defined as binary patterns (each row is a 5-bit number). Covers `0-9`, `A-Z`, and the symbols needed for tickers: `$ % + - . , : /`. Exposes `drawText(buffer, str, x, y, color)` which stamps characters into a 2D pixel buffer, plus `textWidth(str)` for right-aligning.

**`matrix.js`** — The `LEDMatrix` class wraps a `<canvas>` and exposes a logical pixel buffer (default 64×32). Each `render()` call does three passes:
1. Dim unlit dots across the whole grid (this is what sells the LED look — you can faintly see all the off LEDs in the background)
2. Radial-gradient glow halos behind lit pixels, composited with `globalCompositeOperation = 'lighter'` so overlapping glows brighten naturally
3. Bright lit dots on top

**`data.js`** — `fetchTicker(ticker)` calls Finnhub's `/quote` endpoint and returns `{ ticker, price, pctChange }`. If no API key is configured, falls back to a per-ticker random-walk simulator so the UI works out of the box. Maintains a rolling price history per ticker (default 60 points) for the sparkline.

**`main.js`** — Boots the matrix, starts an independent refresh loop per ticker (staggered by 250 ms so they don't burst the API), and rotates the displayed ticker on a timer. Each frame draws: ticker symbol top-left in white, percent change top-right in green/red, price below in white, and a filled-column sparkline along the bottom in the same green/red. Re-renders immediately when fresh data arrives for the currently-displayed ticker.

### Configuration (`config.js`)

```js
{
  finnhubApiKey: 'YOUR_API_KEY_HERE',  // get free at finnhub.io
  tickers: ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL'],
  rotationSeconds: 8,                   // how long each ticker shows
  refreshSeconds: 30,                   // per-ticker fetch interval
  historyLength: 60,                    // sparkline data points
}
```

Finnhub free tier is 60 calls/minute — comfortably within reach for this default config.

## Key design decisions worth knowing

- **Canvas, not DOM grid.** Considered making each LED a `<div>` (~2,000 nodes for 64×32) but went with canvas for the sparkline freedom and lower overhead.
- **Logical 64×32 panel scaled up via `pixelSize`** (currently 14 — change in `main.js` to resize).
- **API call from browser.** Fine for local-only use. If this ever gets deployed publicly, the key needs to move behind a proxy.
- **Sparkline draws as filled columns**, not a line — reads better at this resolution and matches the reference photos.
- **Demo mode is the default.** App works immediately on first run without any signup.

## How to move forward

```bash
cd led-ticker
npm install
npm run dev          # http://localhost:5173
```

For Pi kiosk deployment: `npm run build && npm run preview`, then launch Chromium with `--kiosk http://localhost:4173`.

### Possible next steps you might want to ask Claude Code about

- **Multiple panels stacked** instead of cycling (one ticker per panel on a wall of them)
- **Better fonts** — there are public BDF/PSF pixel fonts that would give more character variety; could be parsed at build time
- **Pre-market / after-hours indicators** — Finnhub returns `t` (timestamp) and you can derive market session
- **Color themes** — currently hardcoded green/red; worth pulling into config
- **Switch to Yahoo Finance** if you want to skip API keys entirely (less reliable but no signup)
- **Backend proxy** if you ever want to deploy publicly without exposing the key
- **News headlines or other data** scrolling across the bottom row
- **Smooth pixel transitions** when the value changes (currently snaps)

Good luck with it!
