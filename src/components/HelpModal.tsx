import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="min-w-[45vw] max-h-[65vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Help & Instructions</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-0 flex-1 overflow-y-auto">
          <div className="text-sm leading-relaxed text-[#e5e7eb]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-50 border-b border-gray-700 pb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 text-blue-400">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4 text-gray-100">{children}</h3>,
                p: ({ children }) => <p className="mb-3">{children}</p>,
                ul: ({ children }) => <ul className="mb-4 pl-6 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="mb-4 pl-6 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="mb-2">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-blue-400">{children}</strong>,
                code: ({ children }) => <code className="bg-gray-800 px-1.5 py-0.5 rounded font-mono text-[13px] text-emerald-400">{children}</code>,
                pre: ({ children }) => <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto mb-4">{children}</pre>,
                a: ({ children, href }) => <a href={href} className="text-blue-400 hover:text-blue-300 underline">{children}</a>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-600 pl-4 italic my-4">{children}</blockquote>,
              }}
            >
              {helpContent}
            </ReactMarkdown>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};