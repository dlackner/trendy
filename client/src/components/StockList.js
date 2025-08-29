import React, { useState, useMemo } from 'react';
import './StockList.css';

function StockList({ stocks, onSelectStock, selectedStock, favorites = [], onToggleFavorite }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Separate favorites and regular stocks
  const { favoriteStocks, regularStocks } = useMemo(() => {
    const favs = [];
    const regular = [];
    
    stocks.forEach(stock => {
      if (favorites.includes(stock.symbol)) {
        favs.push(stock);
      } else {
        regular.push(stock);
      }
    });
    
    return { favoriteStocks: favs, regularStocks: regular };
  }, [stocks, favorites]);

  // Filter both favorites and regular stocks
  const filteredFavorites = useMemo(() => {
    if (!searchTerm) return favoriteStocks;
    const term = searchTerm.toLowerCase();
    return favoriteStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(term) || 
      stock.name.toLowerCase().includes(term)
    );
  }, [favoriteStocks, searchTerm]);

  const filteredRegular = useMemo(() => {
    if (!searchTerm) return regularStocks;
    const term = searchTerm.toLowerCase();
    return regularStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(term) || 
      stock.name.toLowerCase().includes(term)
    );
  }, [regularStocks, searchTerm]);

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
        Showing {filteredFavorites.length + filteredRegular.length} of {stocks.length} stocks
        {favorites.length > 0 && ` (${favorites.length} favorites)`}
      </div>
      
      {filteredFavorites.length > 0 && (
        <>
          <div className="section-header">
            <span className="star-icon">★</span>
            FAVORITES
          </div>
          <div className="stock-grid favorites-section">
            {filteredFavorites.map((stock) => (
              <div
                key={stock.symbol}
                className={`stock-item favorite ${selectedStock === stock.symbol ? 'selected' : ''}`}
              >
                <button
                  className="stock-button"
                  onClick={() => onSelectStock(stock.symbol)}
                >
                  <span className="symbol">{stock.symbol}</span>
                  <span className="name">{stock.name}</span>
                </button>
                <button
                  className="favorite-btn active"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(stock.symbol);
                  }}
                  title="Remove from favorites"
                >
                  ★
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      
      {filteredRegular.length > 0 && (
        <>
          {filteredFavorites.length > 0 && (
            <div className="section-header">ALL STOCKS</div>
          )}
          <div className="stock-grid">
            {filteredRegular.map((stock) => (
              <div
                key={stock.symbol}
                className={`stock-item ${selectedStock === stock.symbol ? 'selected' : ''}`}
              >
                <button
                  className="stock-button"
                  onClick={() => onSelectStock(stock.symbol)}
                >
                  <span className="symbol">{stock.symbol}</span>
                  <span className="name">{stock.name}</span>
                </button>
                <button
                  className="favorite-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(stock.symbol);
                  }}
                  title="Add to favorites"
                >
                  ☆
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      
      {filteredFavorites.length === 0 && filteredRegular.length === 0 && (
        <div className="no-results">No stocks found matching "{searchTerm}"</div>
      )}
    </div>
  );
}

export default StockList;