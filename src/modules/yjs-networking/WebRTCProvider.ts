/**
 * WebRTC Provider - Real-time peer-to-peer synchronization for Aura
 *
 * This module wraps y-webrtc and y-indexeddb to provide:
 * - Peer-to-peer WebRTC connections for real-time state sync
 * - Local IndexedDB persistence for offline-first experience
 * - Persistent peer identity across page reloads
 * - Awareness state restoration (user presence/metadata)
 *
 * ## How It Works
 *
 * 1. **Y.Doc (Yjs Document)**: Shared CRDT data structure that syncs between peers
 * 2. **WebRTC Provider**: Establishes peer-to-peer connections via signaling server
 * 3. **IndexedDB Persistence**: Stores Y.Doc locally for instant reload
 * 4. **Awareness**: Tracks which peers are online and their metadata
 *
 * ## Connection Flow
 *
 * ```
 * User opens page
 *     │
 *     ├─> Load Y.Doc from IndexedDB (instant restoration)
 *     │
 *     ├─> Connect to signaling server (wss://...)
 *     │       │
 *     │       └─> Discover peers in same room
 *     │               │
 *     │               └─> Establish WebRTC connections
 *     │                       │
 *     │                       └─> Sync Y.Doc state (bidirectional)
 *     │
 *     └─> Restore awareness state (username, color, etc.)
 * ```
 *
 * ## Persistence Strategy
 *
 * - **Player ID**: Stored in localStorage, reused across sessions
 * - **Peer ID**: Stored in localStorage, prevents "new peer" on reload
 * - **Y.Doc state**: Stored in IndexedDB, instant restoration
 * - **Awareness**: Stored in localStorage, restored on load
 *
 * @see persistence.ts for session management utilities
 * @see types.ts for configuration interfaces
 */

import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebRTCConfig, ConnectionStatus } from './types';
import { restoreAwarenessState, setupAwarenessStatePersistence, AwarenessState } from './persistence';
import {YjsNetworkProvider} from "@/modules/yjs-networking/YjsNetworkFactory";


async function fetchCloudFlareIceServers(): Promise<RTCIceServer[]> {
  try {
    const response = await fetch('https://cloudflare-turn-config-fetcher.kenqiwu-1b0.workers.dev/ice-servers');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    console.log('CloudFlare ICE servers fetched successfully');
    return data['iceServers'];
  } catch (error) {
    console.warn('Failed to fetch CloudFlare ICE servers, using fallback STUN servers:', error);
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ];
  }
}

/**
 * Main WebRTC provider class that manages peer-to-peer connections
 * and document persistence
 */
export class WebRTCProvider implements YjsNetworkProvider{
  private yDoc: Y.Doc;
  private provider: WebrtcProvider;
  private persistence: IndexeddbPersistence;
  private config: WebRTCConfig;
  private statusCallbacks: Set<(status: ConnectionStatus) => void> = new Set();
  private cleanupAwarenessPersistence?: () => void;

  status(): string {
    return this.provider.connected ? 'connected' : 'connecting';
  }

  public on(event: 'status', callback: (event: { status: string }) => void): void {
    this.provider.on('peers', (peersEvent: { webrtcPeers: string[] }) => {
      const status = peersEvent.webrtcPeers.length > 0 ? 'connected' : 'disconnected';
      callback({ status });
    });
  }

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