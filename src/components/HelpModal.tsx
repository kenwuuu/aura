import React, { useMemo } from 'react';
import { marked } from 'marked';
import helpContent from '../content/help.md?raw';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const styles = {
  modal: {
    maxWidth: '800px',
    width: '95%',
    maxHeight: '80vh',
  } as React.CSSProperties,
  content: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#e5e7eb',
  } as React.CSSProperties,
  scrollContainer: {
    maxHeight: '65vh',
    overflowY: 'auto',
    padding: '0 4px',
  } as React.CSSProperties,
};

// Configure custom renderer with inline styles
const renderer = new marked.Renderer();

renderer.heading = ({ tokens, depth }) => {
  const text = tokens.map(t => t.raw).join('');
  const styles: Record<number, string> = {
    1: 'font-size: 28px; font-weight: bold; margin-bottom: 16px; margin-top: 24px; color: #f9fafb; border-bottom: 2px solid #3d3d3d; padding-bottom: 8px;',
    2: 'font-size: 22px; font-weight: bold; margin-bottom: 12px; margin-top: 24px; color: #f3f4f6;',
    3: 'font-size: 18px; font-weight: bold; margin-bottom: 10px; margin-top: 20px; color: #d0d0d0;',
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

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Parse markdown to HTML using marked
  const htmlContent = useMemo(() => marked.parse(helpContent), []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Help & Instructions</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div style={styles.scrollContainer}>
            <div
              className="markdown-content"
              style={styles.content}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};