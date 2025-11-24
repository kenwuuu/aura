import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import patchNotesContent from '../content/patchNotes.md?raw';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PatchNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatchNotesModal: React.FC<PatchNotesModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`min-w-[45vw] max-h-[65vh] flex flex-col`}>
        <DialogHeader>
          <DialogTitle>Patch Notes</DialogTitle>
        </DialogHeader>
        <ScrollArea className={`p-6 pt-0 flex-1 overflow-y-auto`}>

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-[28px] font-bold mb-4 mt-6 text-gray-50 border-b border-gray-700 pb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-[22px] font-bold mb-3 text-blue-400">{children}</h2>,
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
              {patchNotesContent}
            </ReactMarkdown>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};