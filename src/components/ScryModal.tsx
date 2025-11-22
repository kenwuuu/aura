import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ScryModalProps {
  isOpen: boolean;
  onConfirm: (count: number) => void;
  onCancel: () => void;
  maxCards: number;
}

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-[400px] w-[90%]">
        <DialogHeader>
          <DialogTitle>Scry and Surveil</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-0">
          <label className="block mb-2 text-gray-400 text-md">
            How many cards?
          </label>
          <Input
            type="text"
            inputMode="numeric"
            value={count}
            onChange={handleInputChange}
            className="w-full bg-[#0f0f0f] border-2 border-[#3d3d3d] rounded-lg px-3 py-3 text-white text-base focus-visible:border-blue-500 focus-visible:ring-0"
            autoFocus
          />
          <div className="text-[#9ca3af] text-sm mt-2">
            Max: {maxCards} card{maxCards !== 1 ? 's' : ''} in deck
          </div>
          <div className="flex gap-3 mt-5">
            <button
              className="flex-1 px-3 py-3 rounded-lg border-none text-base font-bold cursor-pointer transition-colors bg-[#2d2d2d] text-[#9ca3af] hover:bg-[#3d3d3d]"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-3 py-3 rounded-lg border-none text-base font-bold cursor-pointer transition-colors bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
              onClick={handleConfirm}
              disabled={!count || parseInt(count, 10) <= 0 || parseInt(count, 10) > maxCards}
            >
              Scry
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};