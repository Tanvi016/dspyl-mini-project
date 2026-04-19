import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Activity, LayoutDashboard, Calculator, DollarSign, ShieldAlert, Sun, Moon, Brain, IndianRupee, TrendingUp, Info } from 'lucide-react';

const COLORS = ['#4f46e5', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

const Dashboard = ({ dashboardData, theme, currency, formatCurrency }) => {
  // Recharts custom config based on theme
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const axisColor = theme === 'dark' ? '#334155' : '#cbd5e1';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
  const tooltipColor = theme === 'dark' ? '#fff' : '#0f172a';
  const ageBucketData = useMemo(() => {
    const ageData = dashboardData?.age_scatter || [];
    if (!ageData.length) return [];

    const buckets = [
      { label: '18-25', min: 18, max: 25, total: 0, count: 0 },
      { label: '26-35', min: 26, max: 35, total: 0, count: 0 },
      { label: '36-45', min: 36, max: 45, total: 0, count: 0 },
      { label: '46-55', min: 46, max: 55, total: 0, count: 0 },
      { label: '56-65', min: 56, max: 65, total: 0, count: 0 },
    ];

    ageData.forEach((datum) => {
      const age = Number(datum.x);
      const charge = Number(datum.y);
      const bucket = buckets.find((b) => age >= b.min && age <= b.max);
      if (bucket) {
        bucket.total += charge;
        bucket.count += 1;
      }
    });

    return buckets
      .filter((bucket) => bucket.count > 0)
      .map((bucket) => ({
        range: bucket.label,
        avg_charge: bucket.count ? bucket.total / bucket.count : 0,
      }));
  }, [dashboardData]);
  const riskAnalyticsData = useMemo(() => {
    if (!dashboardData) return { smokers: [], nonSmokers: [], synergistic: [], importance: [] };

    const scatter = dashboardData.bmi_scatter || [];
    // Random sampling to max 1000 points to prevent browser lag while preserving distribution
    const sampledScatter = scatter.length > 1000 
      ? [...scatter].sort(() => 0.5 - Math.random()).slice(0, 1000) 
      : scatter;
      
    const smokers = sampledScatter.filter(d => d.group === 'yes');
    const nonSmokers = sampledScatter.filter(d => d.group === 'no');

    // 2. Synergistic Risk (Grouped data for obesity/smoking interaction)
    const combined = dashboardData.combined_risk || [];
    const categories = ['normal', 'overweight', 'obese'];
    const synergistic = categories.map(cat => {
      const smokerNode = combined.find(d => d.bmi_category === cat && d.smoker === 'yes');
      const nonSmokerNode = combined.find(d => d.bmi_category === cat && d.smoker === 'no');
      return {
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
        'Smoker': smokerNode?.avg_charge || 0,
        'Non-Smoker': nonSmokerNode?.avg_charge || 0
      };
    });

    // 3. Feature Importance (Sorted and labeled)
    const importance = [...(dashboardData.feature_importance || [])]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8);

    return { smokers, nonSmokers, synergistic, importance };
  }, [dashboardData]);

  if (!dashboardData) {
    return (
      <div className="page dashboard-page animate-fade-in">
        <header className="page-header">
          <h2>Cost Driver Analytics Dashboard</h2>
          <p>Key insights into insurance cost drivers from {dashboardData?.total_records?.toLocaleString()} records.</p>
        </header>
        <div className="loading-state">
          <span className="loader" style={theme==='light'?{borderTopColor:'var(--accent-color)'}:{}}></span>
          <p>Loading Cost Driver Analytics...</p>
        </div>
      </div>
    );
  }

  // Get current insight
  const topInsight = dashboardData.top_insights?.[0];
  const InsightIcon = {
    'TrendingUp': TrendingUp,
    'Activity': Activity,
    'ShieldAlert': ShieldAlert,
    'Brain': Brain
  }[topInsight?.icon] || Brain;

  return (
    <div className="page dashboard-page animate-fade-in">
      <header className="page-header">
        <h2>Cost Driver Analytics Dashboard</h2>
        <p>Key insights into insurance cost drivers from {dashboardData.total_records.toLocaleString()} records.</p>
      </header>

      {topInsight && (
        <div className="dashboard-section animate-slide-up">
          <div className="insight-banner">
            <div className="insight-banner-icon">
              <InsightIcon className="pulse-icon" size={24} />
            </div>
            <div className="insight-banner-content">
              <span className="insight-tag">Key Analytics Discovery</span>
              <p className="insight-text">{topInsight.text}</p>
            </div>
            <div className="insight-divider"></div>
            <div className="insight-stats">
              <div className="mini-stat">
                <span className="label">Confidence</span>
                <span className="value">High</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Dashboard overview</h3>
            <p className="section-description">High-level dataset insights and health metrics for the current insurance portfolio.</p>
          </div>
        </div>
        <div className="dashboard-summary">
          <div className="kpi-card">
            <span className="kpi-label">Dataset size</span>
            <span className="kpi-value">{dashboardData.total_records.toLocaleString()}</span>
            <span className="kpi-note">Total records available for analysis</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Average annual charge</span>
            <span className="kpi-value">{formatCurrency(dashboardData.average_charges)}</span>
            <span className="kpi-note">Typical yearly estimate across the dataset</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Current smoker ratio</span>
            <span className="kpi-value">{dashboardData.percent_smokers.toFixed(1)}%</span>
            <span className="kpi-note">Share of high-risk policyholders</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Average BMI</span>
            <span className="kpi-value">{dashboardData.average_bmi.toFixed(1)}</span>
            <span className="kpi-note">Population health indicator</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Risk and distribution analytics</h3>
            <p className="section-description">Follow the most important cost drivers by age, BMI, smoking status, and region.</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Row 1: Primary Model Insights */}
        <div className="dashboard-card xwide">
          <h3>Feature Importance Ranking (ML Drivers)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <BarChart layout="vertical" data={riskAnalyticsData.importance} margin={{top: 5, right: 30, left: 10, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} />
                <XAxis type="number" tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} hide />
                <YAxis dataKey="feature" type="category" tick={{fill: tickColor, fontSize: 12}} axisLine={{ stroke: axisColor}} width={150} />
                <Tooltip 
                  cursor={{fill: 'rgba(79, 70, 229, 0.05)'}}
                  contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(val) => [`${val.toFixed(2)}%`, 'Influence']}
                />
                <Bar dataKey="importance" fill="url(#colorImportance)" radius={[0, 4, 4, 0]}>
                  <defs>
                    <linearGradient id="colorImportance" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4f46e5"/>
                      <stop offset="100%" stopColor="#818cf8"/>
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card-insight">
            <Brain size={14} />
            <span><b>{riskAnalyticsData.importance[0]?.feature === 'age' ? 'Age' : 'Smoking'} is the top cost driver.</b> The model confirms that {riskAnalyticsData.importance[0]?.feature === 'age' ? 'age-related risk' : 'smoking status'} has the highest impact on predicted annual charges.</span>
          </div>
        </div>

        {/* Row 2: Cluster Visualizations */}
        <div className="dashboard-card xwide">
          <h3>BMI vs. Charges Risk Clusters</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={450}>
              <ScatterChart margin={{ top: 40, right: 20, bottom: 60, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="BMI" 
                  unit="" 
                  tick={{fill: tickColor}} 
                  axisLine={{ stroke: axisColor}} 
                  height={60}
                  label={{ value: 'Body Mass Index (BMI)', position: 'insideBottom', offset: 0, fill: tickColor, fontSize: 13 }} 
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Charges" 
                  tickFormatter={(val) => formatCurrency(val)} 
                  tick={{fill: tickColor}} 
                  axisLine={{ stroke: axisColor}} 
                  width={100} 
                  label={{ value: 'Avg Annual Charges', angle: -90, position: 'insideLeft', offset: 10, fill: tickColor, fontSize: 13 }} 
                />
                <ZAxis type="number" range={[15, 15]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(val, name) => [name === 'Charges' ? formatCurrency(val) : val, name]}
                />
                <Legend verticalAlign="top" height={50} iconType="circle" />
                <Scatter name="Smoker (High Risk)" data={riskAnalyticsData.smokers} fill="#ef4444" />
                <Scatter name="Non-Smoker (Standard Risk)" data={riskAnalyticsData.nonSmokers} fill="#06b6d4" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="card-insight">
            <Info size={14} />
            <span><b>Smokers cost much more as they get heavier.</b> While non-smokers' costs stay flat, smokers (red points) see costs skyrocket as BMI increases.</span>
          </div>
        </div>

        {/* Row 3: Age Multipier */}
        <div className="dashboard-card xwide">
          <h3>Avg Charges by Age Gap</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <AreaChart data={ageBucketData} margin={{top: 10, right: 30, left: 30, bottom: 10}}>
                <defs>
                  <linearGradient id="colorCharges" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.06}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="range" tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} />
                <YAxis
                  tick={{fill: tickColor}}
                  axisLine={{ stroke: axisColor}}
                  tickFormatter={(val) => formatCurrency(val)}
                  width={100}
                  domain={[dataMin => Math.max(0, dataMin - 500), dataMax => dataMax + 1500]}
                />
                <Tooltip
                  contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(val) => formatCurrency(val)}
                />
                <Area type="monotone" dataKey="avg_charge" stroke="#10b981" strokeWidth={3} fill="url(#colorCharges)" fillOpacity={1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {dashboardData.graph_insights?.age && (
            <div className="card-insight">
              <Info size={14} />
              <span>{dashboardData.graph_insights.age}</span>
            </div>
          )}
        </div>

        {/* Row 4: Synergistic Risk & BMI Cats */}
        <div className="dashboard-card wide">
          <h3>Synergistic Risk (Smoking x Obesity)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <BarChart data={riskAnalyticsData.synergistic} margin={{top: 20, right: 30, left: 30, bottom: 10}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="category" tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} />
                <YAxis tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} tickFormatter={(val) => formatCurrency(val)} width={100} />
                <Tooltip 
                  contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                  formatter={(val) => formatCurrency(val)}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Smoker" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Non-Smoker" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card-insight">
            <ShieldAlert size={14} />
            <span><b>The "Double Trouble" Effect:</b> Smoking combined with Obesity creates a massive jump in costs—far higher than either risk alone.</span>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>BMI Category Charges</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <BarChart data={dashboardData.bmi_category_charges} margin={{top: 10, right: 10, left: 30, bottom: 10}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="bmi_category" tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} />
                <YAxis tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} tickFormatter={(val) => formatCurrency(val)} width={100} />
                <Tooltip contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="avg_charge" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 5: Smoking & Region */}
        <div className="dashboard-card">
          <h3>Charges by Smoking Status</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <BarChart data={dashboardData.smoker_charges} margin={{top: 10, right: 10, left: 30, bottom: 10}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="smoker" tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} />
                <YAxis tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} tickFormatter={(val) => formatCurrency(val)} width={100} />
                <Tooltip contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="avg_charge" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {dashboardData.graph_insights?.smoking && (
            <div className="card-insight">
              <TrendingUp size={14} />
              <span>{dashboardData.graph_insights.smoking}</span>
            </div>
          )}
        </div>

        <div className="dashboard-card wide">
          <h3>Charges by Region</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <BarChart data={dashboardData.region_charges} margin={{top: 10, right: 10, left: 30, bottom: 10}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="region" tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} />
                <YAxis tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} tickFormatter={(val) => formatCurrency(val)} width={110} />
                <Tooltip contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="avg_charge" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {dashboardData.graph_insights?.region && (
            <div className="card-insight">
              <ShieldAlert size={14} />
              <span>{dashboardData.graph_insights.region}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;