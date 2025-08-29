const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const StockAnalyzer = require('../utils/stockAnalyzer');
const { SP500_STOCKS } = require('../data/sp500Full');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
}

const analyzer = new StockAnalyzer();

// Cache for stock data to avoid hitting API limits
const cache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour - balance between freshness and API limits

// Separate cache for full market scan
const marketScanCache = {
  data: null,
  timestamp: null,
  DURATION: 4 * 60 * 60 * 1000 // 4 hours for full market scan
};

// Get list of S&P 500 stocks
app.get('/api/stocks', (req, res) => {
  res.json(SP500_STOCKS);
});

// Analyze a single stock
app.get('/api/analyze/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { streakLength = 3, lookbackDays = 252 } = req.query;
  
  try {
    // Check cache
    const cacheKey = `${symbol}-${streakLength}-${lookbackDays}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }
    
    // Analyze stock
    const analysis = await analyzer.analyzeStock(
      symbol, 
      parseInt(streakLength), 
      parseInt(lookbackDays)
    );
    
    // Cache result
    cache.set(cacheKey, {
      data: analysis,
      timestamp: Date.now()
    });
    
    res.json(analysis);
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze multiple stocks
app.post('/api/analyze-batch', async (req, res) => {
  const { symbols, streakLength = 3 } = req.body;
  
  if (!symbols || !Array.isArray(symbols)) {
    return res.status(400).json({ error: 'Symbols array required' });
  }
  
  try {
    const analyses = await analyzer.analyzeMultipleStocks(symbols, streakLength);
    res.json(analyses);
  } catch (error) {
    console.error('Error in batch analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find best opportunities
app.post('/api/opportunities', async (req, res) => {
  const { symbols, minStreak = 2, minProbability = 60, streakLength = 3 } = req.body;
  
  if (!symbols || !Array.isArray(symbols)) {
    return res.status(400).json({ error: 'Symbols array required' });
  }
  
  try {
    const analyses = await analyzer.analyzeMultipleStocks(symbols, streakLength);
    const opportunities = analyzer.findBestOpportunities(
      analyses, 
      minStreak, 
      minProbability
    );
    
    res.json({
      opportunities,
      allResults: analyses,
      totalAnalyzed: analyses.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error finding opportunities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Full market scan - analyze ALL S&P 500 stocks with caching
app.get('/api/market-scan', async (req, res) => {
  // Check if we have cached data that's still fresh
  if (marketScanCache.data && 
      marketScanCache.timestamp && 
      Date.now() - marketScanCache.timestamp < marketScanCache.DURATION) {
    return res.json({
      ...marketScanCache.data,
      cached: true,
      cacheAge: Math.floor((Date.now() - marketScanCache.timestamp) / 1000 / 60) + ' minutes'
    });
  }

  // If no cache or expired, return current cache (if exists) and trigger background update
  if (marketScanCache.data) {
    // Start background update
    updateMarketScan();
    
    return res.json({
      ...marketScanCache.data,
      cached: true,
      updating: true,
      cacheAge: Math.floor((Date.now() - marketScanCache.timestamp) / 1000 / 60) + ' minutes',
      message: 'Returning cached data while updating in background'
    });
  }

  // If no cache at all, start scan and return loading status
  updateMarketScan();
  res.json({
    scanning: true,
    message: 'Full market scan initiated. This will take several minutes.',
    estimatedTime: Math.ceil(SP500_STOCKS.length * 0.8 / 60) + ' minutes',
    totalStocks: SP500_STOCKS.length
  });
});

// Background function to update market scan
async function updateMarketScan() {
  try {
    console.log('Starting full market scan...');
    const startTime = Date.now();
    
    // Analyze all stocks
    const allStocks = SP500_STOCKS.map(s => s.symbol);
    const results = [];
    
    for (let i = 0; i < allStocks.length; i++) {
      const symbol = allStocks[i];
      try {
        console.log(`Scanning ${i + 1}/${allStocks.length}: ${symbol}`);
        const analysis = await analyzer.analyzeStock(symbol, 3, 252);
        
        // Calculate key metrics for filtering
        const currentStreakProb = analysis.probabilities[analysis.currentStreak]?.probability || 0;
        const avgReturn = analysis.avgMovePercent?.average || 0;
        const posAvgReturn = analysis.avgMovePercent?.positiveAvg || 0;
        
        results.push({
          ...analysis,
          metrics: {
            currentStreakProb,
            avgReturn,
            posAvgReturn,
            riskRewardRatio: posAvgReturn / Math.abs(analysis.avgMovePercent?.negativeAvg || 1)
          }
        });
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (error) {
        console.error(`Failed to analyze ${symbol}:`, error.message);
      }
    }
    
    // Update cache
    marketScanCache.data = {
      results,
      scanTime: Date.now() - startTime,
      totalScanned: results.length,
      timestamp: new Date().toISOString()
    };
    marketScanCache.timestamp = Date.now();
    
    console.log(`Market scan complete. Scanned ${results.length} stocks in ${Math.floor((Date.now() - startTime) / 1000 / 60)} minutes`);
  } catch (error) {
    console.error('Market scan failed:', error);
  }
}

// Quick scan - analyze top stocks for opportunities
app.get('/api/quick-scan', async (req, res) => {
  const { limit = 10 } = req.query;
  
  try {
    const topStocks = SP500_STOCKS.slice(0, parseInt(limit)).map(s => s.symbol);
    const analyses = await analyzer.analyzeMultipleStocks(topStocks, 3);
    const opportunities = analyzer.findBestOpportunities(analyses, 2, 60);
    
    res.json({
      opportunities,
      allResults: analyses,
      totalScanned: topStocks.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in quick scan:', error);
    res.status(500).json({ error: error.message });
  }
});

// Backtest a strategy
app.post('/api/backtest', async (req, res) => {
  const { symbol, streakLength = 3, lookbackDays = 252, holdDays = 1 } = req.body;
  
  try {
    const data = await analyzer.getHistoricalData(symbol, 'full');
    
    // Simple backtest: buy after X red days, sell after holdDays
    const trades = [];
    let capital = 10000; // Start with $10k
    
    for (let i = streakLength + holdDays; i < Math.min(lookbackDays, data.length); i++) {
      let hasStreak = true;
      
      // Check for red streak
      for (let j = 0; j < streakLength; j++) {
        if (data[i - j].close >= data[i - j + 1].close) {
          hasStreak = false;
          break;
        }
      }
      
      if (hasStreak) {
        const entryPrice = data[i - streakLength].close;
        const exitPrice = data[i - streakLength - holdDays].close;
        const returnPct = ((exitPrice - entryPrice) / entryPrice) * 100;
        
        capital *= (1 + returnPct / 100);
        
        trades.push({
          entryDate: data[i - streakLength].date,
          exitDate: data[i - streakLength - holdDays].date,
          entryPrice,
          exitPrice,
          returnPct,
          capital
        });
      }
    }
    
    const winningTrades = trades.filter(t => t.returnPct > 0);
    const losingTrades = trades.filter(t => t.returnPct < 0);
    
    res.json({
      symbol,
      streakLength,
      holdDays,
      totalTrades: trades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      avgReturn: trades.length > 0 ? trades.reduce((sum, t) => sum + t.returnPct, 0) / trades.length : 0,
      finalCapital: capital,
      totalReturn: ((capital - 10000) / 10000) * 100,
      trades: trades.slice(0, 20) // Show last 20 trades
    });
  } catch (error) {
    console.error('Error in backtest:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    apiKeySet: !!process.env.ALPHA_VANTAGE_API_KEY,
    timestamp: new Date().toISOString(),
    cacheSize: cache.size,
    cacheDuration: CACHE_DURATION / 1000 / 60 + ' minutes'
  });
});

// Clear cache endpoint (useful for getting fresh data)
app.post('/api/clear-cache', (req, res) => {
  const oldSize = cache.size;
  cache.clear();
  res.json({ 
    message: 'Cache cleared successfully',
    itemsCleared: oldSize,
    timestamp: new Date().toISOString()
  });
});

// Serve React app for any non-API routes in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../../client/build');
  const fs = require('fs');
  
  if (fs.existsSync(buildPath)) {
    app.get('*', (req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  } else {
    app.get('/', (req, res) => {
      res.json({ 
        message: 'Trendy API Server', 
        status: 'Build files not found. Please run: npm run build',
        endpoints: ['/api/stocks', '/api/analyze/:symbol', '/api/opportunities', '/api/backtest']
      });
    });
  }
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Key configured: ${!!process.env.ALPHA_VANTAGE_API_KEY}`);
});

module.exports = app;