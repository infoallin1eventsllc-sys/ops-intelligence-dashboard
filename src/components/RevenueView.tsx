/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Percent, 
  ArrowUpDown,
  CalendarDays,
  Gem
} from 'lucide-react';
import { Event } from '../types';
import { 
  calculateProfitabilityKPIs, 
  calculateMonthlyFinancials, 
  calculateEventTypeBreakdown,
  getTopProfitableEvents,
  formatCurrency, 
  formatPercent 
} from '../utils/calculations';

interface RevenueViewProps {
  events: Event[];
  addActivity?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

export default function RevenueView({ events, addActivity }: RevenueViewProps) {
  // Pure calculations from utils
  const kpis = calculateProfitabilityKPIs(events);
  const monthlyFinancials = calculateMonthlyFinancials(events);
  const typeBreakdown = calculateEventTypeBreakdown(events);
  const initialTopEvents = getTopProfitableEvents(events, 5);

  // Sorting state for top profitable events
  const [topEvents, setTopEvents] = useState<Event[]>(initialTopEvents);
  const [sortField, setSortField] = useState<'profit' | 'revenue' | 'costs' | 'guestCount'>('profit');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Sliders for What-If simulator
  const [markup, setMarkup] = useState<number>(1.0);
  const [costOffset, setCostOffset] = useState<number>(0); // e.g. -10 for -10% costs
  const [extraVolume, setExtraVolume] = useState<number>(0);

  const handleSort = (field: 'profit' | 'revenue' | 'costs' | 'guestCount') => {
    const isAsc = sortField === field && sortDirection === 'asc';
    const direction = isAsc ? 'desc' : 'asc';
    
    setSortField(field);
    setSortDirection(direction);

    const sorted = [...topEvents].sort((a, b) => {
      const valA = a[field];
      const valB = b[field];
      return direction === 'asc' ? valA - valB : valB - valA;
    });
    setTopEvents(sorted);
  };

  // Stacked data preparing: stack costs and profit together to visualize revenue structure
  const stackedChartData = monthlyFinancials.map(m => ({
    month: m.month,
    costs: m.costs,
    profit: m.profit,
    revenue: m.revenue
  }));

  // WHAT-IF CALCULATIONS
  const baseRevenue = events.reduce((sum, e) => sum + e.revenue, 0);
  const baseCosts = events.reduce((sum, e) => sum + e.costs, 0);
  const avgRevenue = events.length > 0 ? baseRevenue / events.length : 30000;
  const avgCosts = events.length > 0 ? baseCosts / events.length : 18000;

  const simulatedRevenue = Math.round(baseRevenue * markup + (extraVolume * avgRevenue * markup));
  const simulatedCosts = Math.round(baseCosts * (1 + costOffset / 100) + (extraVolume * avgCosts * (1 + costOffset / 100)));
  const simulatedProfit = simulatedRevenue - simulatedCosts;
  const simulatedMargin = simulatedRevenue > 0 ? (simulatedProfit / simulatedRevenue) * 100 : 0;

  const handleApplySimulation = () => {
    addActivity?.(`Applied Simulated parameters: Markup ${markup}x, Cost Delta ${costOffset}%, Volume +${extraVolume} events. Predicted yield: $${(simulatedProfit / 1000).toFixed(0)}k Profit.`, 'success');
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* High Density Context Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
        <span className="text-xs text-slate-500 font-medium">Monthly cost and profit yield analysis</span>
        <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold">
          FINANCIAL CORE
        </span>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Best Month (Profit)</span>
            <p className="text-xl font-bold text-slate-900">{kpis.bestMonth.month}</p>
            <div className="flex items-center text-xs text-emerald-600 font-medium">
              <span>{formatCurrency(kpis.bestMonth.profit)} Net</span>
            </div>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
            <TrendingUp className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Worst Month (Profit)</span>
            <p className="text-xl font-bold text-slate-900">{kpis.worstMonth.month}</p>
            <div className="flex items-center text-xs text-rose-500 font-medium">
              <span>{formatCurrency(kpis.worstMonth.profit)} Net</span>
            </div>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-lg text-rose-500">
            <TrendingDown className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Profit / Event</span>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(kpis.avgProfitPerEvent)}</p>
            <div className="flex items-center text-xs text-slate-500">
              <span>Across all operations</span>
            </div>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
            <Award className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Margin %</span>
            <p className="text-xl font-bold text-slate-900">{formatPercent(kpis.totalMarginPercent)}</p>
            <div className="flex items-center text-xs text-emerald-600 font-medium">
              <span>Target achieved YTD</span>
            </div>
          </div>
          <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
            <Percent className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Interactive What-If Financial Simulator Deck */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Gem className="h-4 w-4 text-indigo-500" />
              Portfolio Margin & Profit Optimizer (What-If Simulator)
            </h3>
            <p className="text-xs text-slate-500">Slide controls below to preview financial results of corporate markup, volume growth, or supply negotiation.</p>
          </div>
          <button
            onClick={handleApplySimulation}
            className="mt-2 sm:mt-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow-sm hover:shadow transition-all cursor-pointer"
          >
            Audit Simulation Results
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Sliders Block */}
          <div className="lg:col-span-7 space-y-4">
            {/* Slider 1 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Corporate Pricing Markup:</span>
                <span className="font-mono text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-1.5 rounded">{markup.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.05"
                value={markup}
                onChange={(e) => setMarkup(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1.0x (Baseline)</span>
                <span>1.25x (Corporate Mark)</span>
                <span>1.5x (Premium Segment)</span>
              </div>
            </div>

            {/* Slider 2 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Vendor Cost Reduction (Negotiated SLAs):</span>
                <span className="font-mono text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-1.5 rounded">{costOffset}%</span>
              </div>
              <input
                type="range"
                min="-20"
                max="10"
                step="2"
                value={costOffset}
                onChange={(e) => setCostOffset(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>-20% (Aggressive SLAs)</span>
                <span>0% (Standard Rates)</span>
                <span>+10% (Supplier Price Hikes)</span>
              </div>
            </div>

            {/* Slider 3 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Target Volume Scaling (New Q3 pipeline):</span>
                <span className="font-mono text-sky-600 font-bold bg-sky-50 border border-sky-100 px-1.5 rounded">+{extraVolume} Events</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={extraVolume}
                onChange={(e) => setExtraVolume(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Current baseline</span>
                <span>+6 bookings</span>
                <span>+12 high-capacity contracts</span>
              </div>
            </div>
          </div>

          {/* Results Output Block */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Predicted Yield Projection</span>
              
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="text-[10px] text-slate-500 block">Projected Revenue</span>
                  <span className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(simulatedRevenue)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Projected Costs</span>
                  <span className="text-sm font-medium text-slate-400 font-mono">{formatCurrency(simulatedCosts)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Projected Profit</span>
                  <span className="text-sm font-extrabold text-indigo-600 font-mono">{formatCurrency(simulatedProfit)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Portfolio Margin</span>
                  <span className={`text-sm font-extrabold font-mono ${simulatedMargin >= 40 ? 'text-emerald-600' : simulatedMargin >= 30 ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {simulatedMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60">
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full transition-all duration-300 ${simulatedMargin >= 40 ? 'bg-emerald-500' : simulatedMargin >= 30 ? 'bg-indigo-500' : 'bg-slate-400'}`}
                  style={{ width: `${Math.min(100, Math.max(0, simulatedMargin))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-normal font-medium">
                {simulatedMargin >= 40 ? (
                  <span className="text-emerald-700">🔥 Optimal Alpha Yield! High pricing markups combined with efficient supply-chain routing creates maximum cash velocity.</span>
                ) : simulatedMargin >= 30 ? (
                  <span className="text-indigo-700">📊 Robust performance. Standard operating range matches Q3 targets. Retain contract buffers.</span>
                ) : (
                  <span className="text-slate-600">⚠️ Slim operational yield. High supplier costs are cutting into capital expansion potential. Swapping AV vendors advised.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Breakdown (Stacked Chart) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Monthly Revenue Components</h3>
            <p className="text-xs text-gray-400 mb-4">Vendor costs vs net profit stacked to form total gross revenue</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stackedChartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    formatCurrency(Number(value)), 
                    name === 'costs' ? 'Vendor Costs' : 'Net Profit'
                  ]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="costs" name="Costs" stackId="revenue_stack" fill="#cbd5e1" />
                <Bar dataKey="profit" name="Net Profit" stackId="revenue_stack" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Event Type Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Revenue by Event Type</h3>
            <p className="text-xs text-gray-400 mb-4">Gross booking sums aggregated by client categories</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={typeBreakdown}
                layout="vertical"
                margin={{ top: 10, right: 15, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Total Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="value" name="Revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Margin Trend Line Chart */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs lg:col-span-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Margin and Volume Over Time</h3>
            <p className="text-xs text-gray-400 mb-4">Correlation of active monthly event counts against realized net profit margins</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyFinancials.map(m => ({ ...m, marginPercent: m.margin * 100 }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val}%`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val} events`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar yAxisId="right" dataKey="eventCount" name="Event Count" fill="#e2e8f0" barSize={35} radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="marginPercent" name="Margin %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 5 Most Profitable Events Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Gem className="h-4 w-4 text-indigo-600" />
              <span>Top 5 Most Profitable Operations</span>
            </h3>
            <p className="text-xs text-gray-400">Analysis of the events that delivered the largest dollar-value profit margins</p>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">Ranked by Net Profit</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="py-3.5 px-5">Event</th>
                <th className="py-3.5 px-4">Venue</th>
                <th className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('guestCount')}>
                  <div className="flex items-center space-x-1">
                    <span>Guests</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('revenue')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>Revenue</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('costs')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>Costs</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-5 text-right cursor-pointer hover:bg-emerald-100/50 transition-colors text-emerald-800" onClick={() => handleSort('profit')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>Net Profit</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-5 text-right">Profit Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topEvents.map((e, index) => {
                const margin = e.revenue > 0 ? (e.profit / e.revenue) * 100 : 0;
                return (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-gray-900 flex items-center space-x-3">
                      <span className="w-5 h-5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                        {index + 1}
                      </span>
                      <span>{e.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">{e.venue}</td>
                    <td className="py-3.5 px-4 text-gray-500 font-mono">{e.guestCount}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-700">{formatCurrency(e.revenue)}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-400">{formatCurrency(e.costs)}</td>
                    <td className="py-3.5 px-5 text-right font-bold text-emerald-600">{formatCurrency(e.profit)}</td>
                    <td className="py-3.5 px-5 text-right font-semibold text-gray-900 font-mono">
                      <span className="px-2 py-1 bg-emerald-50 rounded text-emerald-700">
                        {formatPercent(margin)}
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
