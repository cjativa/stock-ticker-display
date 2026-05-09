# LED Ticker

A lightweight web app that displays cycling stock tickers in the visual style of an RGB LED matrix display. Pure vanilla JS, runs locally via Vite.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 — out of the box it runs in **demo mode** with simulated random-walk prices, so you can see it working immediately without any setup.

## Live data

To fetch real stock prices:

1. Sign up for a free Finnhub account at https://finnhub.io/ (takes about 30 seconds)
2. Copy your API key from the dashboard
3. Open `config.js` and replace `YOUR_API_KEY_HERE` with your key
4. Restart the dev server

The free tier allows 60 calls/minute, which is plenty for a handful of tickers refreshing every 30 seconds.

## Customization

Edit `config.js`:

- `tickers` — array of stock symbols to cycle through
- `rotationSeconds` — how long each ticker is shown
- `refreshSeconds` — how often each ticker's price is fetched
- `historyLength` — how many price points to keep for the sparkline

## Running on a Raspberry Pi

For a kiosk-style display on a Pi connected to a monitor:

```bash
npm install
npm run build
npm run preview
```

Then open Chromium in fullscreen pointing at http://localhost:4173. The Vite config exposes the server on `0.0.0.0` so you can also view it from another device on your LAN.

## How it works

- **`src/font.js`** — a 5x7 pixel bitmap font, rendered character-by-character into a buffer
- **`src/matrix.js`** — turns a 2D pixel buffer into a glowing LED matrix on `<canvas>` with three rendering passes: unlit dots, glow halos, and lit pixels
- **`src/data.js`** — fetches from Finnhub or simulates prices in demo mode
- **`src/main.js`** — orchestrates the rotation, fetch loop, and per-frame rendering

The "panel" is 64×32 logical pixels, scaled up via `pixelSize` in `main.js`. To make it bigger or smaller, change that value.
# stock-ticker-display
