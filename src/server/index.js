const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
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

// In-memory alerts store (in production, use a proper database)
const alerts = new Map();
let alertIdCounter = 1;

// Email transporter setup
let emailTransporter = null;

// Initialize email transporter if credentials are provided
function initializeEmailTransporter() {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    emailTransporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    console.log('Email transporter initialized');
  } else {
    console.log('Email credentials not configured - alerts will be logged only');
  }
}

// Send alert email
async function sendAlertEmail(alert, reason, stockData = null) {
  if (!emailTransporter) {
    console.log(`ALERT (Email not configured): ${alert.name} - ${reason}`);
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: alert.email,
      subject: `🚨 Trendy Alert: ${alert.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f5f1e8, #e8dfd2); padding: 20px; border-radius: 10px;">
            <h1 style="color: #3d3028; margin: 0;">🌿 Trendy Alert</h1>
            <h2 style="color: #6b5d54; margin: 10px 0;">${alert.name}</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Stock:</strong> ${alert.symbol}</p>
              <p><strong>Condition Met:</strong> ${reason}</p>
              ${stockData ? `<p><strong>Current Price:</strong> $${stockData.price?.toFixed(2) || 'N/A'}</p>` : ''}
            </div>
            
            <div style="background: rgba(139, 119, 101, 0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0; font-size: 0.9em; color: #6b5d54;">
                This alert was triggered by your Trendy stock monitoring system. 
                Please do your own research before making any trading decisions.
              </p>
            </div>
            
            <p style="text-align: center; margin: 20px 0;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}" 
                 style="background: #d4a574; color: white; padding: 12px 25px; 
                        text-decoration: none; border-radius: 6px; font-weight: bold;">
                View in Trendy
              </a>
            </p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Alert email sent to ${alert.email} for ${alert.name}`);
    return true;
  } catch (error) {
    console.error('Failed to send alert email:', error);
    return false;
  }
}

// Initialize email on startup
initializeEmailTransporter();

// Alert monitoring system
async function checkAlerts() {
  const enabledAlerts = Array.from(alerts.values()).filter(alert => alert.enabled);
  
  if (enabledAlerts.length === 0) {
    return;
  }

  console.log(`Checking ${enabledAlerts.length} enabled alerts...`);

  for (const alert of enabledAlerts) {
    try {
      const shouldTrigger = await evaluateAlert(alert);
      
      if (shouldTrigger) {
        // Update alert record
        alert.lastTriggered = new Date().toISOString();
        alert.triggerCount += 1;
        alerts.set(alert.id, alert);

        // Send notification
        await sendAlertEmail(alert, shouldTrigger.reason, shouldTrigger.data);
        
        console.log(`Alert triggered: ${alert.name} for ${alert.symbol}`);
      }
    } catch (error) {
      console.error(`Error checking alert ${alert.name}:`, error);
    }
  }
}

