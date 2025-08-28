# 📈 Trendy - Stock Bounce Predictor

A stock picking tool that identifies S&P 500 stocks likely to bounce back after consecutive red days. Uses historical pattern analysis to calculate probabilities and includes backtesting capabilities.

## 🎯 Strategy

The tool implements a mean reversion strategy:
- Identifies stocks that have been down for X consecutive days
- Analyzes historical patterns to calculate the probability of a green day following a red streak
- Provides visual representations of probabilities and price movements
- Includes backtesting to validate the strategy on historical data

## 🚀 Features

### 1. **Opportunity Scanner**
- Scans multiple S&P 500 stocks for bounce-back opportunities
- Configurable parameters (streak length, minimum probability)
- Visual confidence meters for each opportunity

### 2. **Stock Analysis**
- Detailed analysis of individual stocks
- Probability calculations for different streak lengths
- Recent price movement charts
- Historical pattern statistics

### 3. **Backtester**
- Test the strategy on historical data
- Configurable parameters (streak length, hold days, lookback period)
- Performance metrics (win rate, average return, total return)
- Trade-by-trade visualization

## 📦 Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd trendy
```

2. Install server dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
cd ..
```

4. Your Alpha Vantage API key is already configured in the `.env` file.

## 🏃‍♂️ Running the Application

1. Start the backend server:
```bash
npm start
```
or for development with auto-reload:
```bash
npm run dev
```

2. In a new terminal, start the React frontend:
```bash
cd client
npm start
```

3. Open your browser and navigate to:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🎨 Usage

### Opportunity Scanner
1. Click the "Opportunity Scanner" tab
2. Configure your scan parameters:
   - Number of stocks to scan
   - Minimum streak length
   - Minimum probability threshold
3. Click "Run Quick Scan" to find opportunities
4. Review the results with probability scores and historical statistics

### Stock Analysis
1. Click the "Stock Analysis" tab
2. Select a stock from the list
3. View detailed analysis including:
   - Current streak status
   - Probability of bounce-back
   - Recent price movements
   - Historical pattern data

### Backtester
1. Click the "Backtester" tab
2. Select a stock and configure parameters:
   - Red streak length to trigger entry
   - Number of days to hold the position
   - Historical lookback period
3. Run the backtest to see performance metrics
4. Review win rate, average returns, and trade history

## 📊 API Endpoints

- `GET /api/stocks` - Get list of S&P 500 stocks
- `GET /api/analyze/:symbol` - Analyze a single stock
- `POST /api/analyze-batch` - Analyze multiple stocks
- `POST /api/opportunities` - Find best opportunities
- `GET /api/quick-scan` - Quick scan top stocks
- `POST /api/backtest` - Run backtest on a strategy
- `GET /api/health` - Check API health status

## ⚠️ Important Notes

- **API Rate Limits**: Alpha Vantage free tier allows 5 API calls per minute. The app includes rate limiting (12-second delay between calls) to respect this limit.
- **Data Caching**: Results are cached for 5 minutes to reduce API calls
- **Market Hours**: Data is updated after market close each trading day
- **Risk Disclaimer**: This tool is for educational purposes. Past performance doesn't guarantee future results. Always do your own research before trading.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Alpha Vantage API
- **Frontend**: React, Recharts, Axios
- **Styling**: CSS3 with gradient designs
- **Data Source**: Alpha Vantage (free tier)

## 📈 Trading Strategy

The bounce-back strategy works as follows:
1. Monitor stocks for consecutive red days (configurable streak length)
2. When a stock hits the target streak, calculate historical bounce probability
3. If probability exceeds threshold, consider entering a position
4. Exit after configured hold period (typically 1-3 days)

## 🔧 Configuration

You can modify the following in the code:
- Add more S&P 500 stocks in `src/data/sp500.js`
- Adjust cache duration in `src/server/index.js`
- Modify API rate limiting delay in `src/utils/stockAnalyzer.js`
- Customize probability thresholds and streak lengths

## 📝 Future Enhancements

Potential features to add:
- Real-time price updates
- Options chain analysis for call option pricing
- Email/SMS alerts for opportunities
- More technical indicators
- Portfolio tracking
- Machine learning predictions
- Export functionality for backtest results

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.