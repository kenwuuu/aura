export { WebRTCProvider } from './WebRTCProvider';
export type { WebRTCConfig, ConnectionStatus } from './types';
export {
  getOrCreatePlayerId,
  getOrCreatePeerId,
  saveAwarenessState,
  restoreAwarenessState,
  clearPersistedSession,
  type AwarenessState
} from './persistence';