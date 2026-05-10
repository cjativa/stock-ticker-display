# Deployment — Raspberry Pi 2B

Target: Raspberry Pi 2B, ARMv7 (armhf), 800×480 RGB LCD display.
Pi username: `cjativa` · IP: `192.168.68.86`

---

## Local development

```bash
npm run dev       # Vite dev server at http://localhost:5173 (hot reload)
npm start         # Production build → Node server at http://localhost:3000
```

Use `npm run dev` when actively making changes. Use `npm start` to test exactly what the Pi will run before deploying.

---

## Deploying an update to the Pi

Every update is the same three commands from the project root on your Mac:

```bash
# 1. Build and package
bash build-deb.sh

# 2. Copy to Pi
scp led-ticker_1.0_armhf.deb cjativa@192.168.68.86:~/

# 3. Install on Pi (will restart automatically if already running)
ssh cjativa@192.168.68.86 "sudo dpkg -i ~/led-ticker_1.0_armhf.deb"
```

Then restart the server on the Pi:

```bash
ssh cjativa@192.168.68.86 "pkill -f server.js; led-ticker &"
```

---

## Starting the app on the Pi

SSH in and run:

```bash
led-ticker &
DISPLAY=:0 chromium-browser --kiosk http://localhost:3000 &
```

Or as a one-liner from your Mac:

```bash
ssh cjativa@192.168.68.86 "led-ticker & sleep 2 && DISPLAY=:0 chromium-browser --kiosk http://localhost:3000 &"
```

---

## How it works

- `build-deb.sh` — runs `npm run build`, assembles the `.deb` folder structure, calls `dpkg-deb`. Requires `dpkg-deb` on Mac (`brew install dpkg`).
- `server.js` — production Node HTTP server. Serves `dist/` as static files and proxies `/logo?url=...` requests server-side to avoid CORS issues with canvas.
- The Finnhub API key is baked into `dist/` at build time via `config.js`. Update it there before running `npm run build`.

---

## File layout on the Pi

```
/usr/local/led-ticker/
├── dist/          ← Vite-built static assets
├── server.js      ← Production Node server (port 3000)
└── package.json   ← {"type":"module"} so Node treats server.js as ESM

/usr/local/bin/
└── led-ticker     ← Shell script: node /usr/local/led-ticker/server.js
```
