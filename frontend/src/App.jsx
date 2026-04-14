import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, LayoutDashboard, Calculator, DollarSign, ShieldAlert, Sun, Moon, Brain, IndianRupee, AlertCircle, CheckCircle, ShieldCheck, Info, TrendingUp, Heart, History, User, ArrowUpRight } from 'lucide-react';
import './App.css';

// Lazy load the Dashboard component
const Dashboard = React.lazy(() => import('./Dashboard'));

const API_URL = "http://localhost:8000";

const COLORS = ['#4f46e5', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

function App() {
  const [activeTab, setActiveTab] = useState('prediction');
  const [dashboardData, setDashboardData] = useState(null);
  
  const [modelMetrics, setModelMetrics] = useState(null);
  const [modelMetricsRF, setModelMetricsRF] = useState(null);

  const [theme, setTheme] = useState('dark');
  const [currency, setCurrency] = useState('USD');
  
  // Form State
  const [formData, setFormData] = useState({
    age: '',
    sex: 'male',
    bmi: '',
    children: '',
    smoker: 'no',
    region: 'southwest',
    exercise_level: 'medium',
    policy_type: 'basic',
    medical_history: 'no',
    income_level: 'medium',
    alcohol_consumption: 'no'
  });
  
  const [prediction, setPrediction] = useState(null);
  const [predictionWarnings, setPredictionWarnings] = useState([]);
  const [predictionRF, setPredictionRF] = useState(null);
  const [predictionRFWarnings, setPredictionRFWarnings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Handle data fetching
  useEffect(() => {
    if (activeTab === 'dashboard' && !dashboardData) {
      fetchDashboardData();
    }
    if (activeTab === 'prediction' && !modelMetrics) {
      fetchModelMetrics();
    }
    if (activeTab === 'prediction-rf' && !modelMetricsRF) {
      fetchModelMetricsRF();
    }
  }, [activeTab]);

  const fetchModelMetrics = async () => {
    try {
      const resp = await axios.get(`${API_URL}/model-metrics`);
      setModelMetrics(resp.data);
    } catch (err) {
      console.error("Error fetching model metrics", err);
    }
  };

  const fetchModelMetricsRF = async () => {
    try {
      const resp = await axios.get(`${API_URL}/model-metrics-rf`);
      setModelMetricsRF(resp.data);
    } catch (err) {
      console.error("Error fetching RF metrics", err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const resp = await axios.get(`${API_URL}/dashboard-data`);
      setDashboardData(resp.data);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPredictionWarnings([]);
    try {
      console.log("Sending data:", formData);
      const resp = await axios.post(`${API_URL}/predict`, formData);
      setPrediction(resp.data.predicted_cost);
      setPredictionWarnings(resp.data.insights || []);
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message;
      console.error("Prediction error:", errorDetail);
      alert(`Prediction Error: ${JSON.stringify(errorDetail)}`);
      setPrediction(null);
      setPredictionWarnings([]);
    }
    setLoading(false);
  };

  const handlePredictRF = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPredictionRFWarnings([]);
    try {
      console.log("Sending data:", formData);
      const resp = await axios.post(`${API_URL}/predict-rf`, formData);
      setPredictionRF(resp.data);
      setPredictionRFWarnings(resp.data.insights || []);
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message;
      console.error("RF Prediction error:", errorDetail);
      alert(`Prediction Error: ${JSON.stringify(errorDetail)}`);
      setPredictionRF(null);
      setPredictionRFWarnings([]);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'USD' ? 'INR' : 'USD');
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '';
    const convertedValue = currency === 'INR' ? value * 83 : value;
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${convertedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Recharts custom config based on theme
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const axisColor = theme === 'dark' ? '#334155' : '#cbd5e1';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
  const tooltipColor = theme === 'dark' ? '#fff' : '#0f172a';

  const renderForm = (onSubmit, predictValue, warnings, isClassification = false) => (
    <div className="prediction-content">
      <div className="card form-card">
        <form onSubmit={onSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label>Age (18-65)</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} min="18" max="65" placeholder="e.g. 25" required />
            </div>
            <div className="input-group">
              <label>BMI (15-50)</label>
              <input type="number" step="0.1" name="bmi" value={formData.bmi} onChange={handleChange} min="15" max="50" placeholder="e.g. 24.5" required />
            </div>
            <div className="input-group">
              <label>Dependents (0-5)</label>
              <input type="number" name="children" value={formData.children} onChange={handleChange} min="0" max="5" placeholder="Total children" required />
            </div>
            
            <div className="input-group">
              <label>Biological Sex</label>
              <div className="radio-group">
                <label className={`radio-label ${formData.sex === 'male' ? 'selected' : ''}`}>
                  <input type="radio" name="sex" value="male" checked={formData.sex === 'male'} onChange={handleChange} />
                  Male
                </label>
                <label className={`radio-label ${formData.sex === 'female' ? 'selected' : ''}`}>
                  <input type="radio" name="sex" value="female" checked={formData.sex === 'female'} onChange={handleChange} />
                  Female
                </label>
              </div>
            </div>

            <div className="input-group">
              <label>Smoker Status</label>
              <div className="radio-group">
                <label className={`radio-label ${formData.smoker === 'no' ? 'selected' : ''}`}>
                  <input type="radio" name="smoker" value="no" checked={formData.smoker === 'no'} onChange={handleChange} />
                  Non-Smoker
                </label>
                <label className={`radio-label ${formData.smoker === 'yes' ? 'selected' : ''}`}>
                  <input type="radio" name="smoker" value="yes" checked={formData.smoker === 'yes'} onChange={handleChange} />
                  Smoker
                </label>
              </div>
            </div>

            <div className="input-group">
              <label>Geographic Region</label>
              <select name="region" value={formData.region} onChange={handleChange}>
                <option value="southwest">Southwest</option>
                <option value="southeast">Southeast</option>
                <option value="northwest">Northwest</option>
                <option value="northeast">Northeast</option>
              </select>
            </div>

            <div className="input-group">
              <label>Exercise Level</label>
              <select name="exercise_level" value={formData.exercise_level} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="input-group">
              <label>Policy Type</label>
              <select name="policy_type" value={formData.policy_type} onChange={handleChange}>
                <option value="basic">Basic</option>
                <option value="gold">Gold</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div className="input-group">
              <label>Income Level</label>
              <select name="income_level" value={formData.income_level} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="input-group">
              <label>Medical History</label>
              <div className="radio-group">
                <label className={`radio-label ${formData.medical_history === 'no' ? 'selected' : ''}`}>
                  <input type="radio" name="medical_history" value="no" checked={formData.medical_history === 'no'} onChange={handleChange} />
                  No
                </label>
                <label className={`radio-label ${formData.medical_history === 'yes' ? 'selected' : ''}`}>
                  <input type="radio" name="medical_history" value="yes" checked={formData.medical_history === 'yes'} onChange={handleChange} />
                  Yes
                </label>
              </div>
            </div>

            <div className="input-group">
              <label>Alcohol Consumption</label>
              <div className="radio-group">
                <label className={`radio-label ${formData.alcohol_consumption === 'no' ? 'selected' : ''}`}>
                  <input type="radio" name="alcohol_consumption" value="no" checked={formData.alcohol_consumption === 'no'} onChange={handleChange} />
                  No
                </label>
                <label className={`radio-label ${formData.alcohol_consumption === 'yes' ? 'selected' : ''}`}>
                  <input type="radio" name="alcohol_consumption" value="yes" checked={formData.alcohol_consumption === 'yes'} onChange={handleChange} />
                  Yes
                </label>
              </div>
            </div>
          </div>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? <span className="loader"></span> : isClassification ? 'Analyze Risk Category' : 'Calculate Estimate'}
          </button>
        </form>
      </div>

      <div className="result-container">
        {predictValue !== null ? (
          <div className="card result-card animate-slide-up">
            <div className="result-icon-wrapper">
              {isClassification ? (
                <Brain size={48} />
              ) : (
                currency === 'USD' ? <DollarSign size={48} /> : <IndianRupee size={48} />
              )}
            </div>
            <h3>{isClassification ? 'Predicted Cost Category' : 'Estimated Annual Cost'}</h3>
            <div className="price-display" style={isClassification ? { fontSize: '2.5rem' } : {}}>
              {isClassification ? predictValue.predicted_risk : formatCurrency(predictValue)}
            </div>
            {isClassification && (
              <div className="confidence-badge">
                {predictValue.confidence}% Confidence
              </div>
            )}
            <p className="result-subtext">{isClassification ? 'Categorized by ensemble classification.' : 'Based on local algorithm modeling.'}</p>
            {warnings && warnings.length > 0 && (
              <div className="insights-container">
                <h4>Actuarial Risk Assessment</h4>
                <div className="insights-list">
                  {warnings.map((insight, idx) => {
                    const IconName = {
                      AlertCircle, CheckCircle, ShieldAlert, ShieldCheck, Info, TrendingUp, Heart, Activity, History, User
                    }[insight.icon] || Info;
                    return (
                      <div key={idx} className={`insight-item ${insight.type}`}>
                        <div className="insight-icon">
                          <IconName size={16} />
                        </div>
                        <span>{insight.message}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card result-card empty-state">
            <ShieldAlert size={48} />
            <h3>Ready to Predict</h3>
            <p>Fill out the parameters and hit {isClassification ? 'analyze' : 'calculate'} to see the result here.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <Activity size={32} className="logo-icon" />
          <h1 className="logo-text">InsurMetric</h1>
        </div>
        
        <nav className="nav-menu">
          <button 
            className={`nav-button ${activeTab === 'prediction' ? 'active' : ''}`}
            onClick={() => setActiveTab('prediction')}
          >
            <Calculator size={20} />
            Insurance Cost Estimator
          </button>
          
          <button 
            className={`nav-button ${activeTab === 'prediction-rf' ? 'active' : ''}`}
            onClick={() => setActiveTab('prediction-rf')}
          >
            <Brain size={20} />
            Risk Category Predictor
          </button>

          <button 
            className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            Analytics Dashboard
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleCurrency}>
            {currency === 'USD' ? <><IndianRupee size={18}/> Switch to INR</> : <><DollarSign size={18}/> Switch to USD</>}
          </button>

          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <><Sun size={18}/> Light Mode</> : <><Moon size={18}/> Dark Mode</>}
          </button>
          
          <div className="status-indicator" style={{marginTop: '0.5rem'}}>
            <span className="dot pulse"></span>
            System Online
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'prediction' && (
          <div className="page prediction-page animate-fade-in">
            <header className="page-header">
              <h2>Linear Regression Baseline</h2>
              <p>Basic regression predicting insurance cost dynamically.</p>
            </header>

            {renderForm(handlePredict, prediction, predictionWarnings)}

            {modelMetrics && (
              <div className="metrics-section animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h3 className="metrics-title">Linear Regression Diagnostics</h3>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <span className="metric-label">Testing Accuracy (R²)</span>
                    <span className="metric-value">{modelMetrics.test_r2}%</span>
                    <span className="metric-desc">Variance captured on Test Split</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Training Accuracy (R²)</span>
                    <span className="metric-value">{modelMetrics.train_r2}%</span>
                    <span className="metric-desc">Variance captured on Train Split</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Mean Absolute Error (MAE)</span>
                    <span className="metric-value">{formatCurrency(modelMetrics.test_mae)}</span>
                    <span className="metric-desc">Average raw error margin</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Root Mean Sq Error (RMSE)</span>
                    <span className="metric-value">{formatCurrency(modelMetrics.test_rmse)}</span>
                    <span className="metric-desc">Heavy-penalty standard deviation</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prediction-rf' && (
          <div className="page prediction-page animate-fade-in">
            <header className="page-header">
              <h2>Ensemble Random Forest Classifier</h2>
              <p>Predicting insurance cost categories (Low, Medium, High) through advanced non-linear deep ensemble logic.</p>
            </header>

            {renderForm(handlePredictRF, predictionRF, predictionRFWarnings, true)}

            {modelMetricsRF && (
              <>
                <div className="metrics-section animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <h3 className="metrics-title">Classifier Diagnostics</h3>
                  <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '2rem' }}>
                    <div className="metric-card">
                      <span className="metric-label">Model Accuracy</span>
                      <span className="metric-value">{modelMetricsRF.accuracy}%</span>
                      <span className="metric-desc">Correct categorization rate on test split</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">F1 Score (Weighted)</span>
                      <span className="metric-value">{modelMetricsRF.f1_score}%</span>
                      <span className="metric-desc">Balanced precision and recall performance</span>
                    </div>
                  </div>

                  {modelMetricsRF.feature_importances && (
                    <div className="dashboard-card xwide" style={{ minHeight: '400px' }}>
                      <h3>Feature Importance Profile</h3>
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart 
                            data={modelMetricsRF.feature_importances.slice(0, 10)} 
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} />
                            <XAxis type="number" hide />
                            <YAxis 
                              dataKey="feature" 
                              type="category" 
                              tick={{ fill: tickColor, fontSize: 12 }} 
                              axisLine={false}
                              width={90}
                            />
                            <Tooltip 
                              cursor={{fill: 'rgba(255,255,255,0.05)'}}
                              contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor}}
                              formatter={(value) => [`${value}%`, 'Importance']}
                            />
                            <Bar dataKey="importance" fill="#818cf8" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Suspense fallback={
            <div className="page dashboard-page animate-fade-in">
              <header className="page-header">
                <h2>Cost Driver Analytics Dashboard</h2>
                <p>Loading dashboard components...</p>
              </header>
              <div className="loading-state">
                <span className="loader" style={theme==='light'?{borderTopColor:'var(--accent-color)'}:{}}></span>
                <p>Loading Cost Driver Analytics...</p>
              </div>
            </div>
          }>
            <Dashboard
              dashboardData={dashboardData}
              theme={theme}
              currency={currency}
              formatCurrency={formatCurrency}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}

export default App;
