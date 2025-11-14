import React, { useMemo } from 'react';
import { marked } from 'marked';
import patchNotesContent from '../content/patchNotes.md?raw';

interface PatchNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}


// Configure custom renderer with Tailwind classes
const renderer = new marked.Renderer();

renderer.heading = ({ tokens, depth }) => {
  const text = tokens.map(t => t.raw).join('');
  return `<h${depth}>${text}</h${depth}>`;
};

renderer.paragraph = ({ tokens }) => {
  const text = tokens.map(t => t.raw).join('');
  return `<p>${text}</p>`;
};

renderer.list = ({ ordered, items }) => {
  const tag = ordered ? 'ol' : 'ul';
  const itemsHtml = items.map(item => {
    // Parse the tokens properly to render inline formatting
    const content = marked.parser(item.tokens);
    return `<li>${content}</li>`;
  }).join('');
  return `<${tag}>${itemsHtml}</${tag}>`;
};

renderer.listitem = ({ text }) => {
  // This won't be called since we handle it in the list renderer
  return `<li>${text}</li>`;
};

renderer.strong = ({ tokens }) => {
  const text = tokens.map(t => t.raw).join('');
  return `<strong>${text}</strong>`;
};

renderer.codespan = ({ text }) => {
  return `<code>${text}</code>`;
};

renderer.code = ({ text }) => {
  return `<pre><code>${text}</code></pre>`;
};

renderer.hr = () => {
  return `<hr>`;
};

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer,
});

export const PatchNotesModal: React.FC<PatchNotesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Parse markdown to HTML using marked
  const htmlContent = useMemo(() => marked.parse(patchNotesContent), []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-[700px] w-[95%] max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            Patch Notes
          </h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="max-h-[65vh] overflow-y-scroll px-1">
            <div
              className="markdown-content text-sm leading-relaxed text-gray-200"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};