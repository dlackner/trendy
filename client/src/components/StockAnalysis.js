import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import './StockAnalysis.css';

function StockAnalysis({ data }) {
  const { symbol, currentPrice, currentStreak, date, probabilities, avgMovePercent, recentData } = data;

  // Prepare data for probability chart
  const probData = Object.entries(probabilities).map(([streak, prob]) => ({
    streak: `${streak} days`,
    probability: prob.probability || 0,
    occurrences: prob.occurrences || 0,
  }));

  // Prepare data for price chart
  const priceData = recentData.slice().reverse().map((day, index) => ({
    day: index + 1,
    price: day.close,
    date: day.date,
  }));

  // Color for bars based on probability
  const getBarColor = (probability) => {
    if (probability >= 70) return '#4ade80';
    if (probability >= 60) return '#fbbf24';
    if (probability >= 50) return '#fb923c';
    return '#f87171';
  };

  return (
    <div className="stock-analysis">
      <div className="analysis-header">
        <h2>{symbol} Analysis</h2>
        <div className="key-metrics">
          <div className="metric">
            <span className="label">Current Price:</span>
            <span className="value">${currentPrice.toFixed(2)}</span>
          </div>
          <div className="metric">
            <span className="label">Current Streak:</span>
            <span className={`value ${currentStreak > 0 ? 'red-streak' : 'no-streak'}`}>
              {currentStreak > 0 ? `${currentStreak} red days` : 'No streak'}
            </span>
          </div>
          <div className="metric">
            <span className="label">Last Update:</span>
            <span className="value">{date}</span>
          </div>
        </div>
      </div>

      {currentStreak > 0 && probabilities[currentStreak] && (
        <div className="opportunity-alert">
          <h3>🎯 Current Opportunity</h3>
          <p>
            After {currentStreak} red days, {symbol} has a{' '}
            <strong>{probabilities[currentStreak].probability.toFixed(1)}%</strong> chance of being green tomorrow
          </p>
          <p>
            Based on {probabilities[currentStreak].occurrences} historical occurrences,{' '}
            {probabilities[currentStreak].successes} resulted in green days
          </p>
          {avgMovePercent && (
            <p>
              Average move after {currentStreak} day streak:{' '}
              <span className={avgMovePercent.average > 0 ? 'positive' : 'negative'}>
                {avgMovePercent.average > 0 ? '+' : ''}{avgMovePercent.average.toFixed(2)}%
              </span>
            </p>
          )}
        </div>
      )}

      <div className="charts-container">
        <div className="chart">
          <h3>Bounce Probability by Streak Length</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={probData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="streak" />
              <YAxis label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="probability">
                {probData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.probability)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart">
          <h3>Recent Price Movement (Last 20 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" label={{ value: 'Days Ago', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                labelFormatter={(value) => `${value} days ago`}
                formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="probability-table">
        <h3>Historical Pattern Analysis</h3>
        <table>
          <thead>
            <tr>
              <th>Streak Length</th>
              <th>Probability</th>
              <th>Occurrences</th>
              <th>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(probabilities).map(([streak, prob]) => (
              <tr key={streak} className={currentStreak === parseInt(streak) ? 'current' : ''}>
                <td>{streak} days</td>
                <td>
                  <span className={`probability-badge ${prob.probability >= 60 ? 'high' : prob.probability >= 50 ? 'medium' : 'low'}`}>
                    {prob.probability ? prob.probability.toFixed(1) : 0}%
                  </span>
                </td>
                <td>{prob.occurrences || 0}</td>
                <td>{prob.successes || 0}/{prob.occurrences || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StockAnalysis;