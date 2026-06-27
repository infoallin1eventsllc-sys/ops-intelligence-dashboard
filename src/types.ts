/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EventType = 'Corporate' | 'Wedding' | 'Private' | 'Nonprofit';
export type EventStatus = 'Completed' | 'Upcoming' | 'Cancelled';
export type ClientSegment = 'Enterprise' | 'SMB' | 'Individual';
export type ClientRisk = 'Low' | 'Medium' | 'High';
export type VendorCategory = 'Catering' | 'AV' | 'Photography' | 'Venue' | 'Florist' | 'Security' | 'Other';

export interface Event {
  id: string;
  name: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  revenue: number;
  costs: number;
  profit: number;
  clientId: string;
  vendorIds: string[];
  status: EventStatus;
  guestCount: number;
  venue: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  segment: ClientSegment;
  totalSpend: number;
  eventCount: number;
  firstEventDate: string;
  lastEventDate: string;
  lifetimeValue: number;
  retentionRisk: ClientRisk;
  notes?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  totalContracts: number;
  onTimeRate: number; // 0-100 percentage
  avgCostVariance: number; // percentage (positive or negative)
  reliabilityScore: number; // 0-100
  totalPaid: number;
  flagged: boolean;
  notes?: string;
}

export interface MonthlyFinancial {
  month: string; // e.g., "Jan 2026"
  revenue: number;
  costs: number;
  profit: number;
  margin: number; // percentage, e.g. 0.35 for 35%
  eventCount: number;
}

export interface Activity {
  id: string;
  timestamp: string;
  message: string;
  type: 'success' | 'warning' | 'info';
}

