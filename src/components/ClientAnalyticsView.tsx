/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  DollarSign, 
  TrendingUp, 
  ArrowUpDown,
  Filter,
  UserCheck,
  Building
} from 'lucide-react';
import { Client, ClientSegment, ClientRisk } from '../types';
import { 
  calculateClientKPIs, 
  formatCurrency 
} from '../utils/calculations';

interface ClientAnalyticsViewProps {
  clients: Client[];
  setClients?: React.Dispatch<React.SetStateAction<Client[]>>;
  addActivity?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

const RISK_COLORS = {
  Low: '#10b981',   // Emerald
  Medium: '#f59e0b', // Amber
  High: '#ef4444'    // Rose
};

export default function ClientAnalyticsView({ clients, setClients, addActivity }: ClientAnalyticsViewProps) {
  const kpis = calculateClientKPIs(clients);

  const handleResolveRiskDirect = (clientId: string, name: string) => {
    setClients?.(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          retentionRisk: 'Low',
          totalSpend: c.totalSpend + 12000,
          lifetimeValue: c.lifetimeValue + 15000,
          notes: 'Resolved: VIP executive outreach conducted. Re-allocated AV to Matrix Lights & gifted custom credits.'
        };
      }
      return c;
    }));
    addActivity?.(`CRM resolution: Downgraded risk flag for "${name}" and applied VIP contract perks.`, 'success');
  };


  // States for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof Client>('lifetimeValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Chart 1: Top 10 clients by LTV
  const top10ClientsData = useMemo(() => {
    return [...clients]
      .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
      .slice(0, 10)
      .map(c => ({
        name: c.name.length > 15 ? `${c.name.slice(0, 15)}...` : c.name,
        fullName: c.name,
        lifetimeValue: c.lifetimeValue,
        totalSpend: c.totalSpend
      }));
  }, [clients]);

  // Chart 2: Retention Risk breakdown donut data
  const riskBreakdownData = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 };
    clients.forEach(c => {
      counts[c.retentionRisk] += 1;
    });
    return [
      { name: 'Low', value: counts.Low },
      { name: 'Medium', value: counts.Medium },
      { name: 'High', value: counts.High }
    ];
  }, [clients]);

  // Chart 3: Client segment distribution
  const segmentDistributionData = useMemo(() => {
    const data: Record<ClientSegment, { count: number; spend: number }> = {
      Enterprise: { count: 0, spend: 0 },
      SMB: { count: 0, spend: 0 },
      Individual: { count: 0, spend: 0 }
    };
    clients.forEach(c => {
      if (data[c.segment] !== undefined) {
        data[c.segment].count += 1;
        data[c.segment].spend += c.totalSpend;
      }
    });
    return (Object.keys(data) as ClientSegment[]).map(seg => ({
      segment: seg,
      count: data[seg].count,
      totalSpend: data[seg].spend
    }));
  }, [clients]);

  // Filter and Search table data
  const filteredClients = useMemo(() => {
    return clients
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (c.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSegment = segmentFilter === 'ALL' || c.segment === segmentFilter;
        const matchesRisk = riskFilter === 'ALL' || c.retentionRisk === riskFilter;
        return matchesSearch && matchesSegment && matchesRisk;
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
  }, [clients, searchTerm, segmentFilter, riskFilter, sortField, sortDirection]);

  const handleSort = (field: keyof Client) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortField(field);
    setSortDirection(isAsc ? 'desc' : 'asc');
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
        <span className="text-xs text-slate-500 font-medium">Customer lifetime value and retention metrics</span>
        <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold">
          CRM PORTAL
        </span>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Accounts</span>
            <p className="text-2xl font-bold text-slate-900">{kpis.totalClients}</p>
            <div className="flex items-center text-xs text-slate-500">
              <span>Managed in CRM</span>
            </div>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
            <Users className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Enterprise Clients</span>
            <p className="text-2xl font-bold text-slate-900">{kpis.enterpriseClients}</p>
            <div className="flex items-center text-xs text-indigo-600 font-medium">
              <span>{((kpis.enterpriseClients / kpis.totalClients) * 100).toFixed(0)}% of user base</span>
            </div>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
            <Building className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Lifetime Value</span>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(kpis.avgLTV)}</p>
            <div className="flex items-center text-xs text-emerald-600 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>LTV expansion active</span>
            </div>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
            <DollarSign className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow animate-pulse-subtle">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">High Risk Accounts</span>
            <p className="text-2xl font-bold text-rose-600">{kpis.highRiskCount}</p>
            <div className="flex items-center text-xs text-rose-500 font-medium">
              <ShieldAlert className="h-3 w-3 mr-1" />
              <span>Requires immediate follow-up</span>
            </div>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-lg text-rose-600">
            <ShieldAlert className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Horizontal Bar Chart: Top Clients by LTV */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs lg:col-span-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Top 10 Clients by Lifetime Value</h3>
            <p className="text-xs text-gray-400 mb-4">Comparing customer lifetime value (LTV) vs actual spent bookings YTD</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top10ClientsData}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    formatCurrency(Number(value)), 
                    name === 'lifetimeValue' ? 'Lifetime Value' : 'Total Spent'
                  ]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="lifetimeValue" name="Lifetime Value (LTV)" fill="#6366f1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="totalSpend" name="Current Spend YTD" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Retention Risk Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Retention Risk Assessment</h3>
            <p className="text-xs text-gray-400 mb-4 font-sans">Internal client retention warning levels</p>
          </div>
          <div className="h-44 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskBreakdownData.map((entry) => (
                    <Cell 
                      key={`cell-${entry.name}`} 
                      fill={RISK_COLORS[entry.name as ClientRisk]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [value, 'Clients']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] text-gray-400 font-semibold uppercase">High Risk</span>
              <span className="text-xl font-extrabold text-rose-600">{kpis.highRiskCount}</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs mt-3">
            {riskBreakdownData.map((item) => (
              <div key={item.name} className="flex items-center justify-between border-b border-gray-50 pb-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[item.name as ClientRisk] }} />
                  <span className="text-gray-600 font-medium">{item.name} Risk</span>
                </div>
                <span className="font-bold text-gray-900">{item.value} {item.value === 1 ? 'client' : 'clients'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Client Segment Distribution */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs lg:col-span-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Segment Yield Distribution</h3>
            <p className="text-xs text-gray-400 mb-4">Comparing operational volume (client counts) against realized aggregate revenue per segment</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={segmentDistributionData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="segment" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false}
                  tickFormatter={(val) => `${val} accounts`}
                />
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    name === 'totalSpend' ? formatCurrency(Number(value)) : `${value} accounts`,
                    name === 'totalSpend' ? 'Aggregate Spend' : 'Client Count'
                  ]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="right" dataKey="count" name="Client Count" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar yAxisId="left" dataKey="totalSpend" name="Total Revenue Spent" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Searchable Client Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Operational Client Registry</h3>
            <p className="text-xs text-gray-400">Search and filter active accounts by customer segment and risk indicators</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                id="client-search-input"
                type="text"
                placeholder="Search clients, emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-52 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 placeholder-gray-400 shadow-2xs"
              />
            </div>

            {/* Segment Selector */}
            <div className="flex items-center space-x-1.5">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <select
                id="client-segment-filter"
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 font-medium text-gray-600 focus:outline-none focus:border-indigo-500 shadow-2xs"
              >
                <option value="ALL">All Segments</option>
                <option value="Enterprise">Enterprise</option>
                <option value="SMB">SMB</option>
                <option value="Individual">Individual</option>
              </select>
            </div>

            {/* Risk Selector */}
            <select
              id="client-risk-filter"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 font-medium text-gray-600 focus:outline-none focus:border-indigo-500 shadow-2xs"
            >
              <option value="ALL">All Risks</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
        </div>

        {/* Table Contents */}
        <div className="overflow-x-auto">
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No accounts match the selected filters or search terms.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3.5 px-5 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                    <div className="flex items-center space-x-1">
                      <span>Client Details</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('segment')}>
                    <div className="flex items-center space-x-1">
                      <span>Segment</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('totalSpend')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Total Spent</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('eventCount')}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>Events</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-indigo-100/50 text-indigo-900" onClick={() => handleSort('lifetimeValue')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>LTV</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-5 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('retentionRisk')}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>Retention Risk</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-5">Notes & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-gray-900">{c.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{c.email} • {c.phone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.segment === 'Enterprise' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        c.segment === 'SMB' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-slate-50 text-slate-700 border border-slate-100'
                      }`}>
                        {c.segment}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-700 font-mono">
                      {formatCurrency(c.totalSpend)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-800 font-mono">
                      {c.eventCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-indigo-600 font-mono">
                      {formatCurrency(c.lifetimeValue)}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                        style={{
                          backgroundColor: `${RISK_COLORS[c.retentionRisk]}12`,
                          color: RISK_COLORS[c.retentionRisk],
                          borderColor: `${RISK_COLORS[c.retentionRisk]}33`
                        }}
                      >
                        {c.retentionRisk}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 max-w-xs">
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="text-gray-500 truncate block flex-1" title={c.notes}>{c.notes || '—'}</span>
                        {(c.retentionRisk === 'High' || c.retentionRisk === 'Medium') && (
                          <button
                            onClick={() => handleResolveRiskDirect(c.id, c.name)}
                            className="shrink-0 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[9px] rounded uppercase transition-all cursor-pointer"
                          >
                            Resolve Risk
                          </button>
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
