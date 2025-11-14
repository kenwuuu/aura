import React from 'react';
import { getAllHotkeysWithLongDescriptions } from '../data/hotkeys';

interface HotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeysModal: React.FC<HotkeysModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Get hotkeys from centralized data source
  const hotkeys = getAllHotkeysWithLongDescriptions();

  // Split into two columns
  const mid = Math.ceil(hotkeys.length / 2);
  const leftColumn = hotkeys.slice(0, mid);
  const rightColumn = hotkeys.slice(mid);

  // Media query for mobile responsiveness
  const isMobile = window.innerWidth <= 768;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-[900px] w-[95%]" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="flex flex-col">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 bg-slate-950 text-gray-400 text-xs font-bold uppercase tracking-wider border-b-2 border-slate-700">Key</th>
                    <th className="text-left px-4 py-3 bg-slate-950 text-gray-400 text-xs font-bold uppercase tracking-wider border-b-2 border-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leftColumn.map((hotkey, index) => (
                    <tr key={index} className="border-b border-slate-800">
                      <td className="px-4 py-3 font-mono font-bold text-sky-500 text-sm min-w-[80px]">{hotkey.key}</td>
                      <td className="px-4 py-3 text-gray-200 text-sm">{hotkey.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 bg-slate-950 text-gray-400 text-xs font-bold uppercase tracking-wider border-b-2 border-slate-700">Key</th>
                    <th className="text-left px-4 py-3 bg-slate-950 text-gray-400 text-xs font-bold uppercase tracking-wider border-b-2 border-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rightColumn.map((hotkey, index) => (
                    <tr key={index} className="border-b border-slate-800">
                      <td className="px-4 py-3 font-mono font-bold text-sky-500 text-sm min-w-[80px]">{hotkey.key}</td>
                      <td className="px-4 py-3 text-gray-200 text-sm">{hotkey.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
