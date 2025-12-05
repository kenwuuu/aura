/**
 * WebRTC Type Definitions
 *
 * Core interfaces for WebRTC configuration and connection management.
 */

/**
 * Configuration for WebRTC provider
 *
 * @property roomName - Unique identifier for the collaboration session (from URL param)
 * @property signalingServers - WebSocket URLs for peer discovery (defaults to Railway deployment)
 * @property iceServers - STUN/TURN servers for NAT traversal (defaults to Google STUN)
 * @property peerId - Optional persistent peer ID to maintain identity across reloads
 */
export interface WebRTCConfig {
  roomName: string;
  signalingServers?: string[];
  iceServers?: RTCIceServer[];
  peerId?: string; // Optional persistent peer ID
}

export interface WebsocketConfig {
  roomName: string;
  peerId?: string; // Optional persistent peer ID
}

/**
 * Real-time connection status
 *
 * @property isConnected - True if at least one peer is connected
 * @property peersCount - Number of active peer connections
 */
export interface ConnectionStatus {
  isConnected: boolean;
  peersCount: number;
}