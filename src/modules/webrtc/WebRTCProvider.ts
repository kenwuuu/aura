import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { WebRTCConfig, ConnectionStatus } from './types';

export class WebRTCProvider {
  private yDoc: Y.Doc;
  private provider: WebrtcProvider;
  private config: WebRTCConfig;
  private statusCallbacks: Set<(status: ConnectionStatus) => void> = new Set();

  constructor(yDoc: Y.Doc, config: WebRTCConfig) {
    this.yDoc = yDoc;
    this.config = {
      roomName: config.roomName,
      signalingServers: config.signalingServers ?? [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com',
        'wss://y-webrtc-signaling-us.herokuapp.com'
      ],
      iceServers: config.iceServers ?? [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    };

    this.provider = new WebrtcProvider(this.config.roomName, this.yDoc, {
      signaling: this.config.signalingServers,
      // @ts-ignore - y-webrtc uses peerOpts which isn't in the types
      peerOpts: {
        config: {
          iceServers: this.config.iceServers
        }
      }
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.provider.on('peers', (event: { added: string[]; removed: string[]; webrtcPeers: string[] }) => {
      const status: ConnectionStatus = {
        isConnected: event.webrtcPeers.length > 0,
        peersCount: event.webrtcPeers.length
      };
      this.notifyStatusChange(status);
    });

    this.provider.on('synced', (event: { synced: boolean }) => {
      console.log('Yjs synced:', event.synced);
    });
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.statusCallbacks.add(callback);
  }

  public offStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.statusCallbacks.delete(callback);
  }

  private notifyStatusChange(status: ConnectionStatus): void {
    this.statusCallbacks.forEach(callback => callback(status));
  }

  public getConnectionStatus(): ConnectionStatus {
    const peersCount = this.provider.room?.webrtcConns.size ?? 0;
    return {
      isConnected: peersCount > 0,
      peersCount
    };
  }

  public getRoomName(): string {
    return this.config.roomName;
  }

  public destroy(): void {
    this.provider.destroy();
    this.statusCallbacks.clear();
  }
}