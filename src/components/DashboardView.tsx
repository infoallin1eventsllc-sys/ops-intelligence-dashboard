/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  DollarSign, 
  Briefcase, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { Event, Client, MonthlyFinancial } from '../types';
import { 
  calculateDashboardKPIs, 
  calculateMonthlyFinancials, 
  calculateEventTypeBreakdown, 
  formatCurrency, 
  formatPercent 
} from '../utils/calculations';

interface DashboardViewProps {
  events: Event[];
  clients: Client[];
  onNavigateToView: (view: 'revenue' | 'clients' | 'events') => void;
  addActivity?: (message: string, type?: 'success' | 'warning' | 'info') => void;
  setEvents?: React.Dispatch<React.SetStateAction<Event[]>>;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6'];

export default function DashboardView({ 
  events, 
  clients, 
  onNavigateToView, 
  addActivity, 
  setEvents 
}: DashboardViewProps) {
  // Pure calculations from utils
  const kpis = calculateDashboardKPIs(events, clients);
  const monthlyFinancials = calculateMonthlyFinancials(events);
  const typeBreakdown = calculateEventTypeBreakdown(events);
  
  // Recent 5 events by date desc
  const recentEvents = [...events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // AI Insights State
  const [insightState, setInsightState] = useState<'idle' | 'generating' | 'ready'>('idle');

  const handleGenerateInsights = () => {
    setInsightState('generating');
    setTimeout(() => {
      setInsightState('ready');
    }, 1200);
  };

  const handleQuickBook = (preset: 'summit' | 'gala' | 'dinner') => {
    let newEvent: Event;
    if (preset === 'summit') {
      newEvent = {
        id: `e-q-${Date.now()}`,
        name: 'Enterprise Tech Summit',
        type: 'Corporate',
        date: new Date().toISOString().split('T')[0],
        revenue: 65000,
        costs: 42000,
        profit: 23000,
        clientId: 'c1',
        vendorIds: ['v1', 'v4', 'v6'],
        status: 'Upcoming',
        guestCount: 220,
        venue: 'The Grand Ballroom & Plaza'
      };
    } else if (preset === 'gala') {
      newEvent = {
        id: `e-q-${Date.now()}`,
        name: 'Annual Charity Spring Gala',
        type: 'Nonprofit',
        date: new Date().toISOString().split('T')[0],
        revenue: 24000,
        costs: 16500,
        profit: 7500,
        clientId: 'c3',
        vendorIds: ['v7', 'v5', 'v6'],
        status: 'Upcoming',
        guestCount: 150,
        venue: 'Modern Arts Pavilion'
      };
    } else {
      newEvent = {
        id: `e-q-${Date.now()}`,
        name: 'VIP Executive Partners Dinner',
        type: 'Private',
        date: new Date().toISOString().split('T')[0],
        revenue: 12000,
        costs: 7800,
        profit: 4200,
        clientId: 'c6',
        vendorIds: ['v10', 'v1'],
        status: 'Upcoming',
        guestCount: 45,
        venue: 'Skyline Penthouse Club'
      };
    }
    setEvents?.(prev => [newEvent, ...prev]);
    addActivity?.(`Quick-booked operational event: "${newEvent.name}" ($${(newEvent.revenue / 1000).toFixed(0)}k).`, 'success');
  };


  const mockInsights = [
    {
      type: 'success',
      title: 'Strong Q2 Profit Margin',
      desc: 'Average profit margins reached 37.2% across May-June events, driven by high-revenue Corporate retreats at The Grand Ballroom.'
    },
    {
      type: 'warning',
      title: 'Vendor Cost Overruns',
      desc: 'AV vendor "ProSonic AV Solutions" average cost variance is +8.5%, eroding expected margins on small and mid-size corporate events.'
    },
    {
      type: 'info',
      title: 'Client Segment Opportunity',
      desc: 'Enterprise accounts represent 74% of YTD revenue. Increasing repeat-booking incentives for Greenwood and Vanguard could secure Q3 pipelines.'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* High Density Sub-Header Context Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
        <span className="text-xs text-slate-500 font-medium">Real-time performance summary</span>
        <div className="text-[10px] text-slate-500 font-mono bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
          DATA PERIOD: JAN 1 - JUN 27, 2026
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-sans">Total Revenue YTD</span>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(kpis.totalRevenueYTD)}</p>
            <div className="flex items-center text-xs text-emerald-600 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+18.4% vs last half</span>
            </div>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
            <DollarSign className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-sans">Net Profit YTD</span>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(kpis.netProfitYTD)}</p>
            <div className="flex items-center text-xs text-emerald-600 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>36.1% average margin</span>
            </div>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
            <TrendingUp className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-sans">Active Clients</span>
            <p className="text-2xl font-bold text-slate-900">{kpis.activeClientsCount}</p>
            <div className="flex items-center text-xs text-slate-500">
              <span>Out of {clients.length} accounts total</span>
            </div>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
            <Users className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-sans">Avg Event Margin</span>
            <p className="text-2xl font-bold text-slate-900">{formatPercent(kpis.avgEventMargin)}</p>
            <div className="flex items-center text-xs text-emerald-600 font-medium">
              <span>Target: &gt;35.0%</span>
            </div>
          </div>
          <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
            <Briefcase className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Main Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column (Financials Chart and Area Chart) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue vs Costs Chart */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Monthly Revenue vs Costs</h3>
                <p className="text-xs text-gray-400">Comparing gross top line to event-specific vendor costs</p>
              </div>
              <button 
                id="dashboard-btn-to-revenue"
                onClick={() => onNavigateToView('revenue')} 
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                Profit Analysis <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </button>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={monthlyFinancials}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false} 
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <RechartsTooltip 
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costs" name="Costs" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profit Margin Area Chart */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Profit Margin Trend</h3>
                <p className="text-xs text-gray-400">Monthly percentage yield trend YTD</p>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyFinancials.map(m => ({ ...m, marginPercent: m.margin * 100 }))}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <RechartsTooltip 
                    formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Profit Margin']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="marginPercent" stroke="#10b981" fillOpacity={1} fill="url(#colorMargin)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (Donut and AI insights) */}
        <div className="space-y-6">
          {/* Event Type Donut Chart */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Revenue by Event Type</h3>
              <p className="text-xs text-gray-400 mb-4">Proportion of gross bookings per category</p>
            </div>
            <div className="h-52 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {typeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-xs text-gray-400 font-semibold uppercase">Total YTD</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(kpis.totalRevenueYTD)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mt-4">
              {typeBreakdown.map((item, idx) => (
                <div key={item.name} className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-gray-600 truncate">{item.name} ({item.count})</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Card (Stylized Deep Indigo matching High Density design template) */}
          <div className="bg-indigo-900 text-indigo-50 p-5 rounded-xl border border-indigo-950 shadow-md relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/15 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-200 shrink-0">
                <Sparkles className="h-4.5 w-4.5 text-indigo-200" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">AI Insights Panel</h3>
                <p className="text-[10px] text-indigo-300">Get smart recommendations based on Q1 data.</p>
              </div>
            </div>

            {insightState === 'idle' && (
              <div className="space-y-4">
                <p className="text-xs text-indigo-200 leading-relaxed italic opacity-85">
                  "Synthesize client risk indicators, vendor delays, and financial margins with instant pattern-matching insights."
                </p>
                <button
                  id="btn-generate-dashboard-insights"
                  onClick={handleGenerateInsights}
                  className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded font-semibold text-xs transition-colors uppercase tracking-widest cursor-pointer"
                >
                  Generate Insights
                </button>
              </div>
            )}

            {insightState === 'generating' && (
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <Loader2 className="h-5 w-5 text-indigo-300 animate-spin" />
                <span className="text-xs text-indigo-300 font-mono">Consulting operations databases...</span>
              </div>
            )}

            {insightState === 'ready' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {mockInsights.map((insight, idx) => (
                  <div key={idx} className="p-2.5 bg-indigo-850 border border-indigo-700/50 rounded-lg text-xs">
                    <div className="flex items-center space-x-1.5 font-bold mb-1">
                      {insight.type === 'success' && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      {insight.type === 'warning' && <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                      {insight.type === 'info' && <HelpCircle className="h-3.5 w-3.5 text-sky-300 shrink-0" />}
                      <span className="text-white font-bold">{insight.title}</span>
                    </div>
                    <p className="text-indigo-200/90 leading-normal">{insight.desc}</p>
                  </div>
                ))}
                <button
                  onClick={() => setInsightState('idle')}
                  className="w-full py-1 text-center text-[10px] font-semibold text-indigo-300 hover:text-white transition-colors"
                >
                  Clear & Regenerate
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Events Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Recent Corporate & Private Events</h3>
            <p className="text-xs text-gray-400">The most recently updated event schedules and financial reports</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick Book:</span>
            <button
              onClick={() => handleQuickBook('summit')}
              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200 transition-colors cursor-pointer"
            >
              + Corporate Summit
            </button>
            <button
              onClick={() => handleQuickBook('gala')}
              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded border border-purple-200 transition-colors cursor-pointer"
            >
              + Charity Gala
            </button>
            <button
              onClick={() => handleQuickBook('dinner')}
              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200 transition-colors cursor-pointer"
            >
              + VIP Dinner
            </button>
            <div className="h-4 w-px bg-slate-200 mx-1 hidden md:block" />
            <button 
              id="dashboard-btn-to-events"
              onClick={() => onNavigateToView('events')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              All Event Logistics <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="py-3.5 px-5">Event Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Revenue</th>
                <th className="py-3.5 px-4 text-right">Costs</th>
                <th className="py-3.5 px-4 text-right">Net Profit</th>
                <th className="py-3.5 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentEvents.map((e) => {
                const margin = e.revenue > 0 ? (e.profit / e.revenue) * 100 : 0;
                return (
                  <tr key={e.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-gray-900">{e.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        e.type === 'Corporate' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        e.type === 'Wedding' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                        e.type === 'Private' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-slate-50 text-slate-700 border border-slate-100'
                      }`}>
                        {e.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-mono">{e.date}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-800">{formatCurrency(e.revenue)}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-400">{formatCurrency(e.costs)}</td>
                    <td className={`py-3.5 px-4 text-right font-bold ${e.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(e.profit)}
                      <span className="block text-[9px] font-normal text-gray-400">{margin.toFixed(0)}% margin</span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        e.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        e.status === 'Upcoming' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                        'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
