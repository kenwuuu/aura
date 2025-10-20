export interface WebRTCConfig {
  roomName: string;
  signalingServers?: string[];
  iceServers?: RTCIceServer[];
  peerId?: string; // Optional persistent peer ID
}

export interface ConnectionStatus {
  isConnected: boolean;
  peersCount: number;
}