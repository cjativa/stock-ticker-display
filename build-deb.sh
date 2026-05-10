#!/usr/bin/env bash
set -euo pipefail

VERSION="1.0"
PKG="led-ticker_${VERSION}_armhf"

echo "→ Building static assets..."
npm run build

echo "→ Creating package structure..."
rm -rf "$PKG"
mkdir -p "$PKG/DEBIAN"
mkdir -p "$PKG/usr/local/led-ticker"
mkdir -p "$PKG/usr/local/bin"

cat > "$PKG/DEBIAN/control" <<EOF
Package: led-ticker
Version: $VERSION
Architecture: armhf
Maintainer: local
Depends: nodejs
Description: LED-style stock ticker display
 Displays stock prices as a glowing RGB LED matrix.
 Start with: led-ticker
 Then open Chromium at http://localhost:3000
EOF

cp -r dist "$PKG/usr/local/led-ticker/"
cp server.js "$PKG/usr/local/led-ticker/"
echo '{"type":"module"}' > "$PKG/usr/local/led-ticker/package.json"

cat > "$PKG/usr/local/bin/led-ticker" <<'SCRIPT'
#!/bin/sh
exec node /usr/local/led-ticker/server.js
SCRIPT
chmod +x "$PKG/usr/local/bin/led-ticker"

echo "→ Building .deb..."
dpkg-deb --build "$PKG"

echo ""
echo "✓ Done: ${PKG}.deb"
echo ""
echo "Copy to Pi:    scp ${PKG}.deb pi@<pi-ip>:~/"
echo "Install on Pi: sudo dpkg -i ${PKG}.deb"
echo "Run on Pi:     led-ticker"