// Evaluate if an alert should trigger
async function evaluateAlert(alert) {
  const { symbol, alertType, conditions } = alert;
  
  try {
    switch (alertType) {
      case 'streak':
        const streakAnalysis = await analyzer.analyzeStock(symbol, conditions.streakLength, 252);
        if (streakAnalysis.currentStreak >= conditions.streakLength && streakAnalysis.currentStreak > 0) {
          return {
            reason: `${symbol} has ${streakAnalysis.currentStreak} consecutive red days (trigger: ${conditions.streakLength})`,
            data: { 
              currentStreak: streakAnalysis.currentStreak,
              probability: streakAnalysis.probabilities[streakAnalysis.currentStreak]?.probability,
              price: streakAnalysis.currentPrice
            }
          };
        }
        break;

      case 'probability':
        const probAnalysis = await analyzer.analyzeStock(symbol, 3, 252); // Use standard 3-day streak for probability
        if (probAnalysis.currentStreak > 0) {
          const currentProb = probAnalysis.probabilities[probAnalysis.currentStreak]?.probability || 0;
          if (currentProb >= conditions.probability) {
            return {
              reason: `${symbol} bounce probability is ${currentProb.toFixed(1)}% (trigger: ≥${conditions.probability}%)`,
              data: {
                currentStreak: probAnalysis.currentStreak,
                probability: currentProb,
                price: probAnalysis.currentPrice
              }
            };
          }
        }
        break;

      case 'gain':
        const gainAnalysis = await analyzer.analyzeStock(symbol, 3, 252); // Use standard 3-day streak for gain
        if (gainAnalysis.currentStreak > 0) {
          const expectedGain = gainAnalysis.avgMovePercent?.positiveAvg || 0;
          if (expectedGain >= conditions.gainPercentage) {
            return {
              reason: `${symbol} expected gain is ${expectedGain.toFixed(1)}% (trigger: ≥${conditions.gainPercentage}%)`,
              data: {
                currentStreak: gainAnalysis.currentStreak,
                expectedGain: expectedGain,
                probability: gainAnalysis.probabilities[gainAnalysis.currentStreak]?.probability,
                price: gainAnalysis.currentPrice
              }
            };
          }
        }
        break;

      case 'price':
        // Get recent price data to check for price changes
        const priceData = await analyzer.getHistoricalData(symbol, 'compact');
        if (priceData && priceData.length >= 2) {
          const currentPrice = priceData[0].close;
          const previousPrice = priceData[1].close;
          const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
          
          if (conditions.priceChange > 0 && changePercent >= conditions.priceChange) {
            return {
              reason: `${symbol} price increased by ${changePercent.toFixed(2)}% (trigger: +${conditions.priceChange}%)`,
              data: { currentPrice, previousPrice, changePercent }
            };
          } else if (conditions.priceChange < 0 && changePercent <= conditions.priceChange) {
            return {
              reason: `${symbol} price decreased by ${Math.abs(changePercent).toFixed(2)}% (trigger: ${conditions.priceChange}%)`,
              data: { currentPrice, previousPrice, changePercent }
            };
          }
        }
        break;

      case 'volume':
        // Check for volume spike
        const volumeData = await analyzer.getHistoricalData(symbol, 'compact');
        if (volumeData && volumeData.length >= 20) {
          const currentVolume = volumeData[0].volume;
          const avgVolume = volumeData.slice(1, 20).reduce((sum, day) => sum + day.volume, 0) / 19;
          const volumeMultiplier = currentVolume / avgVolume;
          
          if (volumeMultiplier >= conditions.volumeMultiplier) {
            return {
              reason: `${symbol} volume is ${volumeMultiplier.toFixed(1)}x average (trigger: ${conditions.volumeMultiplier}x)`,
              data: { currentVolume, avgVolume, volumeMultiplier, price: volumeData[0].close }
            };
          }
        }
        break;

      case 'rsi':
        // Calculate RSI (simplified)
        const rsiData = await analyzer.getHistoricalData(symbol, 'compact');
        if (rsiData && rsiData.length >= 14) {
          const rsi = calculateRSI(rsiData.slice(0, 14));
          
          if (conditions.rsi.direction === 'below' && rsi <= conditions.rsi.level) {
            return {
              reason: `${symbol} RSI is ${rsi.toFixed(1)} (trigger: below ${conditions.rsi.level})`,
              data: { rsi, price: rsiData[0].close }
            };
          } else if (conditions.rsi.direction === 'above' && rsi >= conditions.rsi.level) {
            return {
              reason: `${symbol} RSI is ${rsi.toFixed(1)} (trigger: above ${conditions.rsi.level})`,
              data: { rsi, price: rsiData[0].close }
            };
          }
        }
        break;
    }
  } catch (error) {
    console.error(`Error evaluating alert for ${symbol}:`, error);
  }

  return false;
}

// Simple RSI calculation
function calculateRSI(data, period = 14) {
  if (data.length < period) return 50; // Default neutral RSI
  
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i-1].close - data[i].close;
    if (change > 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }
  
  const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / gains.length;
  const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / losses.length;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Start alert monitoring (check every 5 minutes)
const ALERT_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(checkAlerts, ALERT_CHECK_INTERVAL);

// Also check alerts on startup after a short delay
setTimeout(() => {
  console.log('Starting alert monitoring system...');
  checkAlerts();
}, 30000); // 30 second delay on startup

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

// Portfolio Backtest - test strategy on multiple stocks
app.post('/api/portfolio-backtest', async (req, res) => {
  const { symbols, streakLength = 3, lookbackDays = 252, holdDays = 1, initialCapital = 10000 } = req.body;
  
  if (!symbols || symbols.length === 0) {
    return res.status(400).json({ error: 'Please provide at least one stock symbol' });
  }
  
  try {
    const capitalPerStock = initialCapital / symbols.length;
    const portfolioResults = [];
    let totalFinalCapital = 0;
    let allTrades = [];
    
    // Run backtest for each stock
    for (const symbol of symbols) {
      try {
        const data = await analyzer.getHistoricalData(symbol, 'full');
        
        // Simple backtest: buy after X red days, sell after holdDays
        const trades = [];
        let capital = capitalPerStock;
        
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
              symbol,
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
        const stockReturn = ((capital - capitalPerStock) / capitalPerStock) * 100;
        
        portfolioResults.push({
          symbol,
          initialCapital: capitalPerStock,
          finalCapital: capital,
          totalReturn: stockReturn,
          totalTrades: trades.length,
          winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
          avgReturn: trades.length > 0 ? trades.reduce((sum, t) => sum + t.returnPct, 0) / trades.length : 0
        });
        
        totalFinalCapital += capital;
        allTrades = allTrades.concat(trades);
        
      } catch (error) {
        console.error(`Error backtesting ${symbol}:`, error);
        portfolioResults.push({
          symbol,
          error: error.message,
          initialCapital: capitalPerStock,
          finalCapital: capitalPerStock,
          totalReturn: 0
        });
        totalFinalCapital += capitalPerStock;
      }
    }
    
    // Sort trades by date
    allTrades.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
    
    // Calculate portfolio metrics
    const portfolioReturn = ((totalFinalCapital - initialCapital) / initialCapital) * 100;
    const successfulStocks = portfolioResults.filter(r => !r.error);
    
    res.json({
      portfolio: {
        symbols,
        initialCapital,
        finalCapital: totalFinalCapital,
        totalReturn: portfolioReturn,
        averageStockReturn: successfulStocks.length > 0 
          ? successfulStocks.reduce((sum, r) => sum + r.totalReturn, 0) / successfulStocks.length 
          : 0
      },
      settings: {
        streakLength,
        holdDays,
        lookbackDays
      },
      stockResults: portfolioResults,
      recentTrades: allTrades.slice(0, 30), // Show last 30 trades across all stocks
      summary: {
        totalTrades: allTrades.length,
        winningTrades: allTrades.filter(t => t.returnPct > 0).length,
        losingTrades: allTrades.filter(t => t.returnPct < 0).length,
        winRate: allTrades.length > 0 
          ? (allTrades.filter(t => t.returnPct > 0).length / allTrades.length) * 100 
          : 0
      }
    });
  } catch (error) {
    console.error('Error in portfolio backtest:', error);
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

// Alert Management Endpoints

// Get all alerts
app.get('/api/alerts', (req, res) => {
  const alertsList = Array.from(alerts.values()).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(alertsList);
});

// Create new alert
app.post('/api/alerts', (req, res) => {
  const { name, symbol, email, alertType, conditions, enabled = true } = req.body;
  
  // Validate required fields
  if (!name || !symbol || !email || !alertType) {
    return res.status(400).json({ 
      error: 'Name, symbol, email, and alertType are required' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate stock symbol exists
  const stockExists = SP500_STOCKS.some(stock => stock.symbol === symbol);
  if (!stockExists) {
    return res.status(400).json({ error: 'Invalid stock symbol' });
  }

  const alert = {
    id: alertIdCounter++,
    name,
    symbol,
    email,
    alertType,
    conditions,
    enabled,
    createdAt: new Date().toISOString(),
    lastTriggered: null,
    triggerCount: 0
  };

  alerts.set(alert.id, alert);
  res.status(201).json(alert);
});

// Update alert (enable/disable, modify conditions)
app.patch('/api/alerts/:id', (req, res) => {
  const alertId = parseInt(req.params.id);
  const alert = alerts.get(alertId);
  
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  // Update allowed fields
  const allowedUpdates = ['enabled', 'conditions', 'name'];
  const updates = {};
  
  for (const key of allowedUpdates) {
    if (req.body.hasOwnProperty(key)) {
      updates[key] = req.body[key];
    }
  }

  const updatedAlert = { ...alert, ...updates };
  alerts.set(alertId, updatedAlert);
  
  res.json(updatedAlert);
});

// Delete alert
app.delete('/api/alerts/:id', (req, res) => {
  const alertId = parseInt(req.params.id);
  
  if (!alerts.has(alertId)) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  alerts.delete(alertId);
  res.json({ message: 'Alert deleted successfully' });
});

// Test alert endpoint (for testing email functionality)
app.post('/api/alerts/:id/test', async (req, res) => {
  const alertId = parseInt(req.params.id);
  const alert = alerts.get(alertId);
  
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  try {
    const emailSent = await sendAlertEmail(alert, 'Test alert - this is a test message');
    
    res.json({ 
      message: emailSent ? 'Test email sent successfully' : 'Alert logged (email not configured)',
      email: alert.email,
      alertName: alert.name,
      emailConfigured: !!emailTransporter
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
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