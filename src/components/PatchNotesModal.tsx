import React, { useMemo } from 'react';
import { marked } from 'marked';
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

// Configure custom renderer with inline styles
const renderer = new marked.Renderer();

renderer.heading = ({ tokens, depth }) => {
  const text = tokens.map(t => t.raw).join('');
  const styles: Record<number, string> = {
    1: 'font-size: 28px; font-weight: bold; margin-bottom: 16px; margin-top: 24px; color: #f9fafb; border-bottom: 2px solid #3d3d3d; padding-bottom: 8px;',
    2: 'font-size: 22px; font-weight: bold; margin-bottom: 12px; color: #60a5fa;',
    3: 'font-size: 18px; font-weight: bold; margin-bottom: 10px; margin-top: 20px; color: #f3f4f6;',
  };
  return `<h${depth} style="${styles[depth] || ''}">${text}</h${depth}>`;
};

renderer.paragraph = ({ tokens }) => {
  const text = tokens.map(t => t.raw).join('');
  return `<p style="margin-bottom: 12px;">${text}</p>`;
};

renderer.list = ({ ordered, items }) => {
  const tag = ordered ? 'ol' : 'ul';
  const itemsHtml = items.map(item => {
    // Parse the tokens properly to render inline formatting
    const content = marked.parser(item.tokens);
    return `<li style="margin-bottom: 8px;">${content}</li>`;
  }).join('');
  return `<${tag} style="margin-bottom: 16px; padding-left: 24px;">${itemsHtml}</${tag}>`;
};

renderer.listitem = ({ text }) => {
  // This won't be called since we handle it in the list renderer
  return `<li style="margin-bottom: 8px;">${text}</li>`;
};

renderer.strong = ({ tokens }) => {
  const text = tokens.map(t => t.raw).join('');
  return `<strong style="font-weight: bold; color: #60a5fa;">${text}</strong>`;
};

renderer.codespan = ({ text }) => {
  return `<code style="background-color: #1f2937; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 13px; color: #10b981;">${text}</code>`;
};

renderer.code = ({ text }) => {
  return `<pre style="background-color: #1f2937; padding: 12px; border-radius: 8px; overflow-x: auto; margin-bottom: 16px;"><code>${text}</code></pre>`;
};

renderer.hr = () => {
  return `<hr style="margin-bottom: 20px; border: none; border-top: 1px solid #3d3d3d;">`;
};

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer,
});

export const PatchNotesModal: React.FC<PatchNotesModalProps> = ({ isOpen, onClose }) => {
  // Parse markdown to HTML using marked
  const htmlContent = useMemo(() => marked.parse(patchNotesContent), []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px] w-[95%] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Patch Notes</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] px-1">
          <div
            className="text-sm leading-relaxed text-gray-300"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};