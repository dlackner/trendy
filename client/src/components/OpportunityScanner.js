import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './OpportunityScanner.css';

function OpportunityScanner({ apiUrl }) {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    minStreak: 2,
    maxStreak: 10,
    minProbability: 0,
    minAvgReturn: 0.1,
    maxAvgReturn: 100,
    sortBy: 'probability',
    sortOrder: 'desc',
    showOnlyPositiveReturns: false
  });

  // Fetch market scan data on component mount
  useEffect(() => {
    fetchMarketScan();
    // Set up polling to check for updates every 5 minutes
    const interval = setInterval(fetchMarketScan, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketScan = async () => {
    try {
      const response = await axios.get(`${apiUrl}/market-scan`);
      
      if (response.data.scanning) {
        // Initial scan in progress
        setLoading(true);
        setError(null);
        // Poll more frequently during initial scan
        setTimeout(fetchMarketScan, 30000); // Check again in 30 seconds
      } else if (response.data.results) {
        setMarketData(response.data);
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching market scan:', err);
      setError('Failed to fetch market data');
      setLoading(false);
    }
  };

  // Filter and sort the data
  const filteredData = useMemo(() => {
    if (!marketData || !marketData.results) return [];

    let filtered = marketData.results.filter(stock => {
      // Apply filters
      if (stock.currentStreak < filters.minStreak || stock.currentStreak > filters.maxStreak) return false;
      
      const probability = stock.probabilities[stock.currentStreak]?.probability || 0;
      if (probability < filters.minProbability) return false;
      
      const avgReturn = stock.avgMovePercent?.average || 0;
      if (avgReturn < filters.minAvgReturn || avgReturn > filters.maxAvgReturn) return false;
      
      if (filters.showOnlyPositiveReturns && avgReturn <= 0) return false;
      
      return true;
    });

    // Sort the results
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (filters.sortBy) {
        case 'symbol':
          aVal = a.symbol;
          bVal = b.symbol;
          break;
        case 'streak':
          aVal = a.currentStreak;
          bVal = b.currentStreak;
          break;
        case 'probability':
          aVal = a.probabilities[a.currentStreak]?.probability || 0;
          bVal = b.probabilities[b.currentStreak]?.probability || 0;
          break;
        case 'avgReturn':
          aVal = a.avgMovePercent?.average || 0;
          bVal = b.avgMovePercent?.average || 0;
          break;
        case 'posReturn':
          aVal = a.avgMovePercent?.positiveAvg || 0;
          bVal = b.avgMovePercent?.positiveAvg || 0;
          break;
        case 'price':
          aVal = a.currentPrice;
          bVal = b.currentPrice;
          break;
        case 'riskReward':
          aVal = a.metrics?.riskRewardRatio || 0;
          bVal = b.metrics?.riskRewardRatio || 0;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (filters.sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [marketData, filters]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const refreshScan = async () => {
    setLoading(true);
    // Clear cache and trigger new scan
    try {
      await axios.post(`${apiUrl}/clear-cache`);
      fetchMarketScan();
    } catch (err) {
      console.error('Error refreshing scan:', err);
    }
  };

  if (loading && !marketData) {
    return (
      <div className="opportunity-scanner">
        <div className="scanner-header">
          <h2>MARKET SCANNER</h2>
          <p>Analyzing all S&P 500 stocks for opportunities</p>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Scanning market... This may take several minutes on first load</p>
          <p className="loading-hint">The scan will be cached for faster access later</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="opportunity-scanner">
        <div className="scanner-header">
          <h2>MARKET SCANNER</h2>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchMarketScan} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="opportunity-scanner">
      <div className="scanner-header">
        <h2>MARKET SCANNER</h2>
        <p>Real-time S&P 500 opportunity detection</p>
      </div>

      <div className="scan-info">
        <div className="info-item">
          <span className="label">Total Stocks:</span>
          <span className="value">{marketData?.totalScanned || 0}</span>
        </div>
        <div className="info-item">
          <span className="label">Opportunities Found:</span>
          <span className="value">{filteredData.length}</span>
        </div>
        <div className="info-item">
          <span className="label">Last Updated:</span>
          <span className="value">
            {marketData?.cached ? `${marketData.cacheAge} ago` : 'Live'}
          </span>
        </div>
        {marketData?.updating && (
          <div className="info-item updating">
            <span className="label">Status:</span>
            <span className="value">Updating in background...</span>
          </div>
        )}
        <button onClick={refreshScan} className="refresh-button">
          Refresh Scan
        </button>
      </div>

      <div className="filters-container">
        <h3>FILTERS</h3>
        
        <div className="filter-row">
          <div className="filter-group">
            <label>Min Streak Days</label>
            <input
              type="number"
              min="0"
              max="10"
              value={filters.minStreak}
              onChange={(e) => handleFilterChange('minStreak', parseInt(e.target.value))}
            />
          </div>
          
          <div className="filter-group">
            <label>Max Streak Days</label>
            <input
              type="number"
              min="0"
              max="10"
              value={filters.maxStreak}
              onChange={(e) => handleFilterChange('maxStreak', parseInt(e.target.value))}
            />
          </div>
          
          <div className="filter-group">
            <label>Min Probability %</label>
            <input
              type="number"
              min="0"
              max="100"
              step="5"
              value={filters.minProbability}
              onChange={(e) => handleFilterChange('minProbability', parseFloat(e.target.value))}
            />
          </div>
          
          <div className="filter-group">
            <label>Min Avg Return %</label>
            <input
              type="number"
              step="0.1"
              value={filters.minAvgReturn}
              onChange={(e) => handleFilterChange('minAvgReturn', parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="probability">Bounce Probability</option>
              <option value="streak">Current Streak</option>
              <option value="avgReturn">Avg Return</option>
              <option value="posReturn">Positive Avg Return</option>
              <option value="riskReward">Risk/Reward Ratio</option>
              <option value="price">Stock Price</option>
              <option value="symbol">Symbol</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort Order</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
          
          <div className="filter-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={filters.showOnlyPositiveReturns}
                onChange={(e) => handleFilterChange('showOnlyPositiveReturns', e.target.checked)}
              />
              Positive Returns Only
            </label>
          </div>
        </div>
      </div>

      <div className="results-container">
        <div className="results-header">
          <h3>OPPORTUNITIES ({filteredData.length})</h3>
        </div>
        
        {filteredData.length === 0 ? (
          <div className="no-results">
            <p>No stocks match your filter criteria</p>
            <p className="hint">Try adjusting your filters to see more results</p>
          </div>
        ) : (
          <div className="opportunities-grid">
            {filteredData.slice(0, 50).map((stock) => (
              <div key={stock.symbol} className="opportunity-card">
                <div className="card-header">
                  <h4>{stock.symbol}</h4>
                  <span className={`price ${stock.currentStreak > 0 ? 'red' : 'neutral'}`}>
                    ${stock.currentPrice.toFixed(2)}
                  </span>
                </div>
                
                <div className="card-body">
                  <div className="metric-row">
                    <span className="metric-label">Streak:</span>
                    <span className={`metric-value streak-${stock.currentStreak >= 3 ? 'high' : stock.currentStreak >= 2 ? 'medium' : 'low'}`}>
                      {stock.currentStreak} days
                    </span>
                  </div>
                  
                  <div className="metric-row">
                    <span className="metric-label">Bounce Prob:</span>
                    <span className={`metric-value prob-${
                      stock.probabilities[stock.currentStreak]?.probability >= 70 ? 'high' : 
                      stock.probabilities[stock.currentStreak]?.probability >= 60 ? 'medium' : 'low'
                    }`}>
                      {stock.probabilities[stock.currentStreak]?.probability.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="metric-row">
                    <span className="metric-label">Avg Return:</span>
                    <span className={`metric-value ${stock.avgMovePercent?.average > 0 ? 'positive' : 'negative'}`}>
                      {stock.avgMovePercent?.average > 0 ? '+' : ''}{stock.avgMovePercent?.average.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="metric-row">
                    <span className="metric-label">Positive Avg:</span>
                    <span className="metric-value positive">
                      +{stock.avgMovePercent?.positiveAvg.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="metric-row">
                    <span className="metric-label">Samples:</span>
                    <span className="metric-value">
                      {stock.probabilities[stock.currentStreak]?.occurrences || 0}
                    </span>
                  </div>
                  
                  {stock.metrics?.riskRewardRatio && (
                    <div className="metric-row">
                      <span className="metric-label">Risk/Reward:</span>
                      <span className="metric-value">
                        {stock.metrics.riskRewardRatio.toFixed(2)}x
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {filteredData.length > 50 && (
          <div className="results-footer">
            <p>Showing top 50 of {filteredData.length} results</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OpportunityScanner;