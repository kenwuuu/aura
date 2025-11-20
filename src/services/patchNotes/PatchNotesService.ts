/**
 * Service for tracking patch notes versions and determining when to show them
 *
 * The version should be updated whenever new patch notes are added.
 * Users will see the patch notes modal on their first visit after a version update.
 */
export class PatchNotesService {
  private static readonly STORAGE_KEY = 'aura-last-seen-patch-notes-v2';

  // Update this version whenever you add new patch notes
  // Format: YYYYMMDD for easy comparison
  private static readonly CURRENT_VERSION = 20251119;

  /**
   * Check if the user should see the patch notes modal
   * Returns true if there are new patch notes since their last visit
   */
  static shouldShowPatchNotes(): boolean {
    const lastSeenVersion = parseFloat(<string>localStorage.getItem(this.STORAGE_KEY));

    // First time user or new version available
    return !lastSeenVersion || lastSeenVersion < this.CURRENT_VERSION;
  }

  /**
   * Mark the current patch notes as seen by the user
   * Call this when the user closes the patch notes modal
   */
  static markPatchNotesAsSeen(): void {
    localStorage.setItem(this.STORAGE_KEY, String(this.CURRENT_VERSION));
    console.log(`Patch notes version ${this.CURRENT_VERSION} marked as seen`);
  }
}