import { describe, it, expect } from 'vitest';
import {
  getActiveEvents,
  calculateDashboardKPIs,
  calculateMonthlyFinancials,
  calculateEventTypeBreakdown,
  getTopProfitableEvents,
  calculateClientKPIs,
  calculateVendorKPIs,
  calculateEventStatusBreakdown,
  calculateVenueBreakdown,
  getMonthLabel,
  formatCurrency,
  formatPercent,
} from '../utils/calculations';
import { INITIAL_EVENTS, INITIAL_CLIENTS, INITIAL_VENDORS } from '../data';

// Seed data reference (18 events total):
// Completed: e1-e15 (15 events)
// Upcoming:  e16, e17 (2 events)
// Cancelled: e18 (1 event — excluded from active)
//
// Active revenue (17 events): $506,000
// Active profit  (17 events): $154,300
// Unique clients in active events: 12

describe('getActiveEvents', () => {
  it('excludes cancelled events', () => {
    const active = getActiveEvents(INITIAL_EVENTS);
    expect(active.every((e) => e.status !== 'Cancelled')).toBe(true);
  });
  it('returns 17 events from 18 total (1 cancelled)', () => {
    expect(getActiveEvents(INITIAL_EVENTS)).toHaveLength(17);
  });
  it('returns empty array for empty input', () => {
    expect(getActiveEvents([])).toHaveLength(0);
  });
});

describe('calculateDashboardKPIs', () => {
  it('sums revenue from non-cancelled events', () => {
    const { totalRevenueYTD } = calculateDashboardKPIs(INITIAL_EVENTS, INITIAL_CLIENTS);
    expect(totalRevenueYTD).toBe(506000);
  });
  it('sums profit from non-cancelled events', () => {
    const { netProfitYTD } = calculateDashboardKPIs(INITIAL_EVENTS, INITIAL_CLIENTS);
    expect(netProfitYTD).toBe(154300);
  });
  it('counts unique client IDs across active events', () => {
    const { activeClientsCount } = calculateDashboardKPIs(INITIAL_EVENTS, INITIAL_CLIENTS);
    expect(activeClientsCount).toBe(12);
  });
  it('computes average margin as a percentage', () => {
    const { avgEventMargin } = calculateDashboardKPIs(INITIAL_EVENTS, INITIAL_CLIENTS);
    expect(avgEventMargin).toBeCloseTo(30.49, 0);
  });
  it('returns zero KPIs for empty input', () => {
    const kpis = calculateDashboardKPIs([], []);
    expect(kpis.totalRevenueYTD).toBe(0);
    expect(kpis.netProfitYTD).toBe(0);
    expect(kpis.activeClientsCount).toBe(0);
    expect(kpis.avgEventMargin).toBe(0);
  });
});

describe('calculateMonthlyFinancials', () => {
  it('returns exactly 6 months (Jan–Jun 2026)', () => {
    expect(calculateMonthlyFinancials(INITIAL_EVENTS)).toHaveLength(6);
  });
  it('excludes the cancelled June event from monthly totals', () => {
    const monthly = calculateMonthlyFinancials(INITIAL_EVENTS);
    const june = monthly.find((m) => m.month === 'Jun 2026')!;
    // Non-cancelled June events: e13(45k) + e14(25k) + e15(25k) + e16(50k) + e17(25k) = 170k
    expect(june.revenue).toBe(170000);
  });
  it('calculates correct January revenue and margin', () => {
    const monthly = calculateMonthlyFinancials(INITIAL_EVENTS);
    const jan = monthly.find((m) => m.month === 'Jan 2026')!;
    // e1: $42k + e2: $9.5k = $51.5k revenue, $14k + $3k = $17k profit
    expect(jan.revenue).toBe(51500);
    expect(jan.profit).toBe(17000);
    expect(jan.margin).toBeCloseTo(17000 / 51500, 4);
  });
  it('records correct event count per month', () => {
    const monthly = calculateMonthlyFinancials(INITIAL_EVENTS);
    const mar = monthly.find((m) => m.month === 'Mar 2026')!;
    // e5, e6, e7 = 3 March events
    expect(mar.eventCount).toBe(3);
  });
});

describe('calculateEventTypeBreakdown', () => {
  it('includes all 4 event types', () => {
    const breakdown = calculateEventTypeBreakdown(INITIAL_EVENTS);
    const names = breakdown.map((b) => b.name);
    expect(names).toContain('Corporate');
    expect(names).toContain('Wedding');
    expect(names).toContain('Private');
    expect(names).toContain('Nonprofit');
  });
  it('counts 11 corporate events (excludes 1 cancelled corporate)', () => {
    const breakdown = calculateEventTypeBreakdown(INITIAL_EVENTS);
    const corporate = breakdown.find((b) => b.name === 'Corporate')!;
    expect(corporate.count).toBe(11);
  });
  it('counts 1 wedding event', () => {
    const breakdown = calculateEventTypeBreakdown(INITIAL_EVENTS);
    const wedding = breakdown.find((b) => b.name === 'Wedding')!;
    expect(wedding.count).toBe(1);
  });
});

