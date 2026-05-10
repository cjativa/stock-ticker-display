# Deployment Plan — Raspberry Pi 2B (.deb package)

Target: Raspberry Pi 2B, ARMv7 (armhf), 800×480 RGB LCD display.

---

## Step 1 — Write `server.js`

A small Node.js HTTP server that replaces Vite on the Pi. It needs to do two things:

- Serve the `dist/` folder as static files
- Handle the `/logo?url=...` proxy route (fetches logo images server-side to avoid CORS issues with the canvas)

Use Node's built-in `http` module or a minimal Express setup. No other dependencies needed.

---

## Step 2 — Build the static assets

On your Mac, run:

```bash
npm run build
```

Vite bundles everything into `dist/`. The output is pure JavaScript and is architecture-agnostic — it runs on ARMv7 without any changes.

---

## Step 3 — Create the `.deb` directory structure

Build this folder layout on your Mac:

```
led-ticker_1.0_armhf/
├── DEBIAN/
│   └── control               ← package metadata (name, version, arch: armhf, depends: nodejs)
├── usr/local/led-ticker/
│   ├── dist/                 ← output from Step 2
│   └── server.js             ← production server from Step 1
└── usr/local/bin/
    └── led-ticker            ← shell script that runs: node /usr/local/led-ticker/server.js
```

The `led-ticker` shell script in `usr/local/bin/` is what the user runs on the Pi. It just calls Node with the server.

---

## Step 4 — Build the `.deb`

On your Mac, run:

```bash
dpkg-deb --build led-ticker_1.0_armhf
```

This produces `led-ticker_1.0_armhf.deb`.

---

## Step 5 — Copy and install on the Pi

Copy the package to the Pi:

```bash
scp led-ticker_1.0_armhf.deb pi@<pi-ip-address>:~/
```

Install it on the Pi:

```bash
sudo dpkg -i led-ticker_1.0_armhf.deb
```

Because `nodejs` is declared as a dependency in the `control` file, `apt` will install it automatically if it isn't already present.

---

## Step 6 — Run it

On the Pi, in a terminal:

```bash
led-ticker
```

This starts the Node server. Open Chromium and visit:

```
http://localhost:3000
```

The app runs fully locally on the Pi. Any other device on the same network can also visit `http://<pi-ip>:3000` to view it.

---

## Notes

- If you want the server to start automatically on boot in the future, that can be added separately with `systemctl enable` — the `.deb` does not configure this.
- The Finnhub API key lives in `config.js`, which gets bundled into `dist/` at build time. Update it before running `npm run build`.
- To update the app later, rebuild on the Mac and reinstall the `.deb` on the Pi.
