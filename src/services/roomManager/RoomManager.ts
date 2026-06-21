import {ROOM_PREFIX} from "../../constants";
import posthog from "posthog-js";

/**
 * Service for managing room state and tracking
 * Handles room ID generation, URL management, and visit tracking
 */
export class RoomManager {
  private static readonly VISITED_ROOMS_KEY = 'aura-visited-rooms';
  private static readonly MAX_RECENT_ROOMS = 3;

  private roomName: string;

  constructor() {
    // Get room name from URL or generate a random one
    const urlParams = new URLSearchParams(window.location.search);
    this.roomName = urlParams.get('room') ?? this.generateRoomId();

    // Update URL with room name if not present
    if (!urlParams.get('room')) {
      window.history.replaceState({}, '', `?room=${this.roomName}`);
    } else { // if room name is present, user is joining an existing game
      posthog.capture('player_joined_existing_room', {
        room_id: this.roomName
      })
    }
  }

  /**
   * Get the current room name
   */
  getRoomName(): string {
    return this.roomName;
  }

  /**
   * Generate a random room ID
   */
  private generateRoomId(): string {
    return ROOM_PREFIX + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Check if the current room was recently visited
   * @returns true if room is in the recent visits list
   */
  isRecentRoom(): boolean {
    const visitedRooms = this.getVisitedRooms();
    return visitedRooms.includes(this.roomName);
  }

  /**
   * Mark the current room as visited
   * Maintains a list of the N most recent rooms
   */
  markRoomAsVisited(): void {
    const visitedRooms = this.getVisitedRooms();

    // Add this room to visited list (keep only last N)
    const updatedRooms = [
      this.roomName,
      ...visitedRooms.filter(r => r !== this.roomName)
    ].slice(0, RoomManager.MAX_RECENT_ROOMS);

    localStorage.setItem(
      RoomManager.VISITED_ROOMS_KEY,
      JSON.stringify(updatedRooms)
    );
  }

  /**
   * Get list of recently visited rooms
   */
  private getVisitedRooms(): string[] {
    const visitedRoomsJson = localStorage.getItem(RoomManager.VISITED_ROOMS_KEY);
    return visitedRoomsJson ? JSON.parse(visitedRoomsJson) : [];
  }

  /**
   * Clear the visited rooms history
   */
  static clearVisitedRooms(): void {
    localStorage.removeItem(RoomManager.VISITED_ROOMS_KEY);
  }
}