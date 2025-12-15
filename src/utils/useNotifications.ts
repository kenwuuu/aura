import { useEffect, useMemo } from 'react';
import * as Y from 'yjs';
import {
  setupNotificationObserver,
  createNotificationSender,
  NotificationType,
  NotificationConfig
} from './notifications';

/**
 * React hook for the notification system
 *
 * @param yDoc - The Yjs document
 * @param localPlayerId - The local player ID
 * @param options - Optional configuration (position, style, richColors)
 * @returns A function to send notifications
 *
 * @example
 * ```tsx
 * function MyComponent({ yDoc, playerId }) {
 *   const sendNotification = useNotifications(yDoc, playerId);
 *
 *   const handleAction = () => {
 *     sendNotification('revealed their entire deck', 'warning');
 *   };
 *
 *   return <button onClick={handleAction}>Reveal Deck</button>;
 * }
 * ```
 */
export function useNotifications(
  yDoc: Y.Doc,
  localPlayerId: string,
  options?: Omit<NotificationConfig, 'yDoc' | 'localPlayerId'>
): (message: string, type?: NotificationType) => void {
  // Setup the observer to listen for incoming notifications
  useEffect(() => {
    const cleanup = setupNotificationObserver({
      yDoc,
      localPlayerId,
      ...options
    });

    return cleanup;
  }, [yDoc, localPlayerId, options]);

  // Create a memoized sender function
  const sendNotification = useMemo(
    () => createNotificationSender(yDoc, localPlayerId),
    [yDoc, localPlayerId]
  );

  return sendNotification;
}