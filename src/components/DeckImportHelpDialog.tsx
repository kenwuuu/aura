import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface DeckImportHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}


export function DeckImportHelpDialog({ isOpen, onClose }: DeckImportHelpDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-[10001] animate-[fadeIn_150ms_ease-out]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 border border-slate-800 rounded-lg p-6 max-w-[500px] max-h-[85vh] overflow-auto z-[10002] animate-[slideIn_200ms_ease-out]">
          <Dialog.Title className="text-slate-50 text-lg font-semibold mb-4 mt-0">Deck Import Guide</Dialog.Title>
          <Dialog.Close className="absolute top-4 right-4 w-8 h-8 rounded border-none bg-transparent text-slate-400 text-xl cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-slate-800 hover:text-slate-50" onClick={(e) => { e.stopPropagation(); onClose(); }}>×</Dialog.Close>

          <div className="mb-5">
            <div className="text-sky-400 text-sm font-semibold mb-2 uppercase tracking-wider">Recommended Format</div>
            <p className="text-slate-300 text-sm leading-relaxed mb-2">
              For best results, use the <strong className="text-slate-50">MTGO preset</strong> from Moxfield's download button:
            </p>
            <div className="bg-slate-900 border border-slate-700 rounded px-3 py-3 text-[13px] font-mono text-slate-200 whitespace-pre-wrap mb-2">
              4 Lightning Bolt{'\n'}
              20 Mountain{'\n'}
              1 Bonfire of the Damned
            </div>
          </div>

          <div className="mb-5">
            <div className="text-sky-400 text-sm font-semibold mb-2 uppercase tracking-wider">Not Supported</div>
            <p className="text-slate-300 text-sm leading-relaxed mb-2">We don't support section headers like SIDEBOARD or COMMANDER:</p>
            <div className="bg-slate-900 border border-slate-700 rounded px-3 py-3 text-[13px] font-mono text-slate-200 whitespace-pre-wrap mb-2">
              {`1 Zuran Orb

SIDEBOARD:
1 Drill Too Deep
4 Pygmy Pyrosaur

COMMANDER:
1 Flubs, the Fool`}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-2">
              Remove these headers before importing or the cards below them won't be recognized.
            </p>
          </div>

          <div className="mb-5">
            <div className="text-sky-400 text-sm font-semibold mb-2 uppercase tracking-wider">Supported Formats</div>
            <ul className="text-slate-300 text-sm leading-relaxed ml-5 mb-2">
              <li>Simple quantity + name format (e.g., "4 Lightning Bolt")</li>
              {/*<li>Set codes in parentheses (e.g., "4 Lightning Bolt (M10)")</li>*/}
              <li>Blank lines between cards (ignored)</li>
            </ul>
          </div>

          <button className="mt-4 w-full px-4 py-2.5 text-sm font-semibold rounded-md border border-sky-500 bg-sky-500 text-slate-950 cursor-pointer transition-all duration-150 hover:bg-sky-400" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            Got it
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}