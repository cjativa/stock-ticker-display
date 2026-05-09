// Add your Finnhub API key here. Get a free key at https://finnhub.io/
// If left as 'YOUR_API_KEY_HERE', the app runs in demo mode with simulated prices.

export const config = {
  finnhubApiKey: 'd7vrenpr01qj3ct84ue0d7vrenpr01qj3ct84ueg',

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
