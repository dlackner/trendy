// Mock data for testing when API limits are reached
const generateMockData = (symbol) => {
  const basePrice = 100 + Math.random() * 400;
  const days = 100;
  const data = [];
  
  let currentPrice = basePrice;
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const change = (Math.random() - 0.48) * currentPrice * 0.03; // Slight downward bias
    currentPrice = Math.max(currentPrice + change, 10);
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: currentPrice + (Math.random() - 0.5) * 2,
      high: currentPrice + Math.random() * 3,
      low: currentPrice - Math.random() * 3,
      close: currentPrice,
      volume: Math.floor(10000000 + Math.random() * 50000000)
    });
  }
  
  return data;
};

const getMockAnalysis = (symbol) => {
  const data = generateMockData(symbol);
  const currentStreak = Math.floor(Math.random() * 4) + 1;
  
  return {
    symbol,
    currentPrice: data[0].close,
    currentStreak,
    date: data[0].date,
    probabilities: {
      1: { probability: 55 + Math.random() * 10, occurrences: 100 + Math.floor(Math.random() * 50), successes: 55 + Math.floor(Math.random() * 20) },
      2: { probability: 50 + Math.random() * 15, occurrences: 50 + Math.floor(Math.random() * 30), successes: 25 + Math.floor(Math.random() * 15) },
      3: { probability: 45 + Math.random() * 20, occurrences: 25 + Math.floor(Math.random() * 15), successes: 12 + Math.floor(Math.random() * 8) },
      4: { probability: 40 + Math.random() * 25, occurrences: 15 + Math.floor(Math.random() * 10), successes: 6 + Math.floor(Math.random() * 5) },
      5: { probability: 35 + Math.random() * 30, occurrences: 8 + Math.floor(Math.random() * 5), successes: 3 + Math.floor(Math.random() * 3) }
    },
    avgMovePercent: {
      average: (Math.random() - 0.3) * 2,
      positiveAvg: 1 + Math.random() * 3,
      negativeAvg: -(1 + Math.random() * 3),
      samples: 25 + Math.floor(Math.random() * 20)
    },
    recentData: data.slice(0, 20)
  };
};

module.exports = { getMockAnalysis };