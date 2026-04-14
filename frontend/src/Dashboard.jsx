import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
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
        <div className="dashboard-card xwide">
          <h3>Avg Charges by Age Gap</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <AreaChart data={ageBucketData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
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
                  width={90}
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

        <div className="dashboard-card">
          <h3>Charges Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <BarChart data={dashboardData.charges_distribution} margin={{top: 10, right: 15, left: 0, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" tick={{fill: tickColor, fontSize: 11}} axisLine={{ stroke: axisColor}} interval="preserveStartEnd" angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} />
                <Tooltip contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>BMI Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <LineChart data={dashboardData.bmi_distribution} margin={{top: 10, right: 15, left: 0, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" tick={{fill: tickColor, fontSize: 11}} axisLine={{ stroke: axisColor}} interval="preserveStartEnd" angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} />
                <Tooltip contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {dashboardData.graph_insights?.bmi && (
            <div className="card-insight">
              <Activity size={14} />
              <span>{dashboardData.graph_insights.bmi}</span>
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <h3>Charges by Smoking Status</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <BarChart data={dashboardData.smoker_charges} margin={{left: 10, right: 10}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="smoker" tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} />
                <YAxis tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} tickFormatter={(val) => formatCurrency(val)} width={60} />
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

        <div className="dashboard-card">
          <h3>Population by Gender</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <BarChart data={dashboardData.sex_count || []} margin={{left: 10, right: 10}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="sex" tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} />
                <YAxis tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} />
                <Tooltip contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Smoker Population Split</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <PieChart>
                <Pie 
                  data={dashboardData.smoker_count || []} 
                  dataKey="value" 
                  nameKey="smoker" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={4}
                >
                  {(dashboardData.smoker_count || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>BMI Category Charges</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <BarChart data={dashboardData.bmi_category_charges} margin={{left: 10, right: 10}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="bmi_category" tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} />
                <YAxis tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} tickFormatter={(val) => formatCurrency(val)} width={60} />
                <Tooltip contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="avg_charge" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card wide">
          <h3>Combined Risk Factors</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <BarChart data={dashboardData.combined_risk} margin={{left: 10, right: 10}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="group" tick={{fill: tickColor, fontSize: 11}} axisLine={{ stroke: axisColor}} interval="preserveStartEnd" angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} tickFormatter={(val) => formatCurrency(val)} width={70} />
                <Tooltip contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '8px', color: tooltipColor, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="avg_charge" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Charges by Region</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <BarChart data={dashboardData.region_charges} margin={{left: 10, right: 10}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="region" tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} />
                <YAxis tick={{fill: tickColor}} axisLine={{ stroke: axisColor}} tickFormatter={(val) => formatCurrency(val)} width={70} />
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