// Fetches stock data from Finnhub. Falls back to simulated data if no API key.

import { config } from '../config.js';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

const isDemoMode = () =>
  !config.finnhubApiKey || config.finnhubApiKey === 'YOUR_API_KEY_HERE';

// Per-ticker price history buffer
const histories = new Map();

function pushHistory(ticker, price) {
  if (!histories.has(ticker)) histories.set(ticker, []);
  const h = histories.get(ticker);
  h.push(price);
  if (h.length > config.historyLength) h.shift();
}

export function getHistory(ticker) {
  return histories.get(ticker) || [];
}

// Demo mode: simulate a random walk per ticker so the UI is testable without a key
const demoState = new Map();

function demoTick(ticker) {
  if (!demoState.has(ticker)) {
    const seed = [...ticker].reduce((a, c) => a + c.charCodeAt(0), 0);
    const basePrice = 50 + (seed % 400);
    // Pre-seed history with a full random walk so the sparkline is visible immediately
    let p = basePrice;
    for (let i = 0; i < config.historyLength - 1; i++) {
      p = Math.max(0.01, p + (Math.random() - 0.5) * 0.006 * p);
      pushHistory(ticker, p);
    }
    demoState.set(ticker, { price: p, open: basePrice });
  }
  const s = demoState.get(ticker);
  // Random walk, ~0.3% std dev per tick
  const drift = (Math.random() - 0.5) * 0.006 * s.price;
  s.price = Math.max(0.01, s.price + drift);
  const pctChange = ((s.price - s.open) / s.open) * 100;
  return {
    price: s.price,
    pctChange,
  };
}

// Fetch 45 days of daily closes to pre-populate the sparkline on startup.
// /stock/candles is premium-only for stocks on Finnhub now, so this often fails —
// in that case we simulate a random walk that ends at the live quote price.
const historyPreloaded = new Set();

export async function preloadHistory(ticker) {
  if (isDemoMode() || historyPreloaded.has(ticker)) return;
  historyPreloaded.add(ticker);
  let candlesWorked = false;
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 45 * 86400;
    const url = `${FINNHUB_BASE}/stock/candles?symbol=${ticker}&resolution=D&from=${from}&to=${to}&token=${config.finnhubApiKey}`;
    const res = await fetch(url);
    const json = await res.json().catch(() => ({}));
    console.log(`[preloadHistory] ${ticker}: HTTP ${res.status}, status=${json.s}, points=${json.c?.length ?? 0}`);
    if (res.ok && json.s === 'ok' && json.c?.length) {
      for (const price of json.c) pushHistory(ticker, price);
      candlesWorked = true;
    }
  } catch (err) {
    console.warn(`[preloadHistory] ${ticker} fetch error:`, err);
  }
  if (!candlesWorked) seedFromLiveQuote(ticker);
}

// Wait for the first live quote, then back-fill a simulated walk that ends at it.
// This guarantees the sparkline shows variation even when historical data isn't available.
function seedFromLiveQuote(ticker) {
  const start = Date.now();
  const check = setInterval(() => {
    const h = histories.get(ticker);
    if (h && h.length >= 1) {
      clearInterval(check);
      const current = h[h.length - 1];
      const count = config.historyLength - h.length;
      // Build the walk backward from the current price so it visually lands on "now"
      const past = [];
      let p = current;
      for (let i = 0; i < count; i++) {
        p = Math.max(0.01, p / (1 + (Math.random() - 0.5) * 0.015));
        past.unshift(p);
      }
      h.unshift(...past);
      while (h.length > config.historyLength) h.shift();
      console.log(`[seedFromLiveQuote] ${ticker}: filled ${past.length} simulated points around $${current.toFixed(2)}`);
    } else if (Date.now() - start > 30000) {
      clearInterval(check);
    }
  }, 200);
}

const profiles = new Map();

export async function fetchProfile(ticker) {
  if (isDemoMode()) return null;
  if (profiles.has(ticker)) return profiles.get(ticker);
  try {
    const url = `${FINNHUB_BASE}/stock/profile2?symbol=${ticker}&token=${config.finnhubApiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const profile = { logo: json.logo || null, name: json.name || ticker, webUrl: json.weburl || null };
    profiles.set(ticker, profile);
    return profile;
  } catch (err) {
    console.error(`Profile fetch failed for ${ticker}:`, err);
    profiles.set(ticker, null);
    return null;
  }
}

export async function fetchTicker(ticker) {
  if (isDemoMode()) {
    const data = demoTick(ticker);
    pushHistory(ticker, data.price);
    return { ticker, ...data, demo: true };
  }

  try {
    const url = `${FINNHUB_BASE}/quote?symbol=${ticker}&token=${config.finnhubApiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    // Finnhub returns: c (current), d (change), dp (% change), o (open), h (high), l (low)
    const price = json.c;
    const pctChange = json.dp ?? 0;
    if (!price) throw new Error('No price returned');
    pushHistory(ticker, price);
    return { ticker, price, pctChange, demo: false };
  } catch (err) {
    console.error(`Failed to fetch ${ticker}:`, err);
    return null;
  }
}
