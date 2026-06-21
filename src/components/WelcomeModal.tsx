import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const VISIT_COUNT_KEY = 'aura-visit-count';
const VIEW_COUNT_KEY = 'aura-welcome-modal-view-count';
const DISMISSED_KEY = 'aura-welcome-dismissed';

export const WelcomeModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDontShowAgain, setShowDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the modal permanently
    const isDismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
    if (isDismissed) return;

    // Track visit count
    let viewCount = parseInt(localStorage.getItem(VIEW_COUNT_KEY) || '0', 10);

    // Copy over old visit numbers to new cookie, so we can use visit to track visits, and not Welcome views
    // safe to remove the following 2 lines of code after june 15th 2026
    const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
    if (viewCount === 0) viewCount = visitCount;

    const newViewCount = viewCount + 1;
    localStorage.setItem(VIEW_COUNT_KEY, newViewCount.toString());

    // Show "Don't show again" button from third visit onwards
    if (newViewCount >= 3) {
      setShowDontShowAgain(true);
    }

    // Show modal
    setIsVisible(true);
  }, []);

  const handleDontShowAgain = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  return (
    <Dialog open={isVisible} onOpenChange={setIsVisible}>
      <DialogContent className="max-w-md border-1">
        <DialogHeader className="border-none px-8 pt-8">
          <DialogTitle>Welcome to Aura</DialogTitle>
          <DialogDescription className="space-y-3 pt-2 text-md text-gray-200">
            <p>
              <strong >Start a game</strong> by sharing a game link with friends by clicking
              the <strong>Copy Game Link</strong> button on the top right.
            </p>
            <p>
              Import a new deck using the <strong className="text-white">Choose Deck</strong> button in the top left.
            </p>
            <p>
              View all hotkeys in the <strong className="text-white">Hotkeys</strong> button next to it.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:gap-6 pb-8 px-8 border-none">
          {showDontShowAgain && (
            <Button
              onClick={handleDontShowAgain}
              className="flex-1 h-12 text-md font-semibold rounded-lg border border-[#4a4a4a] bg-[#2d2d2d] text-white hover:bg-[#3a3a3a]"
            >
              Don't show again
            </Button>
          )}
          <Button
            onClick={() => setIsVisible(false)}
            className="flex-1 h-12 text-md font-semibold rounded-xl border border-[#3d3d3d] bg-blue-500 text-white hover:bg-blue-600"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};