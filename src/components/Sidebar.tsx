/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  DollarSign, 
  Users, 
  Truck, 
  Calendar, 
  Sparkles, 
  Menu, 
  X,
  TrendingUp,
  Activity
} from 'lucide-react';

export type ActiveView = 
  | 'dashboard' 
  | 'revenue' 
  | 'clients' 
  | 'vendors' 
  | 'events' 
  | 'ai';

interface SidebarProps {
  currentView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      testId: 'sidebar-nav-dashboard'
    },
    {
      id: 'revenue',
      label: 'Revenue & Profitability',
      icon: TrendingUp,
      testId: 'sidebar-nav-revenue'
    },
    {
      id: 'clients',
      label: 'Client Analytics',
      icon: Users,
      testId: 'sidebar-nav-clients'
    },
    {
      id: 'vendors',
      label: 'Vendor Performance',
      icon: Truck,
      testId: 'sidebar-nav-vendors'
    },
    {
      id: 'events',
      label: 'Event Analytics',
      icon: Calendar,
      testId: 'sidebar-nav-events'
    },
    {
      id: 'ai',
      label: 'AI Analysis',
      icon: Sparkles,
      testId: 'sidebar-nav-ai'
    }
  ];

  const handleSelect = (id: ActiveView) => {
    onViewChange(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="bg-[#0f172a] text-white flex items-center justify-between px-4 py-3.5 md:hidden z-40 relative border-b border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 bg-indigo-500 rounded flex items-center justify-center">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <span className="font-sans font-bold tracking-tight text-md">Ops Intel</span>
        </div>
        <button
          id="sidebar-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-300 hover:text-white p-1 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Overlay for mobile drawer */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside 
        className={`fixed md:sticky top-0 left-0 bottom-0 z-30 w-64 bg-[#0f172a] text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } h-screen shrink-0 border-r border-slate-800`}
      >
        <div className="flex flex-col">
          {/* Logo / Title Area (High Density styling matching design template) */}
          <div className="hidden md:flex items-center gap-3 p-6 border-b border-slate-800">
            <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center shrink-0">
              <Activity className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-lg block">Ops Intel</span>
              <span className="text-[9px] text-indigo-400 font-mono uppercase tracking-widest font-bold">ALL IN 1 EVENTS</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="py-4 px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={item.testId}
                  onClick={() => handleSelect(item.id as ActiveView)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 text-left cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile Area (Jane Doe matching design template) */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
              JD
            </div>
            <div>
              <p className="text-sm font-medium text-white leading-tight">Jane Doe</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Operations Lead</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