describe('getTopProfitableEvents', () => {
  it('returns top 5 by default', () => {
    expect(getTopProfitableEvents(INITIAL_EVENTS)).toHaveLength(5);
  });
  it('returns custom count when specified', () => {
    expect(getTopProfitableEvents(INITIAL_EVENTS, 3)).toHaveLength(3);
  });
  it('excludes cancelled events', () => {
    const top = getTopProfitableEvents(INITIAL_EVENTS);
    expect(top.every((e) => e.status !== 'Cancelled')).toBe(true);
  });
  it('returns events sorted descending by profit', () => {
    const top = getTopProfitableEvents(INITIAL_EVENTS, 10);
    for (let i = 0; i < top.length - 1; i++) {
      expect(top[i].profit).toBeGreaterThanOrEqual(top[i + 1].profit);
    }
  });
});

describe('calculateClientKPIs', () => {
  it('counts all 12 clients', () => {
    expect(calculateClientKPIs(INITIAL_CLIENTS).totalClients).toBe(12);
  });
  it('counts 4 enterprise clients (c1, c6, c7, c12)', () => {
    expect(calculateClientKPIs(INITIAL_CLIENTS).enterpriseClients).toBe(4);
  });
  it('counts 2 high-risk clients (c5, c12)', () => {
    expect(calculateClientKPIs(INITIAL_CLIENTS).highRiskCount).toBe(2);
  });
  it('calculates average LTV across all clients', () => {
    const totalLTV = INITIAL_CLIENTS.reduce((s, c) => s + c.lifetimeValue, 0);
    expect(calculateClientKPIs(INITIAL_CLIENTS).avgLTV).toBeCloseTo(totalLTV / 12, 0);
  });
  it('returns zero KPIs for empty input', () => {
    const kpis = calculateClientKPIs([]);
    expect(kpis.totalClients).toBe(0);
    expect(kpis.avgLTV).toBe(0);
  });
});

describe('calculateVendorKPIs', () => {
  it('counts all 10 vendors', () => {
    expect(calculateVendorKPIs(INITIAL_VENDORS).totalVendors).toBe(10);
  });
  it('counts 2 flagged vendors (v2 ProSonic AV, v9 Mirage Tent)', () => {
    expect(calculateVendorKPIs(INITIAL_VENDORS).flaggedCount).toBe(2);
  });
  it('best performer has the highest reliability score', () => {
    const { bestPerformer } = calculateVendorKPIs(INITIAL_VENDORS);
    const maxScore = Math.max(...INITIAL_VENDORS.map((v) => v.reliabilityScore));
    expect(bestPerformer?.reliabilityScore).toBe(maxScore);
  });
  it('returns null best performer for empty vendor list', () => {
    expect(calculateVendorKPIs([]).bestPerformer).toBeNull();
  });
  it('calculates average reliability score', () => {
    const expected =
      INITIAL_VENDORS.reduce((s, v) => s + v.reliabilityScore, 0) / INITIAL_VENDORS.length;
    expect(calculateVendorKPIs(INITIAL_VENDORS).avgReliabilityScore).toBeCloseTo(expected, 2);
  });
});

describe('calculateEventStatusBreakdown', () => {
  it('returns correct counts for each status', () => {
    const breakdown = calculateEventStatusBreakdown(INITIAL_EVENTS);
    expect(breakdown.find((b) => b.name === 'Completed')?.value).toBe(15);
    expect(breakdown.find((b) => b.name === 'Upcoming')?.value).toBe(2);
    expect(breakdown.find((b) => b.name === 'Cancelled')?.value).toBe(1);
  });
  it('all counts sum to total event count', () => {
    const breakdown = calculateEventStatusBreakdown(INITIAL_EVENTS);
    const total = breakdown.reduce((s, b) => s + b.value, 0);
    expect(total).toBe(INITIAL_EVENTS.length);
  });
});

describe('calculateVenueBreakdown', () => {
  it('excludes cancelled events from venue revenue', () => {
    const breakdown = calculateVenueBreakdown(INITIAL_EVENTS);
    // The Grand Ballroom & Plaza hosts e1, e4, e6, e11, e13, e16 (all non-cancelled)
    const grandBallroom = breakdown.find((b) => b.name === 'The Grand Ballroom & Plaza');
    expect(grandBallroom).toBeDefined();
    expect(grandBallroom!.count).toBe(6);
  });
  it('sorts venues by revenue descending', () => {
    const breakdown = calculateVenueBreakdown(INITIAL_EVENTS);
    for (let i = 0; i < breakdown.length - 1; i++) {
      expect(breakdown[i].revenue).toBeGreaterThanOrEqual(breakdown[i + 1].revenue);
    }
  });
});

describe('getMonthLabel', () => {
  it('formats YYYY-MM-DD to abbreviated Mon YYYY', () => {
    expect(getMonthLabel('2026-01-15')).toBe('Jan 2026');
    expect(getMonthLabel('2026-06-30')).toBe('Jun 2026');
    expect(getMonthLabel('2026-12-01')).toBe('Dec 2026');
  });
});

describe('formatCurrency', () => {
  it('formats positive numbers as USD with commas', () => {
    expect(formatCurrency(42000)).toBe('$42,000');
    expect(formatCurrency(1500000)).toBe('$1,500,000');
  });
  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0');
  });
});

describe('formatPercent', () => {
  it('formats to one decimal place with % suffix', () => {
    expect(formatPercent(36.1)).toBe('36.1%');
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(100)).toBe('100.0%');
  });
});
