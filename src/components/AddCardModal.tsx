import React, { useState, useEffect, useRef } from 'react';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (cardName: string) => Promise<void>;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAddCard }) => {
  const [cardName, setCardName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 50);
      // Reset state
      setCardName('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = cardName.trim();
    if (!trimmedName || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await onAddCard(trimmedName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add card');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-[500px]" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Card to Hand</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="card-name-input"
                className="block mb-2 text-gray-400 text-sm"
              >
                Enter the exact card name
              </label>
              <input
                ref={inputRef}
                id="card-name-input"
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder='e.g., "Lightning Bolt"'
                disabled={isLoading}
                className="w-full px-3 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-md text-slate-50 outline-none focus:border-sky-500 focus:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {error && (
              <div className="px-3 py-2.5 mb-4 bg-red-500/10 border border-red-500/30 rounded-md text-red-300 text-[13px]">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="px-3 py-2.5 mb-4 bg-blue-500/10 border border-blue-500/30 rounded-md text-blue-300 text-[13px]">
                Fetching card from Scryfall...
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`px-4 py-2.5 text-sm font-medium bg-slate-900 border border-slate-700 rounded-md text-slate-300 transition-all duration-150 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800 border-slate-600'}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!cardName.trim() || isLoading}
                className={`px-4 py-2.5 text-sm font-medium border-none rounded-md transition-all duration-150 ${cardName.trim() && !isLoading ? 'bg-sky-500 text-slate-950 cursor-pointer hover:bg-sky-400' : 'bg-slate-900 text-slate-500 cursor-not-allowed'}`}
              >
                {isLoading ? 'Adding...' : 'Add to Hand'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};