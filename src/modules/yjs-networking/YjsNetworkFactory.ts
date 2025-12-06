import * as Y from 'yjs';
import { WebRTCConfig } from './types';
import {WebRTCProvider} from "@/modules/yjs-networking/WebRTCProvider";
import {WebsocketProvider} from "@/modules/yjs-networking/WebsocketProvider";

export interface YjsNetworkProvider{
  status(): string;
  on(event: 'status', callback: (event: { status: string }) => void): void;
}

/**
 * Fetches ICE server configuration from CloudFlare TURN service
 * Falls back to default STUN servers if fetch fails
 */
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
export class yjsNetworkFactory {
  static async create(yDoc: Y.Doc, config: WebRTCConfig): Promise<YjsNetworkProvider> {
    const iceServers = config.iceServers ?? await fetchCloudFlareIceServers();

    const roomName = config.roomName;
    const lastChar = roomName.charAt(roomName.length - 1);
    const firstEighteenLetters = [
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
      'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r'
    ];
    if (firstEighteenLetters.includes(lastChar)) {
      console.log('Using Websockets')
      return new WebsocketProvider(yDoc, config);
    } else {
      console.log('Using WebRTC')
      return new WebRTCProvider(yDoc, {
        ...config,
        iceServers
      });
    }
  }
}