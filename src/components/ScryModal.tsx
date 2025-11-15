import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface ScryModalProps {
  isOpen: boolean;
  onConfirm: (count: number) => void;
  onCancel: () => void;
  maxCards: number;
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  } as React.CSSProperties,
  content: {
    backgroundColor: '#1a1a1a',
    border: '2px solid #3d3d3d',
    borderRadius: '16px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
    outline: 'none',
  } as React.CSSProperties,
  header: {
    padding: '20px',
    borderBottom: '2px solid #2d2d2d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  title: {
    color: '#ffffff',
    fontSize: '20px',
    margin: 0,
  } as React.CSSProperties,
  close: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '32px',
    cursor: 'pointer',
    padding: 0,
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'background-color 0.2s, color 0.2s',
  } as React.CSSProperties,
  body: {
    padding: '24px 20px',
  } as React.CSSProperties,
  label: {
    color: '#e5e7eb',
    fontSize: '16px',
    marginBottom: '12px',
    display: 'block',
  } as React.CSSProperties,
  input: {
    width: '100%',
    backgroundColor: '#0f0f0f',
    border: '2px solid #3d3d3d',
    borderRadius: '8px',
    padding: '12px',
    color: '#ffffff',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  hint: {
    color: '#9ca3af',
    fontSize: '14px',
    marginTop: '8px',
  } as React.CSSProperties,
  buttonContainer: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  } as React.CSSProperties,
  button: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  confirmButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
  } as React.CSSProperties,
  cancelButton: {
    backgroundColor: '#2d2d2d',
    color: '#9ca3af',
  } as React.CSSProperties,
};

export const ScryModal: React.FC<ScryModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  maxCards,
}) => {
  const [count, setCount] = useState('1');

  useEffect(() => {
    if (isOpen) {
      setCount('1');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, count]);

  const handleConfirm = () => {
    const numCards = parseInt(count, 10);
    if (!isNaN(numCards) && numCards > 0 && numCards <= maxCards) {
      onConfirm(numCards);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive integers
    if (value === '' || /^\d+$/.test(value)) {
      setCount(value);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay style={styles.overlay}>
          <Dialog.Content style={styles.content} onPointerDownOutside={onCancel}>
            <div style={styles.header}>
              <Dialog.Title style={styles.title}>Scry and Surveil</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  style={styles.close}
                  onClick={onCancel}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2d2d2d';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                >
                  ×
                </button>
              </Dialog.Close>
            </div>
            <div style={styles.body}>
              <label style={styles.label}>How many cards?</label>
              <input
                type="text"
                inputMode="numeric"
                value={count}
                onChange={handleInputChange}
                style={styles.input}
                autoFocus
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#3d3d3d'}
              />
              <div style={styles.hint}>
                Max: {maxCards} card{maxCards !== 1 ? 's' : ''} in deck
              </div>
              <div style={styles.buttonContainer}>
                <button
                  style={{ ...styles.button, ...styles.cancelButton }}
                  onClick={onCancel}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d3d3d'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2d2d2d'}
                >
                  Cancel
                </button>
                <button
                  style={{ ...styles.button, ...styles.confirmButton }}
                  onClick={handleConfirm}
                  disabled={!count || parseInt(count, 10) <= 0 || parseInt(count, 10) > maxCards}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                    }
                  }}
                >
                  Scry
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
};