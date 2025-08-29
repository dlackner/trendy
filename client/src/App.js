import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import StockList from './components/StockList';
import StockAnalysis from './components/StockAnalysis';
import OpportunityScanner from './components/OpportunityScanner';
import Backtester from './components/Backtester';
import Documentation from './components/Documentation';
import PixelZenGarden from './components/PixelZenGarden';

const API_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';

function App() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner');
  const [apiStatus, setApiStatus] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    // Load favorites from localStorage
    const saved = localStorage.getItem('trendyFavorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchStocks();
    checkApiStatus();
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('trendyFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const fetchStocks = async () => {
    try {
      const response = await axios.get(`${API_URL}/stocks`);
      setStocks(response.data);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  };

  const checkApiStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setApiStatus(response.data.apiKeySet);
    } catch (error) {
      console.error('API health check failed:', error);
    }
  };

  const analyzeStock = async (symbol) => {
    setLoading(true);
    setSelectedStock(symbol);
    try {
      const response = await axios.get(`${API_URL}/analyze/${symbol}`);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error analyzing stock:', error);
      alert('Error analyzing stock. Make sure you have set your Alpha Vantage API key in the .env file.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (symbol) => {
    setFavorites(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <PixelZenGarden className="app-logo" />
        <p className="logo-text">TRENDY</p>
        {!apiStatus && (
          <div className="api-warning">
            Alpha Vantage API key not configured. Add your key to the .env file.
          </div>
        )}
      </header>

      <div className="tabs">
        <button 
          className={activeTab === 'scanner' ? 'active' : ''}
          onClick={() => setActiveTab('scanner')}
        >
          SCANNER
        </button>
        <button 
          className={activeTab === 'analysis' ? 'active' : ''}
          onClick={() => setActiveTab('analysis')}
        >
          ANALYSIS
        </button>
        <button 
          className={activeTab === 'backtest' ? 'active' : ''}
          onClick={() => setActiveTab('backtest')}
        >
          BACKTEST
        </button>
        <button 
          className={activeTab === 'docs' ? 'active' : ''}
          onClick={() => setActiveTab('docs')}
        >
          DOCS
        </button>
      </div>

      <main className="main-content">
        {activeTab === 'scanner' && (
          <OpportunityScanner apiUrl={API_URL} stocks={stocks} />
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-section">
            <StockList 
              stocks={stocks} 
              onSelectStock={analyzeStock}
              selectedStock={selectedStock}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
            {loading && <div className="loading">Analyzing {selectedStock}...</div>}
            {analysis && !loading && (
              <StockAnalysis 
                data={analysis} 
                isFavorite={favorites.includes(analysis.symbol)}
                onToggleFavorite={() => toggleFavorite(analysis.symbol)}
              />
            )}
          </div>
        )}

        {activeTab === 'backtest' && (
          <Backtester apiUrl={API_URL} stocks={stocks} />
        )}

        {activeTab === 'docs' && (
          <Documentation />
        )}
      </main>
    </div>
  );
}

export default App;
