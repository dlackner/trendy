import React, { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaPlay, FaChartBar, FaPercent, FaDollarSign } from 'react-icons/fa';
import './Backtester.css';

function Backtester({ apiUrl, stocks }) {
  const [selectedStock, setSelectedStock] = useState('');
  const [backtestSettings, setBacktestSettings] = useState({
    streakLength: 3,
    lookbackDays: 252,
    holdDays: 1
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runBacktest = async () => {
    if (!selectedStock) {
      alert('Please select a stock to backtest');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/backtest`, {
        symbol: selectedStock,
        ...backtestSettings
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error running backtest:', error);
      alert('Error running backtest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data if results exist
  const chartData = results?.trades?.map((trade, index) => ({
    trade: index + 1,
    return: trade.returnPct,
    capital: trade.capital
  })) || [];

  return (
    <div className="backtester">
      <div className="backtester-header">
        <h2>STRATEGY BACKTESTER</h2>
        <p>Test the bounce-back strategy on historical data</p>
      </div>

      <div className="backtest-controls">
        <div className="control-group">
          <label>Stock Symbol:</label>
          <select 
            value={selectedStock} 
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            <option value="">Select a stock...</option>
            {stocks.map(stock => (
              <option key={stock.symbol} value={stock.symbol}>
                {stock.symbol} - {stock.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Red Streak Length:</label>
          <select 
            value={backtestSettings.streakLength} 
            onChange={(e) => setBacktestSettings({...backtestSettings, streakLength: parseInt(e.target.value)})}
          >
            <option value="2">2 days</option>
            <option value="3">3 days</option>
            <option value="4">4 days</option>
            <option value="5">5 days</option>
          </select>
        </div>

        <div className="control-group">
          <label>Hold Days:</label>
          <select 
            value={backtestSettings.holdDays} 
            onChange={(e) => setBacktestSettings({...backtestSettings, holdDays: parseInt(e.target.value)})}
          >
            <option value="1">1 day</option>
            <option value="2">2 days</option>
            <option value="3">3 days</option>
            <option value="5">5 days</option>
          </select>
        </div>

        <div className="control-group">
          <label>Lookback Period:</label>
          <select 
            value={backtestSettings.lookbackDays} 
            onChange={(e) => setBacktestSettings({...backtestSettings, lookbackDays: parseInt(e.target.value)})}
          >
            <option value="90">3 months</option>
            <option value="180">6 months</option>
            <option value="252">1 year</option>
            <option value="504">2 years</option>
          </select>
        </div>

        <button 
          className="run-backtest-button" 
          onClick={runBacktest} 
          disabled={loading || !selectedStock}
        >
          {loading ? 'Running...' : <>
            <FaPlay /> Run Backtest
          </>}
        </button>
      </div>

      {results && (
        <div className="backtest-results">
          <h3>Backtest Results for {results.symbol}</h3>
          
          <div className="results-summary">
            <div className="result-card">
              <FaChartBar className="icon" />
              <div className="result-content">
                <span className="label">Total Trades</span>
                <span className="value">{results.totalTrades}</span>
              </div>
            </div>

            <div className="result-card">
              <FaPercent className="icon" />
              <div className="result-content">
                <span className="label">Win Rate</span>
                <span className={`value ${results.winRate >= 50 ? 'positive' : 'negative'}`}>
                  {results.winRate.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="result-card">
              <FaPercent className="icon" />
              <div className="result-content">
                <span className="label">Avg Return</span>
                <span className={`value ${results.avgReturn > 0 ? 'positive' : 'negative'}`}>
                  {results.avgReturn > 0 ? '+' : ''}{results.avgReturn.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="result-card">
              <FaDollarSign className="icon" />
              <div className="result-content">
                <span className="label">Final Capital</span>
                <span className="value">${results.finalCapital.toFixed(2)}</span>
                <span className="sublabel">(Started with $10,000)</span>
              </div>
            </div>

            <div className="result-card">
              <FaPercent className="icon" />
              <div className="result-content">
                <span className="label">Total Return</span>
                <span className={`value ${results.totalReturn > 0 ? 'positive' : 'negative'}`}>
                  {results.totalReturn > 0 ? '+' : ''}{results.totalReturn.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="chart-section">
              <h4>Trade Performance Over Time</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trade" label={{ value: 'Trade #', position: 'insideBottom', offset: -5 }} />
                  <YAxis yAxisId="left" label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Capital ($)', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="return" stroke="#3b82f6" name="Trade Return %" />
                  <Line yAxisId="right" type="monotone" dataKey="capital" stroke="#10b981" name="Capital" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {results.trades && results.trades.length > 0 && (
            <div className="trades-table">
              <h4>Recent Trades (Last 20)</h4>
              <table>
                <thead>
                  <tr>
                    <th>Entry Date</th>
                    <th>Exit Date</th>
                    <th>Entry Price</th>
                    <th>Exit Price</th>
                    <th>Return</th>
                  </tr>
                </thead>
                <tbody>
                  {results.trades.map((trade, index) => (
                    <tr key={index}>
                      <td>{trade.entryDate}</td>
                      <td>{trade.exitDate}</td>
                      <td>${trade.entryPrice.toFixed(2)}</td>
                      <td>${trade.exitPrice.toFixed(2)}</td>
                      <td className={trade.returnPct > 0 ? 'positive' : 'negative'}>
                        {trade.returnPct > 0 ? '+' : ''}{trade.returnPct.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Backtester;