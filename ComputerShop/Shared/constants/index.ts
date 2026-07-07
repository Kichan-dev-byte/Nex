/**
 * Shared Constants for LAN Computer Shop Management System
 */

export const SOCKET_EVENTS = {
  // Client to Server
  CLIENT_CONNECT: 'client:connect',
  CLIENT_HEARTBEAT: 'client:heartbeat',
  PLAYER_LOGIN_REQUEST: 'player:login:request',
  PLAYER_LOGOUT_REQUEST: 'player:logout:request',
  GUEST_LOGIN_REQUEST: 'guest:login:request',

  // Server to Client
  SERVER_HEARTBEAT_ACK: 'server:heartbeat:ack',
  LOGIN_RESPONSE: 'login:response',
  LOCK_COMPUTER: 'computer:lock',
  UNLOCK_COMPUTER: 'computer:unlock',
  TIMER_UPDATE: 'timer:update',
  SHUTDOWN: 'computer:shutdown',
  RESTART: 'computer:restart',
  POPUP_MESSAGE: 'computer:popup',
  ANNOUNCEMENT: 'computer:announcement',
  FORCE_LOGOUT: 'computer:force_logout',

  // Admin Controls (Dashboard to Server Socket)
  ADMIN_ADD_TIME: 'admin:add_time',
  ADMIN_SUBTRACT_TIME: 'admin:subtract_time',
  ADMIN_PAUSE_TIMER: 'admin:pause_timer',
  ADMIN_RESUME_TIMER: 'admin:resume_timer',
  ADMIN_STOP_TIMER: 'admin:stop_timer',
  ADMIN_REFRESH_COMPUTERS: 'admin:refresh_computers'
};

export const DEFAULT_RATES = {
  Regular: 15.00, // per hour (e.g. PHP or dollars)
  Silver: 12.00,
  Gold: 10.00,
  VIP: 8.00
};

export const HEARTBEAT_INTERVAL_MS = 5000;
export const OFFLINE_THRESHOLD_MS = 12000;
