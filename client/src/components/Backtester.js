import React, { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaPlay, FaChartBar, FaPercent, FaDollarSign, FaBriefcase } from 'react-icons/fa';
import './Backtester.css';

function Backtester({ apiUrl, stocks }) {
  const [mode, setMode] = useState('single'); // 'single' or 'portfolio'
  const [selectedStock, setSelectedStock] = useState('');
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [backtestSettings, setBacktestSettings] = useState({
    streakLength: 3,
    lookbackDays: 126,
    holdDays: 1,
    initialCapital: 10000
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runBacktest = async () => {
    if (mode === 'single' && !selectedStock) {
      alert('Please select a stock to backtest');
      return;
    }
    if (mode === 'portfolio' && selectedStocks.length === 0) {
      alert('Please select at least one stock for portfolio backtest');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'single') {
        const response = await axios.post(`${apiUrl}/backtest`, {
          symbol: selectedStock,
          ...backtestSettings
        });
        setResults({ mode: 'single', data: response.data });
      } else {
        const response = await axios.post(`${apiUrl}/portfolio-backtest`, {
          symbols: selectedStocks,
          ...backtestSettings
        });
        setResults({ mode: 'portfolio', data: response.data });
      }
    } catch (error) {
      console.error('Error running backtest:', error);
      alert('Error running backtest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStockSelection = (symbol) => {
    if (selectedStocks.includes(symbol)) {
      setSelectedStocks(selectedStocks.filter(s => s !== symbol));
    } else {
      setSelectedStocks([...selectedStocks, symbol]);
    }
  };

  const addPopularStocks = () => {
    const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'AMD'];
    setSelectedStocks([...new Set([...selectedStocks, ...popularSymbols])]);
  };

  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare chart data based on mode
  const chartData = results?.mode === 'single' 
    ? results.data?.trades?.map((trade, index) => ({
        trade: index + 1,
        return: trade.returnPct,
        capital: trade.capital
      })) || []
    : results?.data?.recentTrades?.map((trade, index) => ({
        trade: index + 1,
        return: trade.returnPct,
        symbol: trade.symbol
      })) || [];

  // Prepare pie chart data for portfolio
  const pieData = results?.mode === 'portfolio' 
    ? results.data?.stockResults?.map(stock => ({
        name: stock.symbol,
        value: stock.finalCapital,
        return: stock.totalReturn
      })) || []
    : [];

  const COLORS = ['#7a9a65', '#88a673', '#96b381', '#a4c08f', '#b2cd9d', '#c0daab', '#cee7b9'];

  return (
    <div className="backtester">
      <div className="backtester-header">
        <h2>STRATEGY BACKTESTER</h2>
        <p>Test the bounce-back strategy on historical data</p>
      </div>

      {/* Mode Selection */}
      <div className="mode-selector">
        <button 
          className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
          onClick={() => setMode('single')}
        >
          <FaChartBar /> Single Stock
        </button>
        <button 
          className={`mode-btn ${mode === 'portfolio' ? 'active' : ''}`}
          onClick={() => setMode('portfolio')}
        >
          <FaBriefcase /> Portfolio
        </button>
      </div>

      <div className="backtest-controls">
        {mode === 'single' ? (
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
        ) : (
          <div className="control-group portfolio-selector">
            <label>Select Stocks ({selectedStocks.length} selected):</label>
            <div className="stock-chips">
              {selectedStocks.map(symbol => (
                <span key={symbol} className="stock-chip">
                  {symbol}
                  <button onClick={() => toggleStockSelection(symbol)}>×</button>
                </span>
              ))}
            </div>
            <div className="stock-selector-buttons">
              <button 
                className="add-popular-btn"
                onClick={addPopularStocks}
              >
                Add Popular Tech Stocks
              </button>
              <select 
                value=""
                onChange={(e) => e.target.value && toggleStockSelection(e.target.value)}
              >
                <option value="">Add a stock...</option>
                {stocks
                  .filter(stock => !selectedStocks.includes(stock.symbol))
                  .map(stock => (
                    <option key={stock.symbol} value={stock.symbol}>
                      {stock.symbol} - {stock.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        <div className="control-group capital-slider">
          <label>
            Initial Capital: {formatCurrency(backtestSettings.initialCapital)}
          </label>
          <input 
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={backtestSettings.initialCapital}
            onChange={(e) => setBacktestSettings({...backtestSettings, initialCapital: parseInt(e.target.value)})}
            className="slider"
          />
          <div className="slider-labels">
            <span>$1k</span>
            <span>$25k</span>
            <span>$50k</span>
            <span>$75k</span>
            <span>$100k</span>
          </div>
        </div>

        <div className="control-group streak-slider">
          <label>
            Red Streak Length: {backtestSettings.streakLength} days
          </label>
          <input 
            type="range"
            min="1"
            max="10"
            value={backtestSettings.streakLength}
            onChange={(e) => setBacktestSettings({...backtestSettings, streakLength: parseInt(e.target.value)})}
            className="slider"
          />
          <div className="slider-labels">
            <span>1</span>
            <span>3</span>
            <span>5</span>
            <span>7</span>
            <span>10</span>
          </div>
        </div>

        <div className="control-group hold-slider">
          <label>
            Hold Days: {backtestSettings.holdDays} {backtestSettings.holdDays === 1 ? 'day' : 'days'}
          </label>
          <input 
            type="range"
            min="1"
            max="10"
            value={backtestSettings.holdDays}
            onChange={(e) => setBacktestSettings({...backtestSettings, holdDays: parseInt(e.target.value)})}
            className="slider"
          />
          <div className="slider-labels">
            <span>1</span>
            <span>3</span>
            <span>5</span>
            <span>7</span>
            <span>10</span>
          </div>
        </div>

        <div className="control-group lookback-slider">
          <label>
            Lookback Period: {backtestSettings.lookbackDays} days 
            {backtestSettings.lookbackDays <= 21 && ' (~1 month)'}
            {backtestSettings.lookbackDays > 21 && backtestSettings.lookbackDays <= 63 && ' (~3 months)'}
            {backtestSettings.lookbackDays > 63 && backtestSettings.lookbackDays <= 126 && ' (~6 months)'}
            {backtestSettings.lookbackDays > 126 && backtestSettings.lookbackDays <= 189 && ' (~9 months)'}
            {backtestSettings.lookbackDays > 189 && ' (~1 year)'}
          </label>
          <input 
            type="range"
            min="5"
            max="252"
            value={backtestSettings.lookbackDays}
            onChange={(e) => setBacktestSettings({...backtestSettings, lookbackDays: parseInt(e.target.value)})}
            className="slider"
          />
          <div className="slider-labels">
            <span>5d</span>
            <span>3mo</span>
            <span>6mo</span>
            <span>1yr</span>
          </div>
        </div>

        <button 
          className="run-backtest-button"
          onClick={runBacktest}
          disabled={loading}
        >
          <FaPlay /> {loading ? 'Running...' : 'Run Backtest'}
        </button>
      </div>

      {results && (
        <div className="backtest-results">
          <h3>BACKTEST RESULTS</h3>
          
          {results.mode === 'single' ? (
            // Single Stock Results
            <div className="results-summary">
              <div className="result-card">
                <div className="icon"><FaDollarSign /></div>
                <div className="result-content">
                  <span className="label">Final Capital</span>
                  <span className={`value ${results.data.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                    ${results.data.finalCapital?.toFixed(2) || '0'}
                  </span>
                  <span className="sublabel">Started with ${backtestSettings.initialCapital}</span>
                </div>
              </div>

              <div className="result-card">
                <div className="icon"><FaPercent /></div>
                <div className="result-content">
                  <span className="label">Total Return</span>
                  <span className={`value ${results.data.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                    {results.data.totalReturn >= 0 ? '+' : ''}{results.data.totalReturn?.toFixed(2) || '0'}%
                  </span>
                </div>
              </div>

              <div className="result-card">
                <div className="icon"><FaChartBar /></div>
                <div className="result-content">
                  <span className="label">Win Rate</span>
                  <span className="value">{results.data.winRate?.toFixed(1) || '0'}%</span>
                  <span className="sublabel">{results.data.totalTrades || 0} total trades</span>
                </div>
              </div>

              <div className="result-card">
                <div className="icon"><FaPercent /></div>
                <div className="result-content">
                  <span className="label">Avg Return/Trade</span>
                  <span className={`value ${results.data.avgReturn >= 0 ? 'positive' : 'negative'}`}>
                    {results.data.avgReturn >= 0 ? '+' : ''}{results.data.avgReturn?.toFixed(2) || '0'}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Portfolio Results
            <>
              <div className="results-summary">
                <div className="result-card">
                  <div className="icon"><FaBriefcase /></div>
                  <div className="result-content">
                    <span className="label">Portfolio Value</span>
                    <span className={`value ${results.data.portfolio.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                      ${results.data.portfolio.finalCapital?.toFixed(2) || '0'}
                    </span>
                    <span className="sublabel">Started with ${results.data.portfolio.initialCapital}</span>
                  </div>
                </div>

                <div className="result-card">
                  <div className="icon"><FaPercent /></div>
                  <div className="result-content">
                    <span className="label">Portfolio Return</span>
                    <span className={`value ${results.data.portfolio.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                      {results.data.portfolio.totalReturn >= 0 ? '+' : ''}{results.data.portfolio.totalReturn?.toFixed(2) || '0'}%
                    </span>
                  </div>
                </div>

                <div className="result-card">
                  <div className="icon"><FaChartBar /></div>
                  <div className="result-content">
                    <span className="label">Overall Win Rate</span>
                    <span className="value">{results.data.summary.winRate?.toFixed(1) || '0'}%</span>
                    <span className="sublabel">{results.data.summary.totalTrades || 0} total trades</span>
                  </div>
                </div>

                <div className="result-card">
                  <div className="icon"><FaPercent /></div>
                  <div className="result-content">
                    <span className="label">Avg Stock Return</span>
                    <span className={`value ${results.data.portfolio.averageStockReturn >= 0 ? 'positive' : 'negative'}`}>
                      {results.data.portfolio.averageStockReturn >= 0 ? '+' : ''}{results.data.portfolio.averageStockReturn?.toFixed(2) || '0'}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Portfolio Allocation Chart */}
              <div className="chart-section">
                <h4>Portfolio Allocation (Final Values)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, return: ret }) => `${name}: $${value.toFixed(0)} (${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Individual Stock Performance */}
              <div className="stock-performance-table">
                <h4>Individual Stock Performance</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Initial</th>
                      <th>Final</th>
                      <th>Return</th>
                      <th>Trades</th>
                      <th>Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.data.stockResults?.map(stock => (
                      <tr key={stock.symbol} className={stock.error ? 'error' : ''}>
                        <td>{stock.symbol}</td>
                        <td>${stock.initialCapital?.toFixed(0)}</td>
                        <td>${stock.finalCapital?.toFixed(0)}</td>
                        <td className={stock.totalReturn >= 0 ? 'positive' : 'negative'}>
                          {stock.totalReturn >= 0 ? '+' : ''}{stock.totalReturn?.toFixed(1)}%
                        </td>
                        <td>{stock.totalTrades || 0}</td>
                        <td>{stock.winRate?.toFixed(1) || 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Trade Chart */}
          {chartData.length > 0 && (
            <div className="chart-section">
              <h4>Trade Returns Over Time</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trade" />
                  <YAxis label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="return" stroke="#8b7765" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Trades Table */}
          <div className="trades-table">
            <h4>Recent Trades</h4>
            <table>
              <thead>
                <tr>
                  {results.mode === 'portfolio' && <th>Symbol</th>}
                  <th>Entry Date</th>
                  <th>Exit Date</th>
                  <th>Entry Price</th>
                  <th>Exit Price</th>
                  <th>Return %</th>
                </tr>
              </thead>
              <tbody>
                {(results.mode === 'single' ? results.data.trades : results.data.recentTrades)?.slice(0, 20).map((trade, idx) => (
                  <tr key={idx}>
                    {results.mode === 'portfolio' && <td>{trade.symbol}</td>}
                    <td>{trade.entryDate}</td>
                    <td>{trade.exitDate}</td>
                    <td>${trade.entryPrice?.toFixed(2)}</td>
                    <td>${trade.exitPrice?.toFixed(2)}</td>
                    <td className={trade.returnPct >= 0 ? 'positive' : 'negative'}>
                      {trade.returnPct >= 0 ? '+' : ''}{trade.returnPct?.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Backtester;