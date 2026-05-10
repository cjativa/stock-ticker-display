# LED Ticker

A lightweight web app that displays stock tickers in the visual style of an RGB LED matrix display. Pure vanilla JS, runs locally via Vite.

## Quick start

```bash
npm install
npm start
```

Open http://localhost:5173 — out of the box it runs in **demo mode** with simulated random-walk prices, so you can see it working immediately without any setup.

## Live data

To fetch real stock prices:

1. Sign up for a free Finnhub account at https://finnhub.io/ (takes about 30 seconds)
2. Copy your API key from the dashboard
3. Open `config.js` and replace `YOUR_API_KEY_HERE` with your key
4. Restart the server

The free tier allows 60 calls/minute, which is plenty for a handful of tickers refreshing every 30 seconds.

## Sparkline graph

The sparkline along the bottom of each panel shows price history, left = oldest, right = most recent. Here's what it actually contains at any given moment:

**On startup:** The app attempts to fetch 45 days of daily closing prices from Finnhub's `/stock/candles` endpoint to pre-populate the graph. This endpoint requires a paid Finnhub plan — on the free tier it fails silently, and the sparkline is instead seeded with a synthetically generated random walk that ends at the current real price. The shape is fabricated; only the rightmost point is real.

**While running:** Every 30 seconds a new real price point is appended and the oldest point drops off. The buffer holds 60 points (`historyLength` in `config.js`), so after approximately 30 minutes of continuous runtime the sparkline is entirely real data representing the last 30 minutes of price movement.

**On weekends / when the market is closed:** Finnhub returns the same last closing price on every fetch. All incoming points are identical, so the right side of the sparkline goes flat.

### Getting real historical data at startup

Two options:

- **Finnhub paid plan** — unlocks the `/stock/candles` endpoint, which the app already calls on boot. Check current pricing at https://finnhub.io/pricing.
- **Yahoo Finance** — free, no API key required, provides intraday history. Less reliable (scraping-based) but functional. Would require replacing the data source in `src/data.js`.

## Customization

Edit `config.js`:

- `tickers` — array of stock symbols to display
- `rotationSeconds` — how long each ticker shows in single-ticker view
- `refreshSeconds` — how often each ticker's price is fetched
- `historyLength` — how many price points to keep for the sparkline (default 60)

## Running on a Raspberry Pi

See `DEPLOYMENT.md` for the full plan to package this as a `.deb` for the Pi.

For quick local use on a Pi, the setup is the same as any other machine:

```bash
npm install
npm start
```

Then open Chromium and visit `http://localhost:5173`. The server binds to `0.0.0.0` so any device on your local network can also view it at `http://<pi-ip>:5173`.

The UI automatically adapts to the viewport — it has been tuned for an 800×480 display.

## How it works

- **`src/font.js`** — a 5×7 pixel bitmap font plus a compact 3×5 font for percent change labels
- **`src/matrix.js`** — turns a 2D pixel buffer into a glowing LED matrix on `<canvas>` with three rendering passes: unlit dots, glow halos, and lit pixels
- **`src/logos.js`** — fetches company logos via a Vite proxy (to avoid CORS), renders them to an offscreen canvas at 12×12 pixels with 4× supersampling for sharp edges
- **`src/data.js`** — fetches quotes and profiles from Finnhub, or simulates prices in demo mode
- **`src/main.js`** — manages both the 2×2 grid view and the single full-screen rotating view, and orchestrates fetch loops and rendering
- **`vite.config.js`** — includes a logo proxy plugin so the browser never makes cross-origin canvas draws
