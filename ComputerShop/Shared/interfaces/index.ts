/**
 * Shared Type Definitions and Interfaces for the LAN Computer Shop Management System
 */

export interface Player {
  id: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  membership: 'VIP' | 'Gold' | 'Silver' | 'Regular';
  balance: number;
  status: 'Active' | 'Inactive';
  dateCreated: string;
  lastLogin?: string;
}

export interface Computer {
  number: number;
  name: string;
  status: 'Available' | 'In Use' | 'Locked' | 'Offline';
  playerId?: string;
  playerName?: string;
  remainingTime: number; // in seconds
  balance: number;
  currentRate: number; // rate per hour
  ipAddress?: string;
  lastHeartbeat: number; // timestamp
}

export interface Transaction {
  id: string;
  playerId?: string;
  username?: string;
  type: 'Top Up' | 'Refund' | 'Membership Fee' | 'Usage Deduction';
  amount: number;
  computerNumber?: number;
  timestamp: string;
  notes?: string;
}

export interface Rate {
  id: string;
  membership: 'VIP' | 'Gold' | 'Silver' | 'Regular';
  ratePerHour: number;
}

export interface TimerState {
  computerNumber: number;
  playerName: string;
  remainingTime: number; // seconds
  isPaused: boolean;
  type: 'Prepaid' | 'Postpaid';
}

export interface SalesReport {
  totalRevenue: number;
  totalTopUps: number;
  activeSessionsCount: number;
  newPlayersCount: number;
}
