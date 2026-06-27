/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Label
} from 'recharts';
import { 
  Truck, 
  AlertTriangle, 
  CheckCircle, 
  Award, 
  Activity, 
  Search, 
  Filter, 
  ArrowUpDown,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Vendor, VendorCategory } from '../types';
import { 
  calculateVendorKPIs, 
  formatCurrency, 
  formatPercent 
} from '../utils/calculations';

interface VendorViewProps {
  vendors: Vendor[];
  setVendors?: React.Dispatch<React.SetStateAction<Vendor[]>>;
  addActivity?: (message: string, type?: 'success' | 'warning' | 'info') => void;
  events?: Event[];
  setEvents?: React.Dispatch<React.SetStateAction<Event[]>>;
}

// Function to get reliability score color
const getReliabilityColor = (score: number): string => {
  if (score >= 80) return '#10b981'; // Green
  if (score >= 60) return '#f59e0b'; // Yellow
  return '#ef4444'; // Red
};

export default function VendorView({ vendors, setVendors, addActivity }: VendorViewProps) {
  const kpis = calculateVendorKPIs(vendors);

  const handleOptimizeVendorContract = (vendorId: string, name: string) => {
    setVendors?.(prev => prev.map(v => {
      if (v.id === vendorId) {
        return {
          ...v,
          flagged: false,
          reliabilityScore: 90,
          onTimeRate: 98,
          avgCostVariance: 1.5,
          notes: 'Contract optimized: Supplier switched to Matrix Lights network. Guaranteed SLA & fixed pricing applied.'
        };
      }
      return v;
    }));
    addActivity?.(`Supply Chain: Swapped flagged vendor "${name}" contract parameters for high-performing Matrix Lights SLAs.`, 'success');
  };


  // Filter and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [flagFilter, setFlagFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof Vendor>('reliabilityScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort vendors
  const filteredVendors = useMemo(() => {
    return vendors
      .filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          v.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || v.category === categoryFilter;
        const matchesFlag = flagFilter === 'ALL' || 
          (flagFilter === 'FLAGGED' && v.flagged) || 
          (flagFilter === 'CLEAN' && !v.flagged);
        return matchesSearch && matchesCategory && matchesFlag;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') {
          valA = (valA as string).toLowerCase();
          valB = (valB as string).toLowerCase();
        }

        if (valA === undefined) return 1;
        if (valB === undefined) return -1;

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [vendors, searchTerm, categoryFilter, flagFilter, sortField, sortDirection]);

  // Flagged vendors list for the alert box
  const flaggedVendors = useMemo(() => {
    return vendors.filter(v => v.flagged);
  }, [vendors]);

  const handleSort = (field: keyof Vendor) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortField(field);
    setSortDirection(isAsc ? 'desc' : 'asc');
  };

  // Scatter data: on-time rate as x, cost variance as y, name, and score
  const scatterData = useMemo(() => {
    return vendors.map(v => ({
      x: v.onTimeRate,
      y: v.avgCostVariance,
      name: v.name,
      score: v.reliabilityScore,
      category: v.category
    }));
  }, [vendors]);

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
        <span className="text-xs text-slate-500 font-medium">Vendor reliability index and compliance monitoring</span>
        <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold">
          LOGISTICS NODE
        </span>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Vendors</span>
            <p className="text-2xl font-bold text-slate-900">{kpis.totalVendors}</p>
            <div className="flex items-center text-xs text-slate-500">
              <span>Verified suppliers</span>
            </div>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
            <Truck className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Reliability Score</span>
            <p className="text-2xl font-bold text-slate-900">{kpis.avgReliabilityScore.toFixed(1)}/100</p>
            <div className="flex items-center text-xs text-emerald-600 font-medium">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span>Target &gt;85.0 average</span>
            </div>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
            <Activity className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Flagged Status</span>
            <p className="text-2xl font-bold text-rose-600">{kpis.flaggedCount}</p>
            <div className="flex items-center text-xs text-rose-500 font-medium">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>Breach risk identified</span>
            </div>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-lg text-rose-600">
            <AlertTriangle className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Best Performer</span>
            <p className="text-lg font-bold text-slate-900 truncate max-w-[150px]">{kpis.bestPerformer?.name || 'N/A'}</p>
            <div className="flex items-center text-xs text-emerald-600 font-medium">
              <span>Score: {kpis.bestPerformer?.reliabilityScore}/100</span>
            </div>
          </div>
          <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
            <Award className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Flagged Alert Box */}
      {flaggedVendors.length > 0 && (
        <div className="border border-rose-200 bg-rose-50/50 p-4 rounded-xl flex flex-col md:flex-row md:items-start space-y-3 md:space-y-0 md:space-x-4">
          <div className="bg-rose-100 text-rose-700 p-2 rounded-lg self-start">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">Urgent Operational Notice: Flagged Vendors</h4>
            <p className="text-xs text-rose-700 leading-normal">
              The following vendors have fallen below compliance thresholds due to critical service delays or extreme cost variance. Please re-assign upcoming schedules where possible.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {flaggedVendors.map(v => (
                <div key={v.id} className="p-3 bg-white rounded-lg border border-rose-100 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 text-xs">{v.name}</span>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                        Reliability: {v.reliabilityScore}%
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 italic leading-relaxed">"{v.notes}"</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 font-medium border-t border-gray-50 pt-1.5">
                    <span>On-Time: {v.onTimeRate}%</span>
                    <span>Cost Variance: +{v.avgCostVariance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reliability Score Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Supplier Reliability Index</h3>
            <p className="text-xs text-gray-400 mb-4">Vendor reliability scores ranked against threshold limits (Green ≥ 80, Yellow 60-79, Red &lt; 60)</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vendors}
                margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`${value} / 100`, 'Reliability Score']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="reliabilityScore" barSize={30} radius={[4, 4, 0, 0]}>
                  {vendors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getReliabilityColor(entry.reliabilityScore)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* On-Time Rate vs Cost Variance Scatter Chart */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-gray-900">On-Time Rate vs Cost Variance</h3>
            <p className="text-xs text-gray-400 mb-4">Identifying vendors with high costs and low punctuality (Ideal: Bottom Right)</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="On-Time Rate" 
                  unit="%" 
                  domain={[40, 105]} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                >
                  <Label value="On-Time Punctuality (%)" offset={-10} position="insideBottom" style={{ fontSize: '10px', fill: '#94a3b8' }} />
                </XAxis>
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Cost Variance" 
                  unit="%" 
                  domain={[-5, 25]} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                >
                  <Label value="Budget Overrun Variance (%)" angle={-90} position="insideLeft" style={{ fontSize: '10px', fill: '#94a3b8' }} />
                </YAxis>
                <ZAxis type="number" dataKey="score" range={[60, 200]} name="Score" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-lg text-xs space-y-1">
                          <p className="font-bold text-slate-800">{data.name}</p>
                          <p className="text-gray-500">Category: <span className="font-medium text-slate-700">{data.category}</span></p>
                          <p className="text-gray-500">Punctuality: <span className="font-medium text-slate-700">{data.x}%</span></p>
                          <p className="text-gray-500">Cost Variance: <span className="font-medium text-slate-700">+{data.y}%</span></p>
                          <p className="text-gray-500">Reliability Score: <span className="font-medium text-indigo-600 font-bold">{data.score}/100</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Vendors" data={scatterData} fill="#6366f1" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Supplier Registry Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Partner Supplier Directory</h3>
            <p className="text-xs text-gray-400">Punctuality and budgetary metrics of partner logistical groups</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                id="vendor-search-input"
                type="text"
                placeholder="Search vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-48 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 placeholder-gray-400 shadow-2xs"
              />
            </div>

            {/* Category Selector */}
            <div className="flex items-center space-x-1.5">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <select
                id="vendor-category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 font-medium text-gray-600 focus:outline-none focus:border-indigo-500 shadow-2xs"
              >
                <option value="ALL">All Categories</option>
                <option value="Catering">Catering</option>
                <option value="AV">AV</option>
                <option value="Photography">Photography</option>
                <option value="Venue">Venue</option>
                <option value="Florist">Florist</option>
                <option value="Security">Security</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Flag Selector */}
            <select
              id="vendor-flag-filter"
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 font-medium text-gray-600 focus:outline-none focus:border-indigo-500 shadow-2xs"
            >
              <option value="ALL">All Compliance</option>
              <option value="FLAGGED">Flagged Only</option>
              <option value="CLEAN">Compliant Only</option>
            </select>
          </div>
        </div>

        {/* Table Contents */}
        <div className="overflow-x-auto">
          {filteredVendors.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No suppliers match the selected filters or search terms.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3.5 px-5 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                    <div className="flex items-center space-x-1">
                      <span>Vendor Name</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                    <div className="flex items-center space-x-1">
                      <span>Category</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('reliabilityScore')}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>Reliability Score</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('onTimeRate')}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>On-Time Rate</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('avgCostVariance')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Avg Budget Variance</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('totalPaid')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Total Business Paid</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-5 text-center">Compliance & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-gray-900">{v.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">ID: {v.id.toUpperCase()}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        {v.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span 
                        className="px-2 py-1 rounded font-bold font-mono"
                        style={{
                          backgroundColor: `${getReliabilityColor(v.reliabilityScore)}12`,
                          color: getReliabilityColor(v.reliabilityScore)
                        }}
                      >
                        {v.reliabilityScore}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold font-mono text-gray-700">
                      {v.onTimeRate}%
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold font-mono ${v.avgCostVariance > 5 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {v.avgCostVariance > 0 ? `+${v.avgCostVariance}%` : `${v.avgCostVariance}%`}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold font-mono text-gray-800">
                      {formatCurrency(v.totalPaid)}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-center gap-2">
                        {v.flagged ? (
                          <div className="flex flex-col sm:flex-row items-center gap-1.5">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
                              <ThumbsDown className="h-3 w-3 shrink-0" />
                              <span>FLAGGED BREACH</span>
                            </span>
                            <button
                              onClick={() => handleOptimizeVendorContract(v.id, v.name)}
                              className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold text-[8px] rounded uppercase transition-colors cursor-pointer shrink-0"
                              title="Re-negotiate contract and apply high-performance SLAs"
                            >
                              SLA Swap
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <ThumbsUp className="h-3 w-3 shrink-0" />
                            <span>COMPLIANT</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}
