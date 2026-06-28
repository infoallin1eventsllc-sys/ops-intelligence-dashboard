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
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  Label
} from 'recharts';
import { 
  Calendar, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Building, 
  Users, 
  DollarSign, 
  TrendingUp,
  MapPin
} from 'lucide-react';
import { Event, EventType, EventStatus } from '../types';
import { 
  calculateEventStatusBreakdown, 
  calculateVenueBreakdown, 
  calculateMonthlyFinancials,
  formatCurrency 
} from '../utils/calculations';

interface EventAnalyticsViewProps {
  events: Event[];
  setEvents?: React.Dispatch<React.SetStateAction<Event[]>>;
  clients?: any;
  addActivity?: (message: string, type?: 'success' | 'warning' | 'info') => void;
  googleToken?: string | null;
}

const STATUS_COLORS = {
  Completed: '#10b981', // Emerald
  Upcoming: '#0ea5e9',  // Sky blue
  Cancelled: '#f43f5e'  // Rose
};

import { syncEventToGoogleCalendar } from '../utils/workspace';

export default function EventAnalyticsView({ 
  events, 
  setEvents, 
  clients, 
  addActivity,
  googleToken 
}: EventAnalyticsViewProps) {
  // Filters & Sorting States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof Event>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Derived Calculations
  const statusBreakdown = calculateEventStatusBreakdown(events);
  const venueBreakdown = calculateVenueBreakdown(events);
  const monthlyData = calculateMonthlyFinancials(events); // has eventCount

  const avgGuests = useMemo(() => {
    const active = events.filter(e => e.status !== 'Cancelled');
    return active.length > 0 
      ? Math.round(active.reduce((sum, e) => sum + e.guestCount, 0) / active.length)
      : 0;
  }, [events]);

  // Filtered & Sorted Table Data
  const filteredEvents = useMemo(() => {
    return events
      .filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          e.venue.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'ALL' || e.type === typeFilter;
        const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
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
  }, [events, searchTerm, typeFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: keyof Event) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortField(field);
    setSortDirection(isAsc ? 'desc' : 'asc');
  };

  // Scatter Plot Data: Guest count as X, Revenue as Y
  const scatterData = useMemo(() => {
    return events
      .filter(e => e.status !== 'Cancelled')
      .map(e => ({
        x: e.guestCount,
        y: e.revenue,
        name: e.name,
        type: e.type,
        venue: e.venue
      }));
  }, [events]);

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
        <span className="text-xs text-slate-500 font-medium">Event booking trends, size metrics, and pipeline velocity</span>
        <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold">
          SCHEDULING UNIT
        </span>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Operations Booked</span>
            <p className="text-2xl font-bold text-slate-900">{events.length}</p>
            <div className="flex items-center text-xs text-slate-500">
              <span>Includes cancelled bookings</span>
            </div>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
            <Calendar className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Completed Events</span>
            <p className="text-2xl font-bold text-emerald-600 font-sans">
              {events.filter(e => e.status === 'Completed').length}
            </p>
            <div className="flex items-center text-xs text-slate-500">
              <span>Past delivery achieved</span>
            </div>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
            <Calendar className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Upcoming Events</span>
            <p className="text-2xl font-bold text-sky-600 font-sans">
              {events.filter(e => e.status === 'Upcoming').length}
            </p>
            <div className="flex items-center text-xs text-slate-500">
              <span>Active pipeline in Q3</span>
            </div>
          </div>
          <div className="bg-sky-50 p-2.5 rounded-lg text-sky-600">
            <Calendar className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Guest Size</span>
            <p className="text-2xl font-bold text-slate-900 font-sans">{avgGuests}</p>
            <div className="flex items-center text-xs text-indigo-600 font-medium">
              <span>Attendees per active event</span>
            </div>
          </div>
          <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
            <Users className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Row 1, Left: Event Status Breakdown (PieChart) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Event Status Ratios</h3>
            <p className="text-xs text-gray-400 mb-4">Volume comparison of completed, upcoming, and cancelled projects</p>
          </div>
          <div className="h-56 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusBreakdown.map((entry) => (
                    <Cell 
                      key={`cell-${entry.name}`} 
                      fill={STATUS_COLORS[entry.name as EventStatus]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [value, 'Events']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Total Bookings</span>
              <span className="text-xl font-black text-slate-800">{events.length}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-center border-t border-gray-50 pt-3">
            {statusBreakdown.map((item) => (
              <div key={item.name} className="flex flex-col items-center">
                <div className="flex items-center space-x-1 mb-0.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name as EventStatus] }} />
                  <span className="text-gray-500 font-medium text-[11px]">{item.name}</span>
                </div>
                <span className="font-bold text-gray-800 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 1, Right: Monthly Event Count (BarChart) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Monthly Operational Volume</h3>
            <p className="text-xs text-gray-400 mb-4">Number of active events executed month-by-month</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis domain={[0, 'auto']} allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`${value} events`, 'Volume']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="eventCount" name="Active Events" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2, Left: Revenue by Venue (Horizontal BarChart) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs lg:col-span-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-indigo-600" />
              <span>Revenue yield by Venue location</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-sans">Accumulated booking revenue per physical facility</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={venueBreakdown}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 35, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => [
                    `${formatCurrency(Number(value))} (${props.payload.count} events)`, 
                    'Revenue'
                  ]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: Guest count vs Revenue (ScatterChart) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs lg:col-span-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Attendance-to-Revenue Correlation</h3>
            <p className="text-xs text-gray-400 mb-4">Plotting individual events by attendees (X) against invoice value (Y)</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Guests" 
                  domain={[0, 450]} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                >
                  <Label value="Guest Count (Attendees)" offset={-10} position="insideBottom" style={{ fontSize: '10px', fill: '#94a3b8' }} />
                </XAxis>
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Revenue" 
                  domain={[0, 90000]} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `$${val / 1000}k`}
                >
                  <Label value="Gross Invoice Revenue ($)" angle={-90} position="insideLeft" style={{ fontSize: '10px', fill: '#94a3b8' }} />
                </YAxis>
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-lg text-xs space-y-1">
                          <p className="font-bold text-slate-800">{data.name}</p>
                          <p className="text-gray-500">Venue: <span className="font-medium text-slate-700">{data.venue}</span></p>
                          <p className="text-gray-500">Event Category: <span className="font-medium text-slate-700">{data.type}</span></p>
                          <p className="text-gray-500">Attendees: <span className="font-semibold text-slate-700 font-mono">{data.x} guests</span></p>
                          <p className="text-gray-500">Invoice Revenue: <span className="font-bold text-indigo-600 font-mono">{formatCurrency(data.y)}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Active Events" data={scatterData} fill="#0ea5e9" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filterable Events Spreadsheets */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Event Operations Spreadsheet</h3>
            <p className="text-xs text-gray-400">Sort, search, and verify logistics schedules and booking financials</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                id="event-search-input"
                type="text"
                placeholder="Search venue or event name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-52 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 placeholder-gray-400 shadow-2xs"
              />
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center space-x-1.5">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <select
                id="event-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 font-medium text-gray-600 focus:outline-none focus:border-indigo-500 shadow-2xs"
              >
                <option value="ALL">All Event Types</option>
                <option value="Corporate">Corporate</option>
                <option value="Wedding">Wedding</option>
                <option value="Private">Private</option>
                <option value="Nonprofit">Nonprofit</option>
              </select>
            </div>

            {/* Event Status Filter */}
            <select
              id="event-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 font-medium text-gray-600 focus:outline-none focus:border-indigo-500 shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table Contents */}
        <div className="overflow-x-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No events found matching the selected filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3.5 px-5 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                    <div className="flex items-center space-x-1">
                      <span>Event & Venue</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('type')}>
                    <div className="flex items-center space-x-1">
                      <span>Category</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date')}>
                    <div className="flex items-center space-x-1">
                      <span>Schedule Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('guestCount')}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>Guests</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('revenue')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Gross Rev</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-indigo-50 text-indigo-900" onClick={() => handleSort('profit')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Profit Margin</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-5 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>Status</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  {googleToken && <th className="py-3.5 px-5 text-center">Google Sync</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEvents.map((e) => {
                  const profitMargin = e.revenue > 0 ? (e.profit / e.revenue) * 100 : 0;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-gray-900">{e.name}</p>
                        <p className="text-[10px] text-gray-400 font-semibold flex items-center space-x-1">
                          <MapPin className="h-2.5 w-2.5 text-gray-300" />
                          <span>{e.venue}</span>
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          e.type === 'Corporate' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          e.type === 'Wedding' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          e.type === 'Private' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-slate-50 text-slate-700 border-slate-100'
                        }`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-500 font-semibold">{e.date}</td>
                      <td className="py-3.5 px-4 text-center font-semibold text-gray-800 font-mono">{e.guestCount}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-700 font-mono">
                        {formatCurrency(e.revenue)}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold font-mono ${e.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(e.profit)}
                        <span className="block text-[9px] font-medium text-gray-400">{profitMargin.toFixed(0)}% margin</span>
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
                      {googleToken && (
                        <td className="py-3.5 px-5 text-center">
                          {e.status === 'Upcoming' ? (
                            <button
                              onClick={async () => {
                                const confirmSync = window.confirm(`Sync "${e.name}" directly to your Google Calendar?`);
                                if (!confirmSync) return;
                                const result = await syncEventToGoogleCalendar(e, googleToken);
                                if (result.success) {
                                  addActivity?.(`Google Calendar: Synced event "${e.name}" successfully!`, 'success');
                                  if (result.url) {
                                    window.open(result.url, '_blank');
                                  }
                                } else {
                                  addActivity?.(`Calendar sync error: ${result.error}`, 'warning');
                                }
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[9px] rounded uppercase transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Sync event directly to Google Calendar"
                            >
                              <Calendar className="h-2.5 w-2.5" />
                              <span>Sync</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}
