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
const DISMISSED_KEY = 'aura-welcome-dismissed';

export const WelcomeModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDontShowAgain, setShowDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the modal permanently
    const isDismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
    if (isDismissed) return;

    // Track visit count
    const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
    const newVisitCount = visitCount + 1;
    localStorage.setItem(VISIT_COUNT_KEY, newVisitCount.toString());

    // Show "Don't show again" button from third visit onwards
    if (newVisitCount >= 3) {
      setShowDontShowAgain(true);
    }

    // Show modal
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  return (
    <Dialog open={isVisible} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Aura</DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>
              Import a new deck using the <strong className="text-white">Choose Deck</strong> button in the top left.
            </p>
            <p>
              View all hotkeys in the <strong className="text-white">Hotkeys</strong> button next to it.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:gap-3">
          {showDontShowAgain && (
            <Button variant="outline" onClick={handleDontShowAgain} className="flex-1">
              Don't show again
            </Button>
          )}
          <Button onClick={handleClose} className="flex-1">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};