// Copy this file to config.js and add your Finnhub API key.
// Get a free key at https://finnhub.io/ (takes ~30 seconds)

export const config = {
  finnhubApiKey: 'YOUR_API_KEY_HERE',

  // Tickers to cycle through. Add or remove as you like.
  tickers: ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL'],

  // How long to show each ticker before rotating (seconds)
  rotationSeconds: 8,

  // How often to fetch fresh data per ticker (seconds).
  // Free tier is 60 calls/min, so keep this reasonable.
  refreshSeconds: 30,

  // How many price points to keep for the sparkline
  historyLength: 60,
};
