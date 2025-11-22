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

// Configure custom renderer using Tailwind-compatible class names
const renderer = new marked.Renderer();

renderer.heading = ({ tokens, depth }) => {
  const text = tokens.map(t => t.raw).join('');
  const classes: Record<number, string> = {
    1: 'help-h1',
    2: 'help-h2',
    3: 'help-h3',
  };
  return `<h${depth} class="${classes[depth] || ''}">${text}</h${depth}>`;
};

renderer.paragraph = ({ tokens }) => {
  const text = tokens.map(t => t.raw).join('');
  return `<p class="help-p">${text}</p>`;
};

renderer.list = ({ ordered, items }) => {
  const tag = ordered ? 'ol' : 'ul';
  const itemsHtml = items.map(item => {
    // Parse the tokens properly to render inline formatting
    const content = marked.parser(item.tokens);
    return `<li class="help-li">${content}</li>`;
  }).join('');
  return `<${tag} class="help-list">${itemsHtml}</${tag}>`;
};

renderer.listitem = ({ text }) => {
  // This won't be called since we handle it in the list renderer
  return `<li class="help-li">${text}</li>`;
};

renderer.strong = ({ tokens }) => {
  const text = tokens.map(t => t.raw).join('');
  return `<strong class="help-strong">${text}</strong>`;
};

renderer.codespan = ({ text }) => {
  return `<code class="help-code">${text}</code>`;
};

renderer.code = ({ text }) => {
  return `<pre class="help-pre"><code>${text}</code></pre>`;
};

renderer.hr = () => {
  return `<hr class="help-hr">`;
};

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer,
});

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  // Parse markdown to HTML using marked
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
              className="text-sm leading-relaxed text-[#e5e7eb]"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};