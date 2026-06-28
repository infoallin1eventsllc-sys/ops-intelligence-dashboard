/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Sidebar, { ActiveView } from './components/Sidebar';
import DashboardView from './components/DashboardView';
import RevenueView from './components/RevenueView';
import ClientAnalyticsView from './components/ClientAnalyticsView';
import VendorView from './components/VendorView';
import EventAnalyticsView from './components/EventAnalyticsView';
import AIAnalysisView from './components/AIAnalysisView';
import GoogleSyncCenter from './components/GoogleSyncCenter';
import { Bell, Sparkles, RotateCcw, AlertTriangle, ShieldCheck, TrendingUp, ChevronDown, ChevronUp, Terminal, Activity as ActivityIcon } from 'lucide-react';

import { INITIAL_EVENTS, INITIAL_CLIENTS, INITIAL_VENDORS } from './data';
import { Event, Client, Vendor, Activity } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  // Core records stored in state to make the whole app dynamic
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);

  // Recruiter Guided Console Open state
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // System Activity Trail (Recruiters absolutely love seeing custom loggers)
  const [activityLog, setActivityLog] = useState<Activity[]>([
    { id: 'act-0', timestamp: '08:00:00 AM', message: 'System initialization complete.', type: 'success' },
    { id: 'act-1', timestamp: '08:01:15 AM', message: 'Financial ledger synchronized with logistics database.', type: 'info' },
    { id: 'act-2', timestamp: '08:02:30 AM', message: 'AI Analysis engine connected to cognitive insights core.', type: 'success' }
  ]);

  const addActivity = (message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setActivityLog(prev => [
      { id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, timestamp, message, type },
      ...prev.slice(0, 19)
    ]);
  };

  // Quick navigation helpers from within views (like dashboard buttons)
  const handleNavigate = (view: 'revenue' | 'clients' | 'events') => {
    setCurrentView(view);
  };

  // GUIDED RECUPERATOR SCENARIOS:
  
  // Scenario 1: Reconcile CRM Risks
  const handleScenarioCRM = () => {
    // Set cascade medical and david miller risks to low, add positive client notes and spend boosts
    setClients(prev => prev.map(c => {
      if (c.id === 'c12') { // Cascade Healthcare
        return {
          ...c,
          retentionRisk: 'Low',
          totalSpend: c.totalSpend + 15000,
          lifetimeValue: c.lifetimeValue + 20000,
          notes: 'Executive reconciliation completed. Offered 10% AV discount on next booking. Retained successfully!'
        };
      }
      if (c.id === 'c5') { // David Miller
        return {
          ...c,
          retentionRisk: 'Low',
          totalSpend: c.totalSpend + 5000,
          lifetimeValue: c.lifetimeValue + 5000,
          notes: 'Customer complaints resolved. High satisfaction achieved after VIP venue upgrade.'
        };
      }
      return c;
    }));

    addActivity('CRM Risk Mitigated: Reconciled accounts for "Cascade Healthcare" and "David Miller".', 'success');
    addActivity('Client "Cascade Healthcare" retention risk downgraded to LOW. CRM contract expanded.', 'success');
  };

  // Scenario 2: Suppress Supply Chain Cost Variance (Swap AV Vendor)
  const handleScenarioSupplyChain = () => {
    // For all upcoming events with vendor v2 (ProSonic AV), swap with v8 (Matrix Lights)
    setEvents(prev => prev.map(e => {
      if (e.status === 'Upcoming' && e.vendorIds.includes('v2')) {
        return {
          ...e,
          vendorIds: e.vendorIds.map(vid => vid === 'v2' ? 'v8' : vid),
          costs: Math.round(e.costs * 0.92), // 8% savings
          profit: e.revenue - Math.round(e.costs * 0.92)
        };
      }
      return e;
    }));

    // Update Vendor stats
    setVendors(prev => prev.map(v => {
      if (v.id === 'v2') { // ProSonic AV
        return { ...v, flagged: false, reliabilityScore: 78, notes: 'Contract audits active. Improved quality SLA agreed.' };
      }
      if (v.id === 'v8') { // Matrix Lights
        return { ...v, totalContracts: v.totalContracts + 1, totalPaid: v.totalPaid + 12000 };
      }
      return v;
    }));

    addActivity('Supply Chain Optimized: Swapped ProSonic AV (flagged) for Matrix Lights on upcoming accounts.', 'success');
    addActivity('YTD margin yields optimized (+8.0% cost efficiency on re-routed events).', 'success');
  };

  // Scenario 3: Stress-Test Corporate Growth
  const handleScenarioGrowth = () => {
    const newEvents: Event[] = [
      {
        id: `mock-e-${Date.now()}-1`,
        name: 'Google Cloud Tech Forum',
        type: 'Corporate',
        date: '2026-07-14',
        revenue: 85000,
        costs: 52000,
        profit: 33000,
        clientId: 'c1',
        vendorIds: ['v1', 'v4', 'v6'],
        status: 'Upcoming',
        guestCount: 350,
        venue: 'The Grand Ballroom & Plaza'
      },
      {
        id: `mock-e-${Date.now()}-2`,
        name: 'Stripe regional dev summit',
        type: 'Corporate',
        date: '2026-07-20',
        revenue: 45000,
        costs: 28000,
        profit: 17000,
        clientId: 'c6',
        vendorIds: ['v1', 'v8', 'v10'],
        status: 'Upcoming',
        guestCount: 180,
        venue: 'Modern Arts Pavilion'
      }
    ];

    setEvents(prev => [...newEvents, ...prev]);
    
    // Add spend to clients
    setClients(prev => prev.map(c => {
      if (c.id === 'c1') {
        return { ...c, totalSpend: c.totalSpend + 85000, eventCount: c.eventCount + 1, lifetimeValue: c.lifetimeValue + 85000 };
      }
      if (c.id === 'c6') {
        return { ...c, totalSpend: c.totalSpend + 45000, eventCount: c.eventCount + 1, lifetimeValue: c.lifetimeValue + 45000 };
      }
      return c;
    }));

    addActivity('Corporate Pipeline Stress-Test: Generated 2 premium upcoming events ($130k Gross Revenue).', 'success');
    addActivity('Interactive charts, YTD Revenue trackers, and client margins recalculated.', 'info');
  };

  // Reset Sandbox State
  const handleResetSandbox = () => {
    setEvents(INITIAL_EVENTS);
    setClients(INITIAL_CLIENTS);
    setVendors(INITIAL_VENDORS);
    setActivityLog([
      { id: `act-reset-${Date.now()}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), message: 'Sandbox database reset to baseline standard.', type: 'info' }
    ]);
  };

  // Determine current view title
  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Business Performance Dashboard';
      case 'revenue':
        return 'Revenue & Profitability';
      case 'clients':
        return 'Client Analytics';
      case 'vendors':
        return 'Vendor Performance Audit';
      case 'events':
        return 'Event Logistics Analytics';
      case 'ai':
        return 'Ops AI Cognitive Core';
      default:
        return 'Operations Intelligence';
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => setCurrentView(view)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Persistent High Density Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sm:px-8 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">{getViewTitle()}</h1>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Interactive Dev Sandbox
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 hidden sm:block">Data synchronized as of Jun 27, 2026</div>
            <div 
              id="header-notification-bell"
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className={`w-9 h-9 flex items-center justify-center border rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer relative ${isConsoleOpen ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200'}`}
              title="Toggle Dev Console & Live Ledger"
            >
              <Bell className="h-4.5 w-4.5 animate-pulse" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </div>
          </div>
        </header>

        {/* Guided Recruiter Scenario Console & Audit Trail (The Standout Interactive Deck) */}
        {isConsoleOpen && (
          <div className="bg-slate-900 text-slate-100 border-b border-slate-950 px-6 py-4.5 z-20 shadow-md">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Scenario Interactive Actions */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
                    <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-200">Recruiter Evaluation & Scenario Simulator</h2>
                  </div>
                  <button 
                    onClick={() => setIsConsoleOpen(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-800 px-2 py-0.5 rounded"
                  >
                    Hide Dashboard Controls
                  </button>
                </div>
                
                <p className="text-xs text-slate-400 max-w-3xl leading-normal">
                  Recruiters: Click the scenarios below to trigger realistic operations updates. Watch the KPIs, live database records, and beautiful Recharts charts on the active pages recalculate dynamically in real-time.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1.5">
                  <button
                    onClick={handleScenarioCRM}
                    className="flex flex-col items-start p-2.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-slate-200">1. Resolve CRM Risks</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">Downgrade high-risk client flags and apply retention incentives.</span>
                  </button>

                  <button
                    onClick={handleScenarioSupplyChain}
                    className="flex flex-col items-start p-2.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-slate-200">2. Optimize Logistics</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">Swap lagging AV suppliers on upcoming projects to boost yield.</span>
                  </button>

                  <button
                    onClick={handleScenarioGrowth}
                    className="flex flex-col items-start p-2.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="h-3.5 w-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-slate-200">3. Stress-Test Growth</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">Inject premium Fortune 500 summits. Animate metrics upward.</span>
                  </button>

                  <button
                    onClick={handleResetSandbox}
                    className="flex flex-col items-start p-2.5 rounded bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <RotateCcw className="h-3.5 w-3.5 text-slate-400 group-hover:rotate-45 transition-transform" />
                      <span className="text-[11px] font-bold text-slate-200">Reset Database</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">Revert database state back to standard initial templates.</span>
                  </button>
                </div>
              </div>

              {/* Real-time Audit Trail Ledger */}
              <div className="lg:col-span-4 border-l border-slate-800 pl-5 flex flex-col justify-between">
                <div className="flex items-center space-x-1.5 mb-1">
                  <Terminal className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">Live Activity Audit Ledger</span>
                </div>
                <div className="flex-1 bg-slate-950/80 rounded border border-slate-850 p-2 overflow-y-auto max-h-24 font-mono text-[9px] text-slate-300 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {activityLog.map((log) => (
                    <div key={log.id} className="flex items-start gap-1.5">
                      <span className="text-indigo-400 shrink-0 font-semibold">[{log.timestamp}]</span>
                      <span className={log.type === 'success' ? 'text-emerald-400' : log.type === 'warning' ? 'text-amber-400' : 'text-slate-300'}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Content Stage (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-7xl mx-auto w-full pb-10 space-y-6">
            <GoogleSyncCenter 
              events={events}
              clients={clients}
              vendors={vendors}
              addActivity={addActivity}
              onTokenChange={setGoogleToken}
            />

            {currentView === 'dashboard' && (
              <DashboardView 
                events={events} 
                clients={clients} 
                onNavigateToView={handleNavigate} 
                addActivity={addActivity}
                setEvents={setEvents}
              />
            )}

            {currentView === 'revenue' && (
              <RevenueView 
                events={events}
                addActivity={addActivity}
              />
            )}

            {currentView === 'clients' && (
              <ClientAnalyticsView 
                clients={clients}
                setClients={setClients}
                addActivity={addActivity}
              />
            )}

            {currentView === 'vendors' && (
              <VendorView 
                vendors={vendors}
                setVendors={setVendors}
                events={events}
                setEvents={setEvents}
                addActivity={addActivity}
              />
            )}

            {currentView === 'events' && (
              <EventAnalyticsView 
                events={events}
                setEvents={setEvents}
                clients={clients}
                addActivity={addActivity}
                googleToken={googleToken}
              />
            )}

            {currentView === 'ai' && (
              <AIAnalysisView
                events={events}
                clients={clients}
                vendors={vendors}
                addActivity={addActivity}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

