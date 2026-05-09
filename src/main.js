import { config } from '../config.js';
import { LEDMatrix } from './matrix.js';
import { drawText, textWidth, CHAR_HEIGHT, drawSmallText, smallTextWidth, SMALL_CHAR_HEIGHT } from './font.js';
import { drawLogo, preloadLogo, LOGO_SIZE } from './logos.js';
import { fetchTicker, fetchProfile, preloadHistory, getHistory } from './data.js';

const COLS = 64;
const ROWS = 32;
const PANEL_COUNT = Math.min(config.tickers.length, 4);

function calcPixelSize() {
  // 2×2 grid: 1 gap column, 1 gap row, panel padding on each cell
  const stagePadH = 32;  // 16px left + 16px right
  const stagePadV = 32;  // 16px top + 16px bottom
  const gap = 8;         // single gap between the two columns / rows
  const panelPadH = 32;  // 16px left + 16px right per panel
  const panelPadV = 20;  // 10px top + 10px bottom per panel

  const availW = (window.innerWidth  - stagePadH - gap - panelPadH * 2) / 2;
  const availH = (window.innerHeight - stagePadV - gap - panelPadV * 2) / 2;

  const ps = Math.max(4, Math.min(
    Math.floor(availW / COLS),
    Math.floor(availH / ROWS)
  ));
  return { pixelSize: ps, dotRadius: Math.max(1.5, ps * 0.32) };
}

const COLOR_WHITE = '#f5f5f5';
const COLOR_GREEN = '#22ff66';
const COLOR_RED = '#ff3344';
const COLOR_DIM = '#888888';

const LOGO_X = 1;
const LOGO_Y = 1;
const TEXT_X_WITH_LOGO = LOGO_X + LOGO_SIZE + 2;

// Build one panel div + canvas per ticker
const panelsEl = document.getElementById('panels');
panelsEl.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;';

const { pixelSize, dotRadius } = calcPixelSize();

const matrices = config.tickers.slice(0, PANEL_COUNT).map(() => {
  const wrap = document.createElement('div');
  wrap.className = 'panel';
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);
  panelsEl.appendChild(wrap);
  return new LEDMatrix(canvas, COLS, ROWS, { pixelSize, dotRadius });
});

const latest = new Map();

function formatPrice(p) {
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return p.toFixed(2);
}

function formatPct(p) {
  const sign = p >= 0 ? '+' : '';
  return `${sign}${p.toFixed(2)}%`;
}

function drawSparkline(buffer, history, color, x0, y0, width, height) {
  if (history.length < 1) return;
  if (history.length === 1) {
    // Draw a flat baseline until more data arrives
    const y = y0 + height - 1;
    for (let col = 0; col < width; col++) buffer.setPixel(x0 + col, y, color);
    return;
  }
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  let prevY = null;
  for (let col = 0; col < width; col++) {
    const idx = Math.round((col / (width - 1)) * (history.length - 1));
    const v = history[idx];
    const norm = (v - min) / range;
    const y = Math.round(y0 + height - 1 - norm * (height - 1));
    for (let yy = y; yy < y0 + height; yy++) {
      buffer.setPixel(x0 + col, yy, color);
    }
    if (prevY !== null && Math.abs(prevY - y) > 1) {
      const lo = Math.min(prevY, y);
      const hi = Math.max(prevY, y);
      for (let yy = lo; yy <= hi; yy++) {
        buffer.setPixel(x0 + col - 1, yy, color);
      }
    }
    prevY = y;
  }
}

function renderPanel(panelIndex, data) {
  const matrix = matrices[panelIndex];
  matrix.clear();

  const changeColor = data.pctChange >= 0 ? COLOR_GREEN : COLOR_RED;

  const logoDrawn = drawLogo(matrix.buffer, data.ticker, LOGO_X, LOGO_Y);
  const textX = logoDrawn ? TEXT_X_WITH_LOGO : 1;

  // Ticker symbol — top row, left
  drawText(matrix.buffer, data.ticker, textX, 1, COLOR_WHITE);

  // Percent change — top row, right-aligned in smaller 3×5 font
  // Vertically centered against the 7-tall ticker text
  const pctStr = formatPct(data.pctChange);
  const pctW = smallTextWidth(pctStr);
  const pctY = 1 + Math.floor((CHAR_HEIGHT - SMALL_CHAR_HEIGHT) / 2);
  drawSmallText(matrix.buffer, pctStr, COLS - pctW - 1, pctY, changeColor);

  // Price — second row, left
  const priceStr = `$${formatPrice(data.price)}`;
  drawText(matrix.buffer, priceStr, textX, CHAR_HEIGHT + 3, COLOR_WHITE);

  // Sparkline along the bottom
  const history = getHistory(data.ticker);
  const sparkY = CHAR_HEIGHT * 2 + 5;
  const sparkH = ROWS - sparkY - 1;
  if (sparkH > 0) {
    drawSparkline(matrix, history, changeColor, 1, sparkY, COLS - 2, sparkH);
  }

  matrix.render();
}

function renderLoading(panelIndex, message) {
  const matrix = matrices[panelIndex];
  matrix.clear();
  const w = textWidth(message);
  drawText(
    matrix.buffer,
    message,
    Math.max(1, Math.floor((COLS - w) / 2)),
    Math.floor((ROWS - CHAR_HEIGHT) / 2),
    COLOR_DIM
  );
  matrix.render();
}

// Per-ticker fetch loop — each renders into its own panel
async function refreshLoop(ticker, panelIndex) {
  while (true) {
    const data = await fetchTicker(ticker);
    if (data) {
      latest.set(ticker, data);
      renderPanel(panelIndex, data);
    }
    await sleep(config.refreshSeconds * 1000);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Boot — show loading state on each panel, then start fetch loops
config.tickers.slice(0, PANEL_COUNT).forEach((ticker, i) => {
  renderLoading(i, ticker);

  // Load historical candles so the sparkline is populated immediately
  preloadHistory(ticker).then(() => {
    const data = latest.get(ticker);
    if (data) renderPanel(i, data);
  });

  // Load logo, re-render if price data already arrived
  fetchProfile(ticker).then(profile =>
    preloadLogo(ticker, profile?.logo).then(() => {
      const data = latest.get(ticker);
      if (data) renderPanel(i, data);
    })
  );

  setTimeout(() => refreshLoop(ticker, i), i * 250);
});

if (!config.finnhubApiKey || config.finnhubApiKey === 'YOUR_API_KEY_HERE') {
  document.getElementById('demo-notice').style.display = 'block';
}
