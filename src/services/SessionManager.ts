/**
 * SessionManager - Handles persistence of user sessions across page reloads
 *
 * Stores player ID and room information in localStorage so users can resume
 * their session after refreshing the page or closing/reopening the tab.
 */

export interface SessionData {
  playerId: string;
  roomName: string;
  createdAt: number;
}

const SESSION_KEY = 'aura-session';
const SESSION_EXPIRY_DAYS = 7; // Sessions expire after 7 days

export class SessionManager {
  /**
   * Get existing session or create a new one
   * @param roomNameFromUrl Optional room name from URL params (takes precedence)
   * @returns Session data with playerId and roomName
   */
  static getOrCreateSession(roomNameFromUrl?: string): SessionData {
    const existingSession = this.loadSession();

    // If we have a room name from URL, use it (user is joining a specific room)
    if (roomNameFromUrl) {
      // If we have an existing session, keep the same player ID but use new room
      if (existingSession) {
        const session: SessionData = {
          playerId: existingSession.playerId,
          roomName: roomNameFromUrl,
          createdAt: Date.now(),
        };
        this.saveSession(session);
        return session;
      }

      // No existing session, create new one with URL room
      const session: SessionData = {
        playerId: this.generatePlayerId(),
        roomName: roomNameFromUrl,
        createdAt: Date.now(),
      };
      this.saveSession(session);
      return session;
    }

    // No room name from URL - use existing session or create new one
    if (existingSession) {
      return existingSession;
    }

    // Create completely new session
    const session: SessionData = {
      playerId: this.generatePlayerId(),
      roomName: this.generateRoomId(),
      createdAt: Date.now(),
    };
    this.saveSession(session);
    return session;
  }

  /**
   * Load session from localStorage
   * @returns SessionData if valid session exists, null otherwise
   */
  private static loadSession(): SessionData | null {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      if (!data) return null;

      const session: SessionData = JSON.parse(data);

      // Check if session has expired
      const expiryTime = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - session.createdAt > expiryTime) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  /**
   * Save session to localStorage
   */
  private static saveSession(session: SessionData): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Clear session from localStorage
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Update room name in existing session
   */
  static updateRoomName(roomName: string): void {
    const session = this.loadSession();
    if (session) {
      session.roomName = roomName;
      this.saveSession(session);
    }
  }

  /**
   * Generate a unique player ID
   */
  private static generatePlayerId(): string {
    return `player-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate a random room ID
   */
  private static generateRoomId(): string {
    return `mtg-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get current player ID (if session exists)
   */
  static getCurrentPlayerId(): string | null {
    const session = this.loadSession();
    return session?.playerId ?? null;
  }

  /**
   * Get current room name (if session exists)
   */
  static getCurrentRoomName(): string | null {
    const session = this.loadSession();
    return session?.roomName ?? null;
  }
}