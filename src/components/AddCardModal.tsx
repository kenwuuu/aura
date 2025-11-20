import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';

interface AddCardModalProps {
  onAddCard: (cardName: string) => Promise<void>;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ onAddCard }) => {
  const isOpen = useUIStore((state) => state.isAddCardModalOpen);
  const onClose = useUIStore((state) => state.closeAddCardModal);
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
      <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Card to Hand</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="card-name-input"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#9ca3af',
                  fontSize: '14px',
                }}
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
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #3d3d3d',
                  borderRadius: '6px',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  marginBottom: '16px',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  borderRadius: '6px',
                  color: '#fca5a5',
                  fontSize: '13px',
                }}
              >
                {error}
              </div>
            )}

            {isLoading && (
              <div
                style={{
                  padding: '10px 12px',
                  marginBottom: '16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  color: '#93c5fd',
                  fontSize: '13px',
                }}
              >
                Fetching card from Scryfall...
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #3d3d3d',
                  borderRadius: '6px',
                  color: '#9ca3af',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!cardName.trim() || isLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: cardName.trim() && !isLoading ? '#3b82f6' : '#1e3a5f',
                  border: 'none',
                  borderRadius: '6px',
                  color: cardName.trim() && !isLoading ? '#fff' : '#6b7280',
                  cursor: cardName.trim() && !isLoading ? 'pointer' : 'not-allowed',
                }}
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