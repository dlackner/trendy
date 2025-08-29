const alphavantage = require('alphavantage');
require('dotenv').config();

class StockAnalyzer {
  constructor() {
    this.alpha = alphavantage({ key: process.env.ALPHA_VANTAGE_API_KEY });
  }

  // Fetch historical daily data for a stock
  async getHistoricalData(symbol, outputSize = 'compact') {
    try {
      const data = await this.alpha.data.daily(symbol, outputSize);
      const timeSeries = data['Time Series (Daily)'];
      
      // Log the most recent date to verify freshness
      const dates = Object.keys(timeSeries);
      if (dates.length > 0) {
        const mostRecentDate = dates.sort((a, b) => new Date(b) - new Date(a))[0];
        console.log(`${symbol}: Most recent data from ${mostRecentDate}`);
      }
      
      return this.processTimeSeries(timeSeries);
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      throw error;
    }
  }

  // Process time series data into a more usable format
  processTimeSeries(timeSeries) {
    const dates = Object.keys(timeSeries).sort((a, b) => new Date(b) - new Date(a));
    return dates.map(date => ({
      date,
      open: parseFloat(timeSeries[date]['1. open']),
      high: parseFloat(timeSeries[date]['2. high']),
      low: parseFloat(timeSeries[date]['3. low']),
      close: parseFloat(timeSeries[date]['4. close']),
      volume: parseInt(timeSeries[date]['5. volume'])
    }));
  }

  // Detect current red streak (consecutive down days)
  getCurrentStreak(data) {
    let streak = 0;
    
    // Start from most recent day
    for (let i = 0; i < data.length - 1; i++) {
      const currentClose = data[i].close;
      const previousClose = data[i + 1].close;
      
      if (currentClose < previousClose) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Calculate probability of green day after X red days
  calculateBounceBackProbability(data, streakLength, lookbackDays = 252) {
    const limitedData = data.slice(0, Math.min(lookbackDays, data.length));
    
    let totalOccurrences = 0;
    let greenAfterStreak = 0;
    
    // Look for patterns in historical data
    for (let i = streakLength; i < limitedData.length - 1; i++) {
      let isStreak = true;
      
      // Check if we have a streak of red days
      for (let j = 0; j < streakLength; j++) {
        const dayIndex = i - j;
        const prevDayIndex = i - j + 1;
        
        if (dayIndex >= limitedData.length - 1) {
          isStreak = false;
          break;
        }
        
        const currentClose = limitedData[dayIndex].close;
        const previousClose = limitedData[prevDayIndex].close;
        
        if (currentClose >= previousClose) {
          isStreak = false;
          break;
        }
      }
      
      if (isStreak) {
        totalOccurrences++;
        
        // Check if next day was green
        const nextDayIndex = i - streakLength;
        if (nextDayIndex >= 0) {
          const nextClose = limitedData[nextDayIndex].close;
          const streakEndClose = limitedData[nextDayIndex + 1].close;
          
          if (nextClose > streakEndClose) {
            greenAfterStreak++;
          }
        }
      }
    }
    
    if (totalOccurrences === 0) return 0;
    
    return {
      probability: (greenAfterStreak / totalOccurrences) * 100,
      occurrences: totalOccurrences,
      successes: greenAfterStreak
    };
  }

  // Analyze a stock for bounce-back opportunities
  async analyzeStock(symbol, streakLength = 3, lookbackDays = 252) {
    try {
      const data = await this.getHistoricalData(symbol, 'full');
      const currentStreak = this.getCurrentStreak(data);
      
      // Calculate probabilities for different streak lengths
      const probabilities = {};
      for (let streak = 1; streak <= 5; streak++) {
        probabilities[streak] = this.calculateBounceBackProbability(data, streak, lookbackDays);
      }
      
      // Calculate average move percentage after streak
      const avgMoveAfterStreak = this.calculateAverageMoveAfterStreak(data, streakLength, lookbackDays);
      
      return {
        symbol,
        currentPrice: data[0].close,
        currentStreak,
        date: data[0].date,
        probabilities,
        avgMovePercent: avgMoveAfterStreak,
        recentData: data.slice(0, 20) // Last 20 days for visualization
      };
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
      throw error;
    }
  }

  // Calculate average percentage move after a streak
  calculateAverageMoveAfterStreak(data, streakLength, lookbackDays = 252) {
    const limitedData = data.slice(0, Math.min(lookbackDays, data.length));
    const moves = [];
    
    for (let i = streakLength; i < limitedData.length - 1; i++) {
      let isStreak = true;
      
      // Check if we have a streak of red days
      for (let j = 0; j < streakLength; j++) {
        const dayIndex = i - j;
        const prevDayIndex = i - j + 1;
        
        if (dayIndex >= limitedData.length - 1) {
          isStreak = false;
          break;
        }
        
        const currentClose = limitedData[dayIndex].close;
        const previousClose = limitedData[prevDayIndex].close;
        
        if (currentClose >= previousClose) {
          isStreak = false;
          break;
        }
      }
      
      if (isStreak) {
        const nextDayIndex = i - streakLength;
        if (nextDayIndex >= 0) {
          const nextClose = limitedData[nextDayIndex].close;
          const streakEndClose = limitedData[nextDayIndex + 1].close;
          const movePercent = ((nextClose - streakEndClose) / streakEndClose) * 100;
          moves.push(movePercent);
        }
      }
    }
    
    if (moves.length === 0) return 0;
    
    const avgMove = moves.reduce((a, b) => a + b, 0) / moves.length;
    const positiveMoves = moves.filter(m => m > 0);
    const negativeMoves = moves.filter(m => m < 0);
    
    return {
      average: avgMove,
      positiveAvg: positiveMoves.length > 0 ? positiveMoves.reduce((a, b) => a + b, 0) / positiveMoves.length : 0,
      negativeAvg: negativeMoves.length > 0 ? negativeMoves.reduce((a, b) => a + b, 0) / negativeMoves.length : 0,
      samples: moves.length
    };
  }

  // Batch analyze multiple stocks
  async analyzeMultipleStocks(symbols, streakLength = 3) {
    const results = [];
    
    for (const symbol of symbols) {
      try {
        console.log(`Analyzing ${symbol}...`);
        const analysis = await this.analyzeStock(symbol, streakLength);
        results.push(analysis);
        
        // Rate limiting - Your plan allows 75 calls per minute
        await new Promise(resolve => setTimeout(resolve, 800)); // Wait 0.8 seconds between calls
      } catch (error) {
        console.error(`Failed to analyze ${symbol}:`, error);
      }
    }
    
    return results;
  }

  // Find best opportunities based on current streaks and probabilities
  findBestOpportunities(analyses, minStreak = 2, minProbability = 60) {
    return analyses
      .filter(stock => 
        stock.currentStreak >= minStreak &&
        stock.probabilities[stock.currentStreak] &&
        stock.probabilities[stock.currentStreak].probability >= minProbability
      )
      .sort((a, b) => {
        const probA = a.probabilities[a.currentStreak].probability;
        const probB = b.probabilities[b.currentStreak].probability;
        return probB - probA;
      });
  }
}

module.exports = StockAnalyzer;