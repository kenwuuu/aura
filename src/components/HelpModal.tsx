import React, { useMemo } from 'react';
import { marked } from 'marked';
import helpContent from '../content/help.md?raw';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Configure marked.js with basic options
marked.setOptions({
  breaks: true,
  gfm: true,
});

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  // Parse markdown to HTML using marked.js's default parser
  const htmlContent = useMemo(() => marked.parse(helpContent), []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[800px] w-[95%] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Help & Instructions</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-0">
          <div className="max-h-[65vh] overflow-y-auto px-1">
            <div
              className="prose text-sm leading-relaxed text-[#e5e7eb]"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};