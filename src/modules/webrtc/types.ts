export interface WebRTCConfig {
  roomName: string;
  signalingServers?: string[];
  iceServers?: RTCIceServer[];
}

export interface ConnectionStatus {
  isConnected: boolean;
  peersCount: number;
}