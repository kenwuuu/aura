import React, { useState, useEffect, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { InfoIcon } from 'lucide-react';

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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader className="flex flex-row justify-between items-center ">
          <div className="space-y-1">
            <DialogTitle>Add Card to Hand</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6">

          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Token cards are double sided</AlertTitle>
            <AlertDescription>
              Press F to flip the card over
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="mb-4">
              <label
                htmlFor="card-name-input"
                className="block mb-2 text-gray-400 text-md"
              >
                Enter the exact card name
              </label>
              <Input
                ref={inputRef}
                id="card-name-input"
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder='e.g., "Lightning Bolt"'
                disabled={isLoading}
                className="w-full px-3 py-2.5 text-sm bg-[#2a2a2a] border border-[#3d3d3d] rounded-md text-white outline-none transition-all duration-200 placeholder:text-[#666] focus:border-blue-500 focus:bg-[#333] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <Alert className="mb-4 bg-blue-500/10 border-blue-500/30">
                <AlertDescription className="text-blue-300">
                  Fetching card from Scryfall...
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium rounded-md cursor-pointer transition-all duration-200 border-none bg-[#2a2a2a] border border-[#3d3d3d] text-gray-400 hover:bg-[#3d3d3d] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!cardName.trim() || isLoading}
              className="px-5 py-2.5 text-sm font-medium rounded-md cursor-pointer transition-all duration-200 border-none bg-blue-500 text-white hover:bg-blue-600 disabled:bg-[#1e3a5f] disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding...' : 'Add to Hand'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};