import React, { useEffect, useState } from 'react';

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

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000]" onClick={handleClose}>
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 max-w-[400px]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-slate-50 text-xl mb-4">Welcome to Aura</h2>
        <p className="text-slate-300 text-sm leading-relaxed mb-3">
          Import a new deck using the <strong className="text-slate-50">Choose Deck</strong> button in the top left.
        </p>
        <p className="text-slate-300 text-sm leading-relaxed mb-3">
          View all hotkeys in the <strong className="text-slate-50">Hotkeys</strong> button next to it.
        </p>
        <div className="flex gap-3 mt-6">
          {showDontShowAgain && (
            <button 
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-md border border-slate-700 bg-slate-900 text-slate-100 cursor-pointer transition-all duration-150 hover:bg-slate-800" 
              onClick={handleDontShowAgain}
            >
              Don't show again
            </button>
          )}
          <button 
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-md border border-sky-500 bg-sky-500 text-slate-950 cursor-pointer transition-all duration-150 hover:bg-sky-400" 
            onClick={handleClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};