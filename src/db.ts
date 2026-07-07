import { Player, Computer, Transaction, Rate, ShopSettings } from './types';

// Default initial data for simulation
const INITIAL_PLAYERS: Player[] = [
  {
    id: 'P001',
    username: 'alex_vip',
    fullName: 'Alex Carter',
    phoneNumber: '+1 555-0199',
    membership: 'VIP',
    balance: 150.00,
    status: 'Active',
    dateCreated: '2026-05-15T14:30:00Z',
    lastLogin: '2026-07-06T18:30:00Z',
    password: 'password'
  },
  {
    id: 'P002',
    username: 'johndoe',
    fullName: 'John Doe',
    phoneNumber: '+1 555-0144',
    membership: 'Regular',
    balance: 15.00,
    status: 'Active',
    dateCreated: '2026-06-01T09:15:00Z',
    lastLogin: '2026-07-05T20:10:00Z',
    password: 'password'
  },
  {
    id: 'P003',
    username: 'elena_gold',
    fullName: 'Elena Rostova',
    phoneNumber: '+1 555-0177',
    membership: 'Gold',
    balance: 45.00,
    status: 'Active',
    dateCreated: '2026-06-10T11:22:00Z',
    lastLogin: '2026-07-06T15:45:00Z',
    password: 'password'
  },
  {
    id: 'P004',
    username: 'marcus_silver',
    fullName: 'Marcus Aurelius',
    phoneNumber: '+1 555-0122',
    membership: 'Silver',
    balance: 8.50,
    status: 'Active',
    dateCreated: '2026-06-22T16:40:00Z',
    lastLogin: '2026-07-06T10:00:00Z',
    password: 'password'
  }
];

const INITIAL_COMPUTERS: Computer[] = [
  {
    number: 1,
    name: 'PC-01 (VIP)',
    status: 'Available',
    remainingTime: 0,
    balance: 0,
    currentRate: 8.00,
    ipAddress: '192.168.1.101',
    lastHeartbeat: Date.now()
  },
  {
    number: 2,
    name: 'PC-02 (VIP)',
    status: 'In Use',
    playerId: 'P001',
    playerName: 'Alex Carter',
    playerMembership: 'VIP',
    remainingTime: 5400, // 1.5 hours in seconds
    balance: 150.00,
    currentRate: 8.00,
    ipAddress: '192.168.1.102',
    lastHeartbeat: Date.now()
  },
  {
    number: 3,
    name: 'PC-03 (Standard)',
    status: 'Available',
    remainingTime: 0,
    balance: 0,
    currentRate: 15.00,
    ipAddress: '192.168.1.103',
    lastHeartbeat: Date.now()
  },
  {
    number: 4,
    name: 'PC-04 (Standard)',
    status: 'Locked',
    remainingTime: 0,
    balance: 0,
    currentRate: 15.00,
    ipAddress: '192.168.1.104',
    lastHeartbeat: Date.now() - 20000 // offline
  },
  {
    number: 5,
    name: 'PC-05 (Standard)',
    status: 'Available',
    remainingTime: 0,
    balance: 0,
    currentRate: 15.00,
    ipAddress: '192.168.1.105',
    lastHeartbeat: Date.now()
  },
  {
    number: 6,
    name: 'PC-06 (Standard)',
    status: 'In Use',
    playerId: 'P004',
    playerName: 'Marcus Aurelius',
    playerMembership: 'Silver',
    remainingTime: 1200, // 20 minutes in seconds
    balance: 8.50,
    currentRate: 12.00,
    ipAddress: '192.168.1.106',
    lastHeartbeat: Date.now()
  },
  {
    number: 7,
    name: 'PC-07 (Console)',
    status: 'Available',
    remainingTime: 0,
    balance: 0,
    currentRate: 15.00,
    ipAddress: '192.168.1.107',
    lastHeartbeat: Date.now()
  },
  {
    number: 8,
    name: 'PC-08 (Console)',
    status: 'Available',
    remainingTime: 0,
    balance: 0,
    currentRate: 15.00,
    ipAddress: '192.168.1.108',
    lastHeartbeat: Date.now()
  }
];

const INITIAL_RATES: Rate[] = [
  { membership: 'VIP', ratePerHour: 8.00 },
  { membership: 'Gold', ratePerHour: 10.00 },
  { membership: 'Silver', ratePerHour: 12.00 },
  { membership: 'Regular', ratePerHour: 15.00 }
];

const INITIAL_SETTINGS: ShopSettings = {
  serverPort: 8080,
  currency: 'USD',
  shopName: 'Nexus Cyber Arena',
  autoLockOnExpiry: true
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'T-1001',
    playerId: 'P001',
    username: 'alex_vip',
    type: 'Top Up',
    amount: 100.00,
    timestamp: '2026-07-06T12:00:00Z',
    notes: 'Cash Top Up'
  },
  {
    id: 'T-1002',
    playerId: 'P002',
    username: 'johndoe',
    type: 'Top Up',
    amount: 15.00,
    timestamp: '2026-07-06T14:15:00Z',
    notes: 'Cash Top Up'
  },
  {
    id: 'T-1003',
    playerId: 'P003',
    username: 'elena_gold',
    type: 'Top Up',
    amount: 50.00,
    timestamp: '2026-07-06T15:00:00Z',
    notes: 'Credit Card'
  }
];

// SQLite Simulator state management
export class SQLiteSimulator {
  private static getStored<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(`lan_shop_${key}`);
    return data ? JSON.parse(data) : defaultValue;
  }

  private static setStored<T>(key: string, value: T): void {
    localStorage.setItem(`lan_shop_${key}`, JSON.stringify(value));
  }

  public static getPlayers(): Player[] {
    return this.getStored<Player[]>('players', INITIAL_PLAYERS);
  }

  public static savePlayers(players: Player[]): void {
    this.setStored<Player[]>('players', players);
  }

  public static getComputers(): Computer[] {
    return this.getStored<Computer[]>('computers', INITIAL_COMPUTERS);
  }

  public static saveComputers(computers: Computer[]): void {
    this.setStored<Computer[]>('computers', computers);
  }

  public static getRates(): Rate[] {
    return this.getStored<Rate[]>('rates', INITIAL_RATES);
  }

  public static saveRates(rates: Rate[]): void {
    this.setStored<Rate[]>('rates', rates);
  }

  public static getSettings(): ShopSettings {
    return this.getStored<ShopSettings>('settings', INITIAL_SETTINGS);
  }

  public static saveSettings(settings: ShopSettings): void {
    this.setStored<ShopSettings>('settings', settings);
  }

  public static getTransactions(): Transaction[] {
    return this.getStored<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
  }

  public static saveTransactions(transactions: Transaction[]): void {
    this.setStored<Transaction[]>('transactions', transactions);
  }

  public static addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Transaction {
    const txs = this.getTransactions();
    const newTx: Transaction = {
      ...transaction,
      id: `T-${1000 + txs.length + 1}`,
      timestamp: new Date().toISOString()
    };
    txs.unshift(newTx);
    this.saveTransactions(txs);
    return newTx;
  }
}
