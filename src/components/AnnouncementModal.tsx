import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import announcementContent from '../content/announcement.md?raw';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const VISIT_COUNT_KEY = 'aura-visit-count';

interface AnnouncementModalProps {
  onClose: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);

  const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
  const personalizedContent = announcementContent
    .replace('{{VISIT_COUNT}}', String(visitCount));

  useEffect(() => {
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timer);
          setCanClose(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open && !canClose) return; // block closing of the dialog
    setIsOpen(open);
    if (!open) onClose();
  };

  useEffect(() => {
    setIsOpen(true);
  }, []);
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        onEscapeKeyDown={e => { if (!canClose) e.preventDefault(); }}
        onInteractOutside={e => { if (!canClose) e.preventDefault(); }}
        className={!canClose ? '[&_[data-slot=dialog-close]]:hidden' : ''}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Today, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            {!canClose && (
              <span className="text-sm font-normal text-gray-400 mr-10">
                Please read… {secondsLeft}s
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className={`p-6 pt-0 flex-1 overflow-y-auto`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="text-[28px] font-bold mb-4 mt-6 text-blue-400 border-b border-gray-700 pb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-[22px] font-bold mb-3 text-gray-50">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-5 text-gray-100">{children}</h3>,
              p: ({ children }) => <p className="mb-3">{children}</p>,
              ul: ({ children }) => <ul className="mb-4 pl-6 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="mb-4 pl-6 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="mb-2">{children}</li>,
              strong: ({ children }) => <strong className="font-bold text-blue-400">{children}</strong>,
              code: ({ children }) => <code className="bg-gray-800 px-1.5 py-0.5 rounded font-mono text-[13px] text-emerald-400">{children}</code>,
              pre: ({ children }) => <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto mb-4">{children}</pre>,
              hr: () => <hr className="mb-5 border-gray-700" />,
            }}
          >
            {personalizedContent}
          </ReactMarkdown>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};