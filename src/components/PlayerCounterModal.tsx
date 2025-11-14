import React, { useState, useEffect } from 'react';

interface CounterModalProps {
  onAdd: (title: string, icon: string) => void;
  onCancel: () => void;
  openedFromBottom: boolean;
}

const COMMON_ICONS = ['☠️', '⚡', '🔥', '🩸', '☢️', '⭐', '💎', '👑', '⚔️', '🛡️'];

export const PlayerCounterModal: React.FC<CounterModalProps> = ({ onAdd, onCancel, openedFromBottom }) => {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('☠️');
  const [customIcon, setCustomIcon] = useState('');

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), customIcon || icon);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000]" onClick={onCancel}>
      <div 
        className={`bg-slate-950 border border-slate-800 rounded-xl p-6 w-[90%] max-w-[450px] ${openedFromBottom ? 'fixed left-1/2 -translate-x-1/2 -translate-y-1/2' : '-translate-y-[10%]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white m-0 mb-5 text-center">Add Custom Counter</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Title</label>
            <input
              type="text"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-50 text-sm transition-all duration-150 focus:outline-none focus:border-emerald-500 focus:bg-slate-950 placeholder:text-slate-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Poison, Energy, Experience"
              autoFocus
              maxLength={20}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Icon (select or enter custom)</label>
            <div className="grid grid-cols-5 gap-2">
              {COMMON_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`aspect-square bg-slate-900 border border-slate-700 rounded-lg text-2xl cursor-pointer transition-all duration-150 flex items-center justify-center hover:bg-slate-800 hover:border-slate-500 hover:scale-105 ${icon === emoji && !customIcon ? 'bg-emerald-500 border-emerald-500 text-slate-950' : ''}`}
                  onClick={() => {
                    setIcon(emoji);
                    setCustomIcon('');
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-50 text-sm transition-all duration-150 focus:outline-none focus:border-emerald-500 focus:bg-slate-950 placeholder:text-slate-500"
              value={customIcon}
              onChange={(e) => setCustomIcon(e.target.value)}
              placeholder="Or enter custom emoji"
              maxLength={2}
            />
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col gap-3 items-center">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Preview:</div>
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg">
              <span className="text-xl w-7 text-center">{customIcon || icon}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider flex-1">{title || 'Counter'}</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">0</span>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button 
              type="button" 
              className="flex-1 px-3 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-150 border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-3 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-150 border-none bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed" 
              disabled={!title.trim()}
            >
              Add Counter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};