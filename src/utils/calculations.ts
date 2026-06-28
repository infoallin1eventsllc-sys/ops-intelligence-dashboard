/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Event, Client, Vendor, MonthlyFinancial, EventType, EventStatus } from '../types';

/**
 * Filter helper to get non-cancelled events
 */
export function getActiveEvents(events: Event[]): Event[] {
  return events.filter(e => e.status !== 'Cancelled');
}

/**
 * KPI calculations for the main dashboard
 */
export interface DashboardKPIs {
  totalRevenueYTD: number;
  netProfitYTD: number;
  activeClientsCount: number;
  avgEventMargin: number; // 0 to 100 percentage
}

export function calculateDashboardKPIs(events: Event[], clients: Client[]): DashboardKPIs {
  const activeEvents = getActiveEvents(events);
  
  const totalRevenueYTD = activeEvents.reduce((sum, e) => sum + e.revenue, 0);
  const netProfitYTD = activeEvents.reduce((sum, e) => sum + e.profit, 0);
  
  // Active clients: clients who have at least one event in our system (active or completed)
  const clientIdsWithEvents = new Set(activeEvents.map(e => e.clientId));
  const activeClientsCount = clientIdsWithEvents.size;
  
  const avgEventMargin = totalRevenueYTD > 0 ? (netProfitYTD / totalRevenueYTD) * 100 : 0;

  return {
    totalRevenueYTD,
    netProfitYTD,
    activeClientsCount,
    avgEventMargin
  };
}

/**
 * Format date string (e.g. "2026-03-15") into month label (e.g. "Mar 2026")
 */
export function getMonthLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Ensure we get the correct year and month based on UTC/locale to avoid timezone shifting
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const monthIndex = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`;
    }
  }
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Calculates monthly financials for Jan-Jun 2026
 */
export function calculateMonthlyFinancials(events: Event[]): MonthlyFinancial[] {
  const activeEvents = getActiveEvents(events);
  
  const months = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];
  const monthlyData: Record<string, { revenue: number; costs: number; profit: number; eventCount: number }> = {};
  
  months.forEach(m => {
    monthlyData[m] = { revenue: 0, costs: 0, profit: 0, eventCount: 0 };
  });

  activeEvents.forEach(e => {
    const label = getMonthLabel(e.date);
    if (monthlyData[label] !== undefined) {
      monthlyData[label].revenue += e.revenue;
      monthlyData[label].costs += e.costs;
      monthlyData[label].profit += e.profit;
      monthlyData[label].eventCount += 1;
    }
  });

  return months.map(month => {
    const data = monthlyData[month];
    const margin = data.revenue > 0 ? data.profit / data.revenue : 0;
    return {
      month,
      revenue: data.revenue,
      costs: data.costs,
      profit: data.profit,
      margin,
      eventCount: data.eventCount
    };
  });
}

/**
 * Group active events by type
 */
export interface EventTypeBreakdown {
  name: string;
  value: number; // Revenue
  count: number;
}

export function calculateEventTypeBreakdown(events: Event[]): EventTypeBreakdown[] {
  const activeEvents = getActiveEvents(events);
  const breakdown: Record<EventType, { value: number; count: number }> = {
    Corporate: { value: 0, count: 0 },
    Wedding: { value: 0, count: 0 },
    Private: { value: 0, count: 0 },
    Nonprofit: { value: 0, count: 0 }
  };

  activeEvents.forEach(e => {
    if (breakdown[e.type] !== undefined) {
      breakdown[e.type].value += e.revenue;
      breakdown[e.type].count += 1;
    }
  });

  return (Object.keys(breakdown) as EventType[]).map(type => ({
    name: type,
    value: breakdown[type].value,
    count: breakdown[type].count
  }));
}

/**
 * Revenue and Profitability View Metrics
 */
export interface ProfitabilityKPIs {
  bestMonth: { month: string; profit: number };
  worstMonth: { month: string; profit: number };
  avgProfitPerEvent: number;
  totalMarginPercent: number;
}

export function calculateProfitabilityKPIs(events: Event[]): ProfitabilityKPIs {
  const activeEvents = getActiveEvents(events);
  const monthly = calculateMonthlyFinancials(events);
  
  let bestMonth = { month: 'N/A', profit: -Infinity };
  let worstMonth = { month: 'N/A', profit: Infinity };
  
  monthly.forEach(m => {
    if (m.profit > bestMonth.profit) {
      bestMonth = { month: m.month, profit: m.profit };
    }
    if (m.profit < worstMonth.profit && m.revenue > 0) {
      worstMonth = { month: m.month, profit: m.profit };
    }
  });

  // If no months recorded or all 0
  if (bestMonth.profit === -Infinity) bestMonth = { month: 'N/A', profit: 0 };
  if (worstMonth.profit === Infinity) worstMonth = { month: 'N/A', profit: 0 };

  const totalRevenue = activeEvents.reduce((sum, e) => sum + e.revenue, 0);
  const totalProfit = activeEvents.reduce((sum, e) => sum + e.profit, 0);
  const totalMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  
  const avgProfitPerEvent = activeEvents.length > 0 ? totalProfit / activeEvents.length : 0;

  return {
    bestMonth,
    worstMonth,
    avgProfitPerEvent,
    totalMarginPercent
  };
}

/**
 * Top N most profitable events
 */
export function getTopProfitableEvents(events: Event[], count = 5): Event[] {
  const activeEvents = getActiveEvents(events);
  return [...activeEvents].sort((a, b) => b.profit - a.profit).slice(0, count);
}

/**
 * Client View Metrics
 */
export interface ClientKPIs {
  totalClients: number;
  enterpriseClients: number;
  avgLTV: number;
  highRiskCount: number;
}

export function calculateClientKPIs(clients: Client[]): ClientKPIs {
  const totalClients = clients.length;
  const enterpriseClients = clients.filter(c => c.segment === 'Enterprise').length;
  const avgLTV = totalClients > 0 ? clients.reduce((sum, c) => sum + c.lifetimeValue, 0) / totalClients : 0;
  const highRiskCount = clients.filter(c => c.retentionRisk === 'High').length;

  return {
    totalClients,
    enterpriseClients,
    avgLTV,
    highRiskCount
  };
}

/**
 * Vendor View Metrics
 */
export interface VendorKPIs {
  totalVendors: number;
  avgReliabilityScore: number;
  flaggedCount: number;
  bestPerformer: Vendor | null;
}

export function calculateVendorKPIs(vendors: Vendor[]): VendorKPIs {
  const totalVendors = vendors.length;
  const avgReliabilityScore = totalVendors > 0 
    ? vendors.reduce((sum, v) => sum + v.reliabilityScore, 0) / totalVendors 
    : 0;
  const flaggedCount = vendors.filter(v => v.flagged).length;
  
  const bestPerformer = vendors.length > 0
    ? [...vendors].sort((a, b) => {
        if (b.reliabilityScore !== a.reliabilityScore) {
          return b.reliabilityScore - a.reliabilityScore;
        }
        return b.totalPaid - a.totalPaid; // Tie-breaker by business done
      })[0]
    : null;

  return {
    totalVendors,
    avgReliabilityScore,
    flaggedCount,
    bestPerformer
  };
}

/**
 * Event Analysis breakdown helper
 */
export interface EventStatusBreakdown {
  name: string;
  value: number; // Count
}

export function calculateEventStatusBreakdown(events: Event[]): EventStatusBreakdown[] {
  const completed = events.filter(e => e.status === 'Completed').length;
  const upcoming = events.filter(e => e.status === 'Upcoming').length;
  const cancelled = events.filter(e => e.status === 'Cancelled').length;

  return [
    { name: 'Completed', value: completed },
    { name: 'Upcoming', value: upcoming },
    { name: 'Cancelled', value: cancelled }
  ];
}

/**
 * Revenue by Venue breakdown
 */
export interface VenueBreakdown {
  name: string;
  revenue: number;
  count: number;
}

export function calculateVenueBreakdown(events: Event[]): VenueBreakdown[] {
  const activeEvents = getActiveEvents(events);
  const venues: Record<string, { revenue: number; count: number }> = {};

  activeEvents.forEach(e => {
    if (!venues[e.venue]) {
      venues[e.venue] = { revenue: 0, count: 0 };
    }
    venues[e.venue].revenue += e.revenue;
    venues[e.venue].count += 1;
  });

  return Object.keys(venues).map(name => ({
    name,
    revenue: venues[name].revenue,
    count: venues[name].count
  })).sort((a, b) => b.revenue - a.revenue);
}

/**
 * Currency Formatter Utility
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Percentage Formatter Utility
 */
export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
