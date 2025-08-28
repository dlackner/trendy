import React, { useState } from 'react';
import axios from 'axios';
import './OpportunityScanner.css';

function OpportunityScanner({ apiUrl, stocks }) {
  const [scanning, setScanning] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [showStockSelector, setShowStockSelector] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanSettings, setScanSettings] = useState({
    limit: 10,
    minStreak: 2,
    minProbability: 60
  });

  const toggleStockSelection = (symbol) => {
    setSelectedStocks(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const runQuickScan = async () => {
    setScanning(true);
    setScanProgress(0);
    try {
      // Use selected stocks if any, otherwise use top stocks based on limit
      const stocksToScan = selectedStocks.length > 0 
        ? selectedStocks 
        : stocks.slice(0, scanSettings.limit).map(s => s.symbol);
      
      const response = await axios.post(`${apiUrl}/opportunities`, {
        symbols: stocksToScan,
        minStreak: scanSettings.minStreak,
        minProbability: scanSettings.minProbability
      }, {
        timeout: 300000 // 5 minute timeout
      });
      setOpportunities(response.data.opportunities || []);
      setAllResults(response.data.allResults || []);
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Error running scan. ';
      if (error.response) {
        errorMessage += `Server error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`;
      } else if (error.request) {
        errorMessage += 'No response from server. Make sure the backend is running on port 3001.';
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
    } finally {
      setScanning(false);
    }
  };

  const runCustomScan = async () => {
    setScanning(true);
    try {
      const symbols = stocks.slice(0, scanSettings.limit).map(s => s.symbol);
      const response = await axios.post(`${apiUrl}/opportunities`, {
        symbols,
        minStreak: scanSettings.minStreak,
        minProbability: scanSettings.minProbability
      });
      setOpportunities(response.data.opportunities);
    } catch (error) {
      console.error('Error running custom scan:', error);
      alert('Error running scan. Please check your API key and try again.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="opportunity-scanner">
      <div className="scanner-header">
        <h2>OPPORTUNITY SCANNER</h2>
        <p>Identify high probability bounce-back setups</p>
      </div>

      <div className="scan-controls">
        <div className="control-group">
          <label>
            STOCKS TO SCAN: 
            <span className="value">
              {selectedStocks.length > 0 
                ? `${selectedStocks.length} SELECTED` 
                : `TOP ${scanSettings.limit}`}
            </span>
          </label>
          {selectedStocks.length === 0 && (
            <>
              <input 
                type="range"
                min="1"
                max="500"
                value={scanSettings.limit}
                onChange={(e) => setScanSettings({...scanSettings, limit: parseInt(e.target.value)})}
                className="slider"
              />
              <span className="scan-time-estimate">
                Est. time: {Math.ceil(scanSettings.limit * 0.8 / 60)} min {Math.round((scanSettings.limit * 0.8) % 60)} sec
              </span>
            </>
          )}
          <button 
            className="select-stocks-btn"
            onClick={() => setShowStockSelector(!showStockSelector)}
          >
            {showStockSelector ? 'HIDE SELECTOR' : 'SELECT SPECIFIC STOCKS'}
          </button>
        </div>

        <div className="control-group">
          <label>MINIMUM STREAK: <span className="value">{scanSettings.minStreak} DAYS</span></label>
          <input 
            type="range"
            min="0"
            max="10"
            value={scanSettings.minStreak}
            onChange={(e) => setScanSettings({...scanSettings, minStreak: parseInt(e.target.value)})}
            className="slider"
          />
        </div>

        <div className="control-group">
          <label>MINIMUM PROBABILITY: <span className="value">{scanSettings.minProbability}%</span></label>
          <input 
            type="range"
            min="0"
            max="100"
            value={scanSettings.minProbability}
            onChange={(e) => setScanSettings({...scanSettings, minProbability: parseInt(e.target.value)})}
            className="slider"
          />
        </div>

        <button 
          className="scan-button" 
          onClick={runQuickScan} 
          disabled={scanning}
        >
          {scanning ? 'SCANNING...' : 'RUN SCAN'}
        </button>
      </div>

      {showStockSelector && (
        <div className="stock-selector">
          <h3>SELECT STOCKS TO SCAN</h3>
          <p className="selector-info">
            {selectedStocks.length > 0 
              ? `${selectedStocks.length} stocks selected` 
              : 'Select specific stocks or use the slider for top stocks'}
          </p>
          <div className="stock-grid">
            {stocks.map((stock) => (
              <button
                key={stock.symbol}
                className={`stock-chip ${selectedStocks.includes(stock.symbol) ? 'selected' : ''}`}
                onClick={() => toggleStockSelection(stock.symbol)}
              >
                {stock.symbol}
              </button>
            ))}
          </div>
          {selectedStocks.length > 0 && (
            <button 
              className="clear-selection-btn"
              onClick={() => setSelectedStocks([])}
            >
              CLEAR SELECTION
            </button>
          )}
        </div>
      )}

      {scanning && (
        <div className="scanning-message">
          <div className="spinner"></div>
          <p>Analyzing stocks... This may take a moment due to API rate limits.</p>
          {scanSettings.limit > 75 && (
            <p className="scan-warning">Scanning {scanSettings.limit} stocks at 75 calls/minute will take approximately {Math.ceil(scanSettings.limit * 0.8 / 60)} minutes</p>
          )}
        </div>
      )}

      {opportunities.length > 0 && !scanning && (
        <div className="opportunities-list">
          <h3>FOUND {opportunities.length} OPPORTUNITIES</h3>
          <div className="opportunity-cards">
            {opportunities.map((opp) => (
              <div key={opp.symbol} className="opportunity-card">
                <div className="card-header">
                  <h4>{opp.symbol}</h4>
                  <span className={`streak-badge ${opp.currentStreak >= 3 ? 'high' : 'medium'}`}>
                    {opp.currentStreak} day streak
                  </span>
                </div>
                
                <div className="card-metrics">
                  <div className="metric">
                    <span className="label">Current Price:</span>
                    <span className="value">${opp.currentPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="metric">
                    <span className="label">Bounce Probability:</span>
                    <span className={`value probability ${
                      opp.probabilities[opp.currentStreak]?.probability >= 70 ? 'high' : 
                      opp.probabilities[opp.currentStreak]?.probability >= 60 ? 'medium' : 'low'
                    }`}>
                      {opp.probabilities[opp.currentStreak]?.probability.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="metric">
                    <span className="label">Historical Occurrences:</span>
                    <span className="value">
                      {opp.probabilities[opp.currentStreak]?.successes}/
                      {opp.probabilities[opp.currentStreak]?.occurrences}
                    </span>
                  </div>
                  
                  {opp.avgMovePercent && (
                    <div className="metric">
                      <span className="label">Avg Move:</span>
                      <span className={`value ${opp.avgMovePercent.average > 0 ? 'positive' : 'negative'}`}>
                        {opp.avgMovePercent.average > 0 ? '+' : ''}{opp.avgMovePercent.average.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="confidence-meter">
                  <div className="meter-label">Confidence</div>
                  <div className="meter-bar">
                    <div 
                      className="meter-fill"
                      style={{
                        width: `${opp.probabilities[opp.currentStreak]?.probability || 0}%`,
                        backgroundColor: opp.probabilities[opp.currentStreak]?.probability >= 70 ? '#2c3e50' : 
                                       opp.probabilities[opp.currentStreak]?.probability >= 60 ? '#34495e' : '#7f8c8d'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {opportunities.length === 0 && allResults.length > 0 && !scanning && (
        <div className="no-opportunities">
          <p>NO STOCKS CURRENTLY MEET YOUR CRITERIA</p>
          <p>Try adjusting the minimum streak or probability settings.</p>
        </div>
      )}
    </div>
  );
}

export default OpportunityScanner;