import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebRTCConfig, ConnectionStatus } from './types';
import { restoreAwarenessState, setupAwarenessStatePersistence, AwarenessState } from './persistence';

export class WebRTCProvider {
  private yDoc: Y.Doc;
  private provider: WebrtcProvider;
  private persistence: IndexeddbPersistence;
  private config: WebRTCConfig;
  private statusCallbacks: Set<(status: ConnectionStatus) => void> = new Set();
  private cleanupAwarenessPersistence?: () => void;

  constructor(yDoc: Y.Doc, config: WebRTCConfig) {
    this.yDoc = yDoc;
    this.config = {
      roomName: config.roomName,
      peerId: config.peerId,
      signalingServers: config.signalingServers ?? [
        'wss://y-webrtc-eu-production-1328.up.railway.app',
      ],
      iceServers: config.iceServers ?? [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    };

    // Set up IndexedDB persistence for the Y.Doc
    // This persists the document state locally so it survives page reloads
    this.persistence = new IndexeddbPersistence(this.config.roomName, this.yDoc);

    this.provider = new WebrtcProvider(this.config.roomName, this.yDoc, {
      signaling: this.config.signalingServers,
      // @ts-ignore - y-webrtc uses peerOpts which isn't in the types
      peerOpts: {
        config: {
          iceServers: this.config.iceServers
        }
      }
    });

    // Set persistent peer ID if provided
    if (config.peerId) {
      // @ts-ignore - peerId is not officially exposed but can be set
      this.provider.peerId = config.peerId;
    }

    this.setupEventListeners();
    this.setupAwareness();
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

    // Log when IndexedDB persistence is ready
    this.persistence.whenSynced.then(() => {
      console.log('Document loaded from IndexedDB');
    });
  }

  /**
   * Set up awareness state persistence and restoration
   */
  private setupAwareness(): void {
    const awareness = this.provider.awareness;

    // Restore previous awareness state if available
    const savedState = restoreAwarenessState();
    if (savedState) {
      awareness.setLocalState(savedState);
      console.log('Restored awareness state from previous session');
    }

    // Set up automatic persistence on page unload
    this.cleanupAwarenessPersistence = setupAwarenessStatePersistence(() => {
      return awareness.getLocalState() as AwarenessState | null;
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

  public getAwareness() {
    return this.provider.awareness;
  }

  public destroy(): void {
    // Clean up awareness persistence listener
    if (this.cleanupAwarenessPersistence) {
      this.cleanupAwarenessPersistence();
    }

    this.provider.destroy();
    this.persistence.destroy();
    this.statusCallbacks.clear();
  }
}