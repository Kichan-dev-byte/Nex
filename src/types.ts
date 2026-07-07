/**
 * Core type definitions for the LAN Computer Shop Management System Simulator
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
  password?: string;
}

export interface Computer {
  number: number;
  name: string;
  status: 'Available' | 'In Use' | 'Locked' | 'Offline';
  playerId?: string;
  playerName?: string;
  playerMembership?: 'VIP' | 'Gold' | 'Silver' | 'Regular';
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
  membership: 'VIP' | 'Gold' | 'Silver' | 'Regular';
  ratePerHour: number;
}

export interface ShopSettings {
  serverPort: number;
  currency: string;
  shopName: string;
  autoLockOnExpiry: boolean;
}
