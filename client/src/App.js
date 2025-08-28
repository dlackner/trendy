import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import StockList from './components/StockList';
import StockAnalysis from './components/StockAnalysis';
import OpportunityScanner from './components/OpportunityScanner';
import Backtester from './components/Backtester';
import Documentation from './components/Documentation';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner');
  const [apiStatus, setApiStatus] = useState(false);

  useEffect(() => {
    fetchStocks();
    checkApiStatus();
  }, []);

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

  return (
    <div className="App">
      <header className="App-header">
        <img src="/trendy.png" alt="Trendy" className="app-logo" />
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
            />
            {loading && <div className="loading">Analyzing {selectedStock}...</div>}
            {analysis && !loading && <StockAnalysis data={analysis} />}
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
