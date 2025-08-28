import React, { useState, useMemo } from 'react';
import './StockList.css';

function StockList({ stocks, onSelectStock, selectedStock }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStocks = useMemo(() => {
    if (!searchTerm) return stocks;
    const term = searchTerm.toLowerCase();
    return stocks.filter(stock => 
      stock.symbol.toLowerCase().includes(term) || 
      stock.name.toLowerCase().includes(term)
    );
  }, [stocks, searchTerm]);

  return (
    <div className="stock-list">
      <h3>Select a Stock to Analyze</h3>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by symbol or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="stock-search-input"
        />
        {searchTerm && (
          <button 
            className="clear-search"
            onClick={() => setSearchTerm('')}
          >
            Clear
          </button>
        )}
      </div>
      <div className="stock-count">
        Showing {filteredStocks.length} of {stocks.length} stocks
      </div>
      <div className="stock-grid">
        {filteredStocks.map((stock) => (
          <button
            key={stock.symbol}
            className={`stock-item ${selectedStock === stock.symbol ? 'selected' : ''}`}
            onClick={() => onSelectStock(stock.symbol)}
          >
            <span className="symbol">{stock.symbol}</span>
            <span className="name">{stock.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default StockList;