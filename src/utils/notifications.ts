import * as Y from 'yjs';
import { toast } from 'sonner';
import { YDOC_NOTIFICATIONS } from '@/constants';

/**
 * Notification types that can be sent across peers
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * A notification message that gets synced via Yjs
 */
export interface NotificationMessage {
  id: string;
  type: NotificationType;
  message: string;
  senderId: string;
  timestamp: number;
}

/**
 * Configuration for the notification system
 */
export interface NotificationConfig {
  /** The Yjs document to use for syncing */
  yDoc: Y.Doc;
  /** The local player ID (to avoid showing own notifications) */
  localPlayerId: string;
  /** Optional: custom toast position (default: 'bottom-center') */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  /** Optional: custom toast style */
  style?: React.CSSProperties;
  /** Optional: whether to use rich colors (default: true) */
  richColors?: boolean;
}

/**
 * Send a notification to all peers via Yjs
 *
 * @param yDoc - The Yjs document
 * @param senderId - The ID of the player sending the notification
 * @param message - The message to display
 * @param type - The type of notification (info, success, warning, error)
 */
export function sendNotification(
  yDoc: Y.Doc,
  senderId: string,
  message: string,
  type: NotificationType = 'info'
): void {
  const yNotifications = yDoc.getArray(YDOC_NOTIFICATIONS);

  const notification: NotificationMessage = {
    id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    message,
    senderId,
    timestamp: Date.now()
  };

  yNotifications.push([notification]);
}

/**
 * Setup notification observer to display incoming notifications
 * Returns a cleanup function to remove the observer
 *
 * @param config - Configuration object
 * @returns Cleanup function to call on unmount
 */
export function setupNotificationObserver(config: NotificationConfig): () => void {
  const { yDoc, localPlayerId, position = 'bottom-center', style = { marginBottom: '200px' }, richColors = true } = config;
  const yNotifications = yDoc.getArray(YDOC_NOTIFICATIONS);

  // Track which notification IDs we've already shown to avoid duplicates
  const shownNotificationIds = new Set<string>();

  // Initialize with existing notifications
  yNotifications.toArray().forEach((notification: any) => {
    shownNotificationIds.add(notification.id);
  });

  const observer = (event: Y.YArrayEvent<any>) => {
    event.changes.added.forEach((item) => {
      const notification = item.content.getContent()[0] as NotificationMessage;

      // Don't show notifications from ourselves or ones we've already shown
      if (notification.senderId === localPlayerId || shownNotificationIds.has(notification.id)) {
        return;
      }

      shownNotificationIds.add(notification.id);

      // Display the notification using Sonner toast
      const toastFn = toast[notification.type] || toast;
      toastFn(notification.message, {
        position,
        style,
        richColors: notification.type === 'warning' || notification.type === 'error' ? richColors : undefined
      });
    });
  };

  yNotifications.observe(observer);

  // Return cleanup function
  return () => {
    yNotifications.unobserve(observer);
  };
}

/**
 * Helper function to create a notification sender bound to a specific player
 *
 * @param yDoc - The Yjs document
 * @param senderId - The ID of the player
 * @returns A function that sends notifications from this player
 */
export function createNotificationSender(yDoc: Y.Doc, senderId: string) {
  return (message: string, type: NotificationType = 'info') => {
    sendNotification(yDoc, senderId, message, type);
  };
}