import React from 'react';
import './Documentation.css';

function Documentation() {
  return (
    <div className="documentation">
      <div className="doc-header">
        <h1>TRENDY DOCUMENTATION</h1>
        <p>Mean Reversion Trading Strategy</p>
      </div>

      <div className="doc-content">
        <section className="doc-section">
          <h2>THE STRATEGY</h2>
          <div className="section-content">
            <p>
              Trendy identifies stocks that have experienced consecutive down days (red streaks) 
              and calculates the historical probability of a bounce-back the following day. 
              This is based on the mean reversion principle: stocks that deviate significantly 
              from their average tend to revert back.
            </p>
          </div>
        </section>

        <section className="doc-section">
          <h2>PROBABILITY CALCULATION</h2>
          <div className="section-content">
            <p>
              The bounce-back probability is calculated using historical pattern recognition:
            </p>
            <div className="formula-box">
              <div className="formula">
                <strong>Probability = </strong>
                <span>(Green Days After Streak / Total Streak Occurrences) × 100</span>
              </div>
            </div>
            <div className="calculation-steps">
              <h3>Calculation Process:</h3>
              <ol>
                <li>
                  <strong>Pattern Detection:</strong> Scan historical data for instances where 
                  the stock had X consecutive red days
                </li>
                <li>
                  <strong>Outcome Analysis:</strong> Check if the following day was green 
                  (close > previous close)
                </li>
                <li>
                  <strong>Statistical Compilation:</strong> Calculate the percentage of times 
                  a green day followed the streak
                </li>
                <li>
                  <strong>Sample Size Validation:</strong> Only consider patterns with sufficient 
                  historical occurrences for statistical significance
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section className="doc-section">
          <h2>DATA SOURCE</h2>
          <div className="section-content">
            <div className="data-source-info">
              <div className="source-item">
                <strong>Provider:</strong>
                <span>Alpha Vantage Financial APIs</span>
              </div>
              <div className="source-item">
                <strong>Data Type:</strong>
                <span>Daily adjusted OHLCV (Open, High, Low, Close, Volume)</span>
              </div>
              <div className="source-item">
                <strong>Coverage:</strong>
                <span>S&P 500 Index Components</span>
              </div>
              <div className="source-item">
                <strong>Update Frequency:</strong>
                <span>Real-time daily updates after market close</span>
              </div>
              <div className="source-item">
                <strong>API Tier:</strong>
                <span>Premium (75 calls/minute)</span>
              </div>
            </div>
          </div>
        </section>

        <section className="doc-section">
          <h2>TIME RANGE ANALYSIS</h2>
          <div className="section-content">
            <div className="time-range-grid">
              <div className="time-range-item">
                <h3>Default Lookback</h3>
                <p>252 Trading Days (1 Year)</p>
                <span className="description">
                  Standard analysis period for pattern recognition, balancing recency with 
                  statistical significance
                </span>
              </div>
              <div className="time-range-item">
                <h3>Extended Analysis</h3>
                <p>Full Historical Data</p>
                <span className="description">
                  Available for backtesting and long-term pattern validation, typically 
                  20+ years of data
                </span>
              </div>
              <div className="time-range-item">
                <h3>Recent Performance</h3>
                <p>20 Trading Days</p>
                <span className="description">
                  Displayed in charts for visual context of current market conditions 
                  and streak development
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="doc-section">
          <h2>KEY METRICS</h2>
          <div className="section-content">
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Current Streak</h3>
                <p>Number of consecutive days the stock has closed lower than the previous day</p>
              </div>
              <div className="metric-card">
                <h3>Bounce Probability</h3>
                <p>Historical likelihood of a green day following the current streak length</p>
              </div>
              <div className="metric-card">
                <h3>Average Move</h3>
                <p>Expected percentage change after a streak, both positive and negative scenarios</p>
              </div>
              <div className="metric-card">
                <h3>Sample Size</h3>
                <p>Number of historical occurrences used to calculate the probability</p>
              </div>
            </div>
          </div>
        </section>

        <section className="doc-section">
          <h2>BACKTESTING PARAMETERS</h2>
          <div className="section-content">
            <div className="backtest-params">
              <div className="param-item">
                <strong>Initial Capital:</strong>
                <span>$10,000</span>
              </div>
              <div className="param-item">
                <strong>Position Size:</strong>
                <span>Full capital reinvestment</span>
              </div>
              <div className="param-item">
                <strong>Hold Period:</strong>
                <span>1 trading day (configurable)</span>
              </div>
              <div className="param-item">
                <strong>Entry Trigger:</strong>
                <span>X consecutive red days detected</span>
              </div>
              <div className="param-item">
                <strong>Exit Trigger:</strong>
                <span>Close position after hold period</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Documentation;