import { config } from '../config.js';
import { LEDMatrix } from './matrix.js';
import { drawText, textWidth, CHAR_HEIGHT, drawSmallText, smallTextWidth, SMALL_CHAR_HEIGHT } from './font.js';
import { drawLogo, preloadLogo, LOGO_SIZE } from './logos.js';
import { fetchTicker, fetchProfile, preloadHistory, getHistory } from './data.js';

const COLS = 64;
const ROWS = 32;
const PANEL_COUNT = Math.min(config.tickers.length, 4);

const COLOR_WHITE = '#f5f5f5';
const COLOR_GREEN = '#22ff66';
const COLOR_RED   = '#ff3344';
const COLOR_DIM   = '#888888';

const LOGO_X = 1;
const LOGO_Y = 1;
const TEXT_X_WITH_LOGO = LOGO_X + LOGO_SIZE + 2;

// ── Pixel-size calculators ─────────────────────────────────────────────────

function calcGridPixelSize() {
  // stage padding 4px each side → 8px total; panel padding 4px each side → 8px total;
  // 1 gap of 4px between columns/rows; 44px button bar
  const stagePadH = 8, stagePadV = 8, gap = 4, panelPadH = 8, panelPadV = 8;
  const availW = (window.innerWidth  - stagePadH - gap - panelPadH * 2) / 2;
  const availH = (window.innerHeight - stagePadV - gap - panelPadV * 2) / 2;
  const ps = Math.max(4, Math.min(Math.floor(availW / COLS), Math.floor(availH / ROWS)));
  return { pixelSize: ps, dotRadius: Math.max(1.5, ps * 0.32) };
}

function calcSinglePixelSize() {
  const availW = window.innerWidth  - 8;
  const availH = window.innerHeight - 8;
  const ps = Math.max(4, Math.min(Math.floor(availW / COLS), Math.floor(availH / ROWS)));
  return { pixelSize: ps, dotRadius: Math.max(1.5, ps * 0.32) };
}

// ── Build grid panels ──────────────────────────────────────────────────────

const panelsEl = document.getElementById('panels');
panelsEl.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:4px;width:100%;';

const { pixelSize: gridPS, dotRadius: gridDR } = calcGridPixelSize();

const matrices = config.tickers.slice(0, PANEL_COUNT).map(() => {
  const wrap = document.createElement('div');
  wrap.className = 'panel';
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);
  panelsEl.appendChild(wrap);
  return new LEDMatrix(canvas, COLS, ROWS, { pixelSize: gridPS, dotRadius: gridDR });
});

// ── Single-panel setup ─────────────────────────────────────────────────────

const singlePanelEl = document.getElementById('single-panel');
const singleCanvas  = document.getElementById('single-canvas');
const { pixelSize: singlePS, dotRadius: singleDR } = calcSinglePixelSize();
const singleMatrix = new LEDMatrix(singleCanvas, COLS, ROWS, { pixelSize: singlePS, dotRadius: singleDR });

// ── View state ─────────────────────────────────────────────────────────────

let mode = 'grid'; // 'grid' | 'single'
let singleTickerIndex = 0;
let singleRotationTimer = null;

// ── Shared rendering ───────────────────────────────────────────────────────

const latest = new Map();

function formatPrice(p) {
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return p.toFixed(2);
}

function formatPct(p) {
  const sign = p >= 0 ? '+' : '';
  return `${sign}${p.toFixed(2)}%`;
}

function drawSparkline(matrix, history, color, x0, y0, width, height) {
  if (history.length < 1) return;
  if (history.length === 1) {
    const y = y0 + height - 1;
    for (let col = 0; col < width; col++) matrix.setPixel(x0 + col, y, color);
    return;
  }
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  let prevY = null;
  for (let col = 0; col < width; col++) {
    const idx = Math.round((col / (width - 1)) * (history.length - 1));
    const norm = (history[idx] - min) / range;
    const y = Math.round(y0 + height - 1 - norm * (height - 1));
    for (let yy = y; yy < y0 + height; yy++) matrix.setPixel(x0 + col, yy, color);
    if (prevY !== null && Math.abs(prevY - y) > 1) {
      const lo = Math.min(prevY, y), hi = Math.max(prevY, y);
      for (let yy = lo; yy <= hi; yy++) matrix.setPixel(x0 + col - 1, yy, color);
    }
    prevY = y;
  }
}

// Core drawing — works on any LEDMatrix instance
function drawTickerToMatrix(matrix, data) {
  matrix.clear();
  const changeColor = data.pctChange >= 0 ? COLOR_GREEN : COLOR_RED;
  const logoDrawn = drawLogo(matrix.buffer, data.ticker, LOGO_X, LOGO_Y);
  const textX = logoDrawn ? TEXT_X_WITH_LOGO : 1;

  drawText(matrix.buffer, data.ticker, textX, 1, COLOR_WHITE);

  const pctStr = formatPct(data.pctChange);
  const pctW = smallTextWidth(pctStr);
  const pctY = 1 + Math.floor((CHAR_HEIGHT - SMALL_CHAR_HEIGHT) / 2);
  drawSmallText(matrix.buffer, pctStr, COLS - pctW - 1, pctY, changeColor);

  const priceStr = `$${formatPrice(data.price)}`;
  drawText(matrix.buffer, priceStr, textX, CHAR_HEIGHT + 3, COLOR_WHITE);

  const history = getHistory(data.ticker);
  const sparkY = CHAR_HEIGHT * 2 + 5;
  const sparkH = ROWS - sparkY - 1;
  if (sparkH > 0) drawSparkline(matrix, history, changeColor, 1, sparkY, COLS - 2, sparkH);

  matrix.render();
}

function drawLoadingToMatrix(matrix, message) {
  matrix.clear();
  const w = textWidth(message);
  drawText(
    matrix.buffer, message,
    Math.max(1, Math.floor((COLS - w) / 2)),
    Math.floor((ROWS - CHAR_HEIGHT) / 2),
    COLOR_DIM
  );
  matrix.render();
}

// ── Grid-mode render helpers ───────────────────────────────────────────────

function renderPanel(panelIndex, data) {
  drawTickerToMatrix(matrices[panelIndex], data);
  // Keep single panel live if the active ticker just refreshed
  if (mode === 'single' && config.tickers[singleTickerIndex] === data.ticker) {
    drawTickerToMatrix(singleMatrix, data);
  }
}

function renderLoading(panelIndex, message) {
  drawLoadingToMatrix(matrices[panelIndex], message);
}

// ── Single-mode helpers ────────────────────────────────────────────────────

function renderSingleCurrent() {
  const ticker = config.tickers[singleTickerIndex];
  const data = latest.get(ticker);
  if (data) drawTickerToMatrix(singleMatrix, data);
  else drawLoadingToMatrix(singleMatrix, ticker);
}

function enterSingleView() {
  mode = 'single';
  panelsEl.style.display = 'none';
  singlePanelEl.style.display = 'flex';
  renderSingleCurrent();
  singleRotationTimer = setInterval(() => {
    singleTickerIndex = (singleTickerIndex + 1) % config.tickers.length;
    renderSingleCurrent();
  }, config.rotationSeconds * 1000);
  document.getElementById('btn-single').classList.add('active');
  document.getElementById('btn-grid').classList.remove('active');
}

function enterGridView() {
  mode = 'grid';
  clearInterval(singleRotationTimer);
  singleRotationTimer = null;
  singlePanelEl.style.display = 'none';
  panelsEl.style.display = 'grid';
  config.tickers.slice(0, PANEL_COUNT).forEach((ticker, i) => {
    const data = latest.get(ticker);
    if (data) drawTickerToMatrix(matrices[i], data);
  });
  document.getElementById('btn-grid').classList.add('active');
  document.getElementById('btn-single').classList.remove('active');
}

document.getElementById('btn-single').addEventListener('click', () => {
  if (mode !== 'single') enterSingleView();
});
document.getElementById('btn-grid').addEventListener('click', () => {
  if (mode !== 'grid') enterGridView();
});

// ── Data fetch loops ───────────────────────────────────────────────────────

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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Boot ───────────────────────────────────────────────────────────────────

config.tickers.slice(0, PANEL_COUNT).forEach((ticker, i) => {
  renderLoading(i, ticker);

  preloadHistory(ticker).then(() => {
    const data = latest.get(ticker);
    if (data) renderPanel(i, data);
  });

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
