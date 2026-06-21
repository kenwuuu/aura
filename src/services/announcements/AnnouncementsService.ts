/**
 * Service for tracking announcements versions and determining when to show them
 *
 * The version should be updated whenever new announcements are added.
 * Users will see the announcements modal on their first visit after a version update.
 */
export class AnnouncementsService {
  private static readonly STORAGE_KEY = 'aura-announcements';

  // Update this version whenever you add new announcements
  // Format: YYYYMMDD for easy comparison
  private static readonly CURRENT_VERSION = 20260515;

  /**
   * Check if the user should see the announcements modal
   * Returns true if there are new announcements since their last visit
   */
  static shouldShowAnnouncement(): boolean {
    const lastSeenVersion = parseFloat(<string>localStorage.getItem(this.STORAGE_KEY));
    const VISIT_COUNT_KEY = 'aura-visit-count';
    const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);

    // First time user or new version available
    return (!lastSeenVersion || lastSeenVersion < this.CURRENT_VERSION) && visitCount >= 10;
  }

  /**
   * Mark the current announcements as seen by the user
   * Call this when the user closes the announcements modal
   */
  static markAnnouncementAsSeen(): void {
    localStorage.setItem(this.STORAGE_KEY, String(this.CURRENT_VERSION));
    console.log(`Announcement version ${this.CURRENT_VERSION} marked as seen`);
  }
}