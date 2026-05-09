export const LOGO_SIZE = 12;

// Supersampling factor: render at 4× then average down for sharp edges
const SS = 4;

// ticker → 2D array: pixels[y][x] = '#rrggbb' | null
const cache = new Map();

export async function preloadLogo(ticker, url) {
  if (cache.has(ticker)) return;
  if (!url) { cache.set(ticker, null); return; }
  try {
    const proxied = `/logo?url=${encodeURIComponent(url)}`;
    const pixels = await pixelizeLogo(proxied, LOGO_SIZE);
    cache.set(ticker, pixels);
  } catch (err) {
    console.warn(`[logo] ${ticker} failed:`, err);
    cache.set(ticker, null);
  }
}

export function drawLogo(buffer, ticker, x, y) {
  const pixels = cache.get(ticker);
  if (!pixels) return false;
  for (let row = 0; row < pixels.length; row++) {
    for (let col = 0; col < pixels[row].length; col++) {
      const color = pixels[row][col];
      if (color && buffer[y + row]) buffer[y + row][x + col] = color;
    }
  }
  return true;
}

async function pixelizeLogo(url, size) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const big = size * SS;
      const canvas = document.createElement('canvas');
      canvas.width = big;
      canvas.height = big;
      const ctx = canvas.getContext('2d');
      // No background fill — keep transparent so alpha channel is meaningful
      ctx.drawImage(img, 0, 0, big, big);
      const { data } = ctx.getImageData(0, 0, big, big);

      const bg = detectBackground(data, big);
      const pixels = downsample(data, big, size, bg);
      resolve(pixels);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Sample corners to decide if we're dealing with a transparent or solid background
function detectBackground(data, size) {
  const corners = [[0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1]];
  const samples = corners.map(([x, y]) => {
    const i = (y * size + x) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  });

  // If all corners are transparent → use alpha channel to find the logo
  if (samples.every(s => s.a < 30)) return { transparent: true };

  // Average the opaque corners to get the background color
  const opaque = samples.filter(s => s.a > 200);
  if (opaque.length < 2) return { transparent: true };
  const r = opaque.reduce((s, p) => s + p.r, 0) / opaque.length;
  const g = opaque.reduce((s, p) => s + p.g, 0) / opaque.length;
  const b = opaque.reduce((s, p) => s + p.b, 0) / opaque.length;
  return { transparent: false, r, g, b };
}

function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function downsample(data, big, size, bg) {
  const pixels = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const i = ((y * SS + dy) * big + (x * SS + dx)) * 4;
          rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2]; aSum += data[i + 3];
        }
      }
      const n = SS * SS;
      const ar = rSum / n, ag = gSum / n, ab = bSum / n, aa = aSum / n;

      const isOn = bg.transparent
        ? aa > 64                                            // transparent bg: use alpha
        : colorDist(ar, ag, ab, bg.r, bg.g, bg.b) > 30;   // solid bg: differ from background

      if (isOn) {
        const maxCh = Math.max(ar, ag, ab, 1);
        const scale = 220 / maxCh;
        const br = Math.min(255, Math.round(ar * scale));
        const bg2 = Math.min(255, Math.round(ag * scale));
        const bb = Math.min(255, Math.round(ab * scale));
        row.push(`#${hex(br)}${hex(bg2)}${hex(bb)}`);
      } else {
        row.push(null);
      }
    }
    pixels.push(row);
  }
  return pixels;
}

function hex(n) {
  return n.toString(16).padStart(2, '0');
}
