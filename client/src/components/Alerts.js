import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Alerts.css';

const Alerts = ({ apiUrl, stocks }) => {
  const [alerts, setAlerts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    symbol: '',
    email: '',
    alertType: 'streak',
    conditions: {
      streakLength: 3,
      priceChange: -5,
      volumeMultiplier: 2,
      rsi: { level: 30, direction: 'below' },
      probability: 70,
      gainPercentage: 5,
      combination: {
        conditions: [
          { type: 'streak', streakLength: 3 },
          { type: 'probability', probability: 70 }
        ]
      }
    },
    enabled: true
  });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${apiUrl}/alerts`);
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setStatusMessage('Failed to fetch alerts');
    }
  };

  const createAlert = async () => {
    if (!newAlert.name || !newAlert.symbol || !newAlert.email) {
      setStatusMessage('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/alerts`, newAlert);
      setAlerts([...alerts, response.data]);
      setNewAlert({
        name: '',
        symbol: '',
        email: '',
        alertType: 'streak',
        conditions: {
          streakLength: 3,
          priceChange: -5,
          volumeMultiplier: 2,
          rsi: { level: 30, direction: 'below' },
          probability: 70,
          gainPercentage: 5,
          combination: {
            conditions: [
              { type: 'streak', streakLength: 3 },
              { type: 'probability', probability: 70 }
            ]
          }
        },
        enabled: true
      });
      setShowCreateForm(false);
      setStatusMessage('Alert created successfully!');
    } catch (error) {
      console.error('Error creating alert:', error);
      setStatusMessage('Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await axios.delete(`${apiUrl}/alerts/${alertId}`);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      setStatusMessage('Alert deleted successfully');
    } catch (error) {
      console.error('Error deleting alert:', error);
      setStatusMessage('Failed to delete alert');
    }
  };

  const toggleAlert = async (alertId) => {
    try {
      const alert = alerts.find(a => a.id === alertId);
      const response = await axios.patch(`${apiUrl}/alerts/${alertId}`, {
        enabled: !alert.enabled
      });
      setAlerts(alerts.map(a => a.id === alertId ? response.data : a));
      setStatusMessage(`Alert ${alert.enabled ? 'disabled' : 'enabled'}`);
    } catch (error) {
      console.error('Error toggling alert:', error);
      setStatusMessage('Failed to update alert');
    }
  };

  const renderConditionInputs = () => {
    switch (newAlert.alertType) {
      case 'streak':
        return (
          <div className="condition-input">
            <label>Consecutive Red Days: {newAlert.conditions.streakLength}</label>
            <input
              type="range"
              value={newAlert.conditions.streakLength}
              onChange={(e) => setNewAlert({
                ...newAlert,
                conditions: { ...newAlert.conditions, streakLength: parseInt(e.target.value) }
              })}
              min="1"
              max="10"
              className="slider"
            />
          </div>
        );
      case 'price':
        return (
          <div className="condition-input">
            <label>Price Change: {newAlert.conditions.priceChange}%</label>
            <input
              type="range"
              value={newAlert.conditions.priceChange}
              onChange={(e) => setNewAlert({
                ...newAlert,
                conditions: { ...newAlert.conditions, priceChange: parseFloat(e.target.value) }
              })}
              min="-20"
              max="20"
              step="0.5"
              className="slider"
            />
          </div>
        );
      case 'volume':
        return (
          <div className="condition-input">
            <label>Volume Multiplier: {newAlert.conditions.volumeMultiplier}x</label>
            <input
              type="range"
              value={newAlert.conditions.volumeMultiplier}
              onChange={(e) => setNewAlert({
                ...newAlert,
                conditions: { ...newAlert.conditions, volumeMultiplier: parseFloat(e.target.value) }
              })}
              min="1"
              max="10"
              step="0.1"
              className="slider"
            />
          </div>
        );
      case 'rsi':
        return (
          <div className="condition-inputs">
            <div className="condition-input">
              <label>RSI Level: {newAlert.conditions.rsi.level}</label>
              <input
                type="range"
                value={newAlert.conditions.rsi.level}
                onChange={(e) => setNewAlert({
                  ...newAlert,
                  conditions: {
                    ...newAlert.conditions,
                    rsi: { ...newAlert.conditions.rsi, level: parseInt(e.target.value) }
                  }
                })}
                min="1"
                max="99"
                className="slider"
              />
            </div>
            <div className="condition-input">
              <label>Direction:</label>
              <select
                value={newAlert.conditions.rsi.direction}
                onChange={(e) => setNewAlert({
                  ...newAlert,
                  conditions: {
                    ...newAlert.conditions,
                    rsi: { ...newAlert.conditions.rsi, direction: e.target.value }
                  }
                })}
              >
                <option value="below">Below</option>
                <option value="above">Above</option>
              </select>
            </div>
          </div>
        );
      case 'probability':
        return (
          <div className="condition-input">
            <label>Minimum Probability: {newAlert.conditions.probability}%</label>
            <input
              type="range"
              value={newAlert.conditions.probability}
              onChange={(e) => setNewAlert({
                ...newAlert,
                conditions: { ...newAlert.conditions, probability: parseInt(e.target.value) }
              })}
              min="50"
              max="95"
              step="5"
              className="slider"
            />
            <div className="slider-help">Alert when bounce probability exceeds this threshold</div>
          </div>
        );
      case 'gain':
        return (
          <div className="condition-input">
            <label>Expected Gain: {newAlert.conditions.gainPercentage}%</label>
            <input
              type="range"
              value={newAlert.conditions.gainPercentage}
              onChange={(e) => setNewAlert({
                ...newAlert,
                conditions: { ...newAlert.conditions, gainPercentage: parseInt(e.target.value) }
              })}
              min="1"
              max="20"
              step="1"
              className="slider"
            />
            <div className="slider-help">Alert when expected average gain exceeds this percentage</div>
          </div>
        );
      case 'combination':
        return (
          <div className="combination-conditions">
            <div className="combination-header">
              <h4>Multiple Conditions (ALL must be met)</h4>
              <p>Create sophisticated alerts by combining multiple criteria</p>
            </div>
            
            {newAlert.conditions.combination.conditions.map((condition, index) => (
              <div key={index} className="combination-item">
                <div className="combination-controls">
                  <select
                    value={condition.type}
                    onChange={(e) => {
                      const updatedConditions = [...newAlert.conditions.combination.conditions];
                      updatedConditions[index] = { type: e.target.value, ...getDefaultConditionValues(e.target.value) };
                      setNewAlert({
                        ...newAlert,
                        conditions: {
                          ...newAlert.conditions,
                          combination: { conditions: updatedConditions }
                        }
                      });
                    }}
                  >
                    <option value="streak">Red Streak</option>
                    <option value="probability">High Probability</option>
                    <option value="gain">Expected Gain</option>
                    <option value="volume">Volume Spike</option>
                    <option value="rsi">RSI Level</option>
                  </select>
                  
                  <div className="condition-details">
                    {renderCombinationCondition(condition, index)}
                  </div>
                  
                  <button
                    type="button"
                    className="remove-condition-btn"
                    onClick={() => {
                      const updatedConditions = newAlert.conditions.combination.conditions.filter((_, i) => i !== index);
                      setNewAlert({
                        ...newAlert,
                        conditions: {
                          ...newAlert.conditions,
                          combination: { conditions: updatedConditions }
                        }
                      });
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              className="add-condition-btn"
              onClick={() => {
                const updatedConditions = [...newAlert.conditions.combination.conditions, { type: 'streak', streakLength: 3 }];
                setNewAlert({
                  ...newAlert,
                  conditions: {
                    ...newAlert.conditions,
                    combination: { conditions: updatedConditions }
                  }
                });
              }}
            >
              + Add Another Condition
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const getDefaultConditionValues = (type) => {
    switch (type) {
      case 'streak':
        return { streakLength: 3 };
      case 'probability':
        return { probability: 70 };
      case 'gain':
        return { gainPercentage: 5 };
      case 'volume':
        return { volumeMultiplier: 2 };
      case 'rsi':
        return { level: 30, direction: 'below' };
      default:
        return {};
    }
  };

  const renderCombinationCondition = (condition, index) => {
    const updateCondition = (updates) => {
      const updatedConditions = [...newAlert.conditions.combination.conditions];
      updatedConditions[index] = { ...updatedConditions[index], ...updates };
      setNewAlert({
        ...newAlert,
        conditions: {
          ...newAlert.conditions,
          combination: { conditions: updatedConditions }
        }
      });
    };

    switch (condition.type) {
      case 'streak':
        return (
          <div className="mini-condition">
            <label>Red Days: {condition.streakLength}</label>
            <input
              type="range"
              value={condition.streakLength}
              onChange={(e) => updateCondition({ streakLength: parseInt(e.target.value) })}
              min="1"
              max="10"
              className="mini-slider"
            />
          </div>
        );
      case 'probability':
        return (
          <div className="mini-condition">
            <label>Probability: {condition.probability}%</label>
            <input
              type="range"
              value={condition.probability}
              onChange={(e) => updateCondition({ probability: parseInt(e.target.value) })}
              min="50"
              max="95"
              step="5"
              className="mini-slider"
            />
          </div>
        );
      case 'gain':
        return (
          <div className="mini-condition">
            <label>Gain: {condition.gainPercentage}%</label>
            <input
              type="range"
              value={condition.gainPercentage}
              onChange={(e) => updateCondition({ gainPercentage: parseInt(e.target.value) })}
              min="1"
              max="20"
              className="mini-slider"
            />
          </div>
        );
      case 'volume':
        return (
          <div className="mini-condition">
            <label>Volume: {condition.volumeMultiplier}x</label>
            <input
              type="range"
              value={condition.volumeMultiplier}
              onChange={(e) => updateCondition({ volumeMultiplier: parseFloat(e.target.value) })}
              min="1"
              max="10"
              step="0.1"
              className="mini-slider"
            />
          </div>
        );
      case 'rsi':
        return (
          <div className="mini-condition">
            <label>RSI {condition.direction} {condition.level}</label>
            <input
              type="range"
              value={condition.level}
              onChange={(e) => updateCondition({ level: parseInt(e.target.value) })}
              min="1"
              max="99"
              className="mini-slider"
            />
            <select
              value={condition.direction}
              onChange={(e) => updateCondition({ direction: e.target.value })}
            >
              <option value="below">Below</option>
              <option value="above">Above</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  const formatAlertCondition = (alert) => {
    switch (alert.alertType) {
      case 'streak':
        return `${alert.conditions.streakLength} consecutive red days`;
      case 'price':
        return `Price ${alert.conditions.priceChange >= 0 ? 'up' : 'down'} ${Math.abs(alert.conditions.priceChange)}%`;
      case 'volume':
        return `Volume ${alert.conditions.volumeMultiplier}x average`;
      case 'rsi':
        return `RSI ${alert.conditions.rsi.direction} ${alert.conditions.rsi.level}`;
      case 'probability':
        return `Bounce probability ≥ ${alert.conditions.probability}%`;
      case 'gain':
        return `Expected gain ≥ ${alert.conditions.gainPercentage}%`;
      case 'combination':
        const conditionTexts = alert.conditions.combination.conditions.map(condition => {
          switch (condition.type) {
            case 'streak':
              return `${condition.streakLength} red days`;
            case 'probability':
              return `≥${condition.probability}% probability`;
            case 'gain':
              return `≥${condition.gainPercentage}% gain`;
            case 'volume':
              return `${condition.volumeMultiplier}x volume`;
            case 'rsi':
              return `RSI ${condition.direction} ${condition.level}`;
            default:
              return 'unknown';
          }
        });
        return `ALL: ${conditionTexts.join(' + ')}`;
      default:
        return 'Unknown condition';
    }
  };

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h2>Alerts</h2>
        <p className="alerts-description">
          Set up email notifications when stocks meet your criteria
        </p>
        <button 
          className="create-alert-btn"
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
        >
          + Create New Alert
        </button>
      </div>

      <div className="alert-explanations">
        <button 
          className="explanations-toggle"
          onClick={() => setShowExplanations(!showExplanations)}
        >
          {showExplanations ? 'Hide Guide' : 'What do these alerts mean?'}
        </button>
        
        {showExplanations && (
          <div className="explanations-content">
            <div className="explanation-grid">
              <div className="explanation-card">
                <h4>Red Streak (Bounce Setup)</h4>
                <p>Alerts when a stock has consecutive red (down) days. This is the classic "bounce" setup - stocks that have been beaten down and are statistically likely to recover.</p>
                <div className="explanation-example">Example: Alert after 3 consecutive red days on AAPL</div>
              </div>

              <div className="explanation-card">
                <h4>High Probability Bounce</h4>
                <p>Uses historical data to calculate the probability that a stock will go green after its current red streak. Only alerts when the probability exceeds your threshold.</p>
                <div className="explanation-example">Example: TSLA has 80% chance of bouncing after 2 red days</div>
              </div>

              <div className="explanation-card">
                <h4>High Expected Gain</h4>
                <p>Alerts when the historical average gain after a bounce exceeds your threshold. This finds stocks that not only bounce, but bounce with significant gains.</p>
                <div className="explanation-example">Example: NVDA averages 5.2% gains after red streaks</div>
              </div>

              <div className="explanation-card">
                <h4>Smart Combination (Multiple Conditions)</h4>
                <p>Combine multiple alert conditions that ALL must be met simultaneously. Create sophisticated alerts like "3 red days + 70% probability + 5% expected gain" for high-confidence setups.</p>
                <div className="explanation-example">Example: AAPL has 3 red days AND 80% bounce probability AND 6% expected gain</div>
              </div>

              <div className="explanation-card">
                <h4>Price Change</h4>
                <p>Simple price movement alerts. Get notified when a stock moves up or down by your specified percentage in a single day.</p>
                <div className="explanation-example">Example: Alert if MSFT drops more than 3% in one day</div>
              </div>

              <div className="explanation-card">
                <h4>Volume Spike</h4>
                <p>Alerts when trading volume is significantly higher than normal. Volume spikes often indicate news, institutional activity, or pending price movements.</p>
                <div className="explanation-example">Example: AMZN volume is 5x higher than usual</div>
              </div>

              <div className="explanation-card">
                <h4>RSI Level</h4>
                <p>Relative Strength Index alerts. RSI below 30 indicates oversold conditions (potential buying opportunity), while above 70 indicates overbought conditions.</p>
                <div className="explanation-example">Example: GOOGL RSI drops below 25 (heavily oversold)</div>
              </div>
            </div>
            
            <div className="strategy-note">
              <h4>Trading Strategy Tip</h4>
              <p>For the best bounce setups, try combining alerts: Create a "Red Streak" alert for 2-3 days, then add a "High Probability" alert (≥70%) for the same stock. This finds stocks that are both beaten down AND historically likely to recover.</p>
            </div>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className={`status-message ${statusMessage.includes('success') ? 'success' : 'error'}`}>
          {statusMessage}
        </div>
      )}

      {showCreateForm && (
        <div className="create-alert-form">
          <h3>Create New Alert</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Alert Name *</label>
              <input
                type="text"
                value={newAlert.name}
                onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                placeholder="e.g., AAPL Bounce Setup"
              />
            </div>
            
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={newAlert.email}
                onChange={(e) => setNewAlert({ ...newAlert, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Stock Symbol *</label>
              <select
                value={newAlert.symbol}
                onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value })}
              >
                <option value="">Select a stock</option>
                {stocks && stocks.length > 0 ? (
                  stocks.map(stock => (
                    <option key={stock.symbol} value={stock.symbol}>
                      {stock.symbol} - {stock.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Loading stocks...</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Alert Type</label>
              <select
                value={newAlert.alertType}
                onChange={(e) => setNewAlert({ ...newAlert, alertType: e.target.value })}
              >
                <option value="streak">Red Streak (Bounce Setup)</option>
                <option value="probability">High Probability Bounce</option>
                <option value="gain">High Expected Gain</option>
                <option value="combination">Smart Combination (Multiple Conditions)</option>
                <option value="price">Price Change</option>
                <option value="volume">Volume Spike</option>
                <option value="rsi">RSI Level</option>
              </select>
            </div>
          </div>

          <div className="conditions-section">
            <label>Condition:</label>
            {renderConditionInputs()}
          </div>

          <div className="form-actions">
            <button 
              className="cancel-btn"
              onClick={() => {
                setShowCreateForm(false);
                setStatusMessage('');
              }}
            >
              Cancel
            </button>
            <button 
              className="create-btn"
              onClick={createAlert}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </div>
      )}

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="no-alerts">
            <p>No alerts created yet</p>
            <p>Create your first alert to get notified when stocks meet your criteria</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`alert-card ${alert.enabled ? 'enabled' : 'disabled'}`}>
              <div className="alert-header">
                <h3>{alert.name}</h3>
                <div className="alert-controls">
                  <button
                    className={`toggle-btn ${alert.enabled ? 'enabled' : 'disabled'}`}
                    onClick={() => toggleAlert(alert.id)}
                  >
                    {alert.enabled ? 'ON' : 'OFF'}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteAlert(alert.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="alert-details">
                <p><strong>Stock:</strong> {alert.symbol}</p>
                <p><strong>Condition:</strong> {formatAlertCondition(alert)}</p>
                <p><strong>Email:</strong> {alert.email}</p>
                <p><strong>Created:</strong> {new Date(alert.createdAt).toLocaleDateString()}</p>
                {alert.lastTriggered && (
                  <p><strong>Last Triggered:</strong> {new Date(alert.lastTriggered).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;