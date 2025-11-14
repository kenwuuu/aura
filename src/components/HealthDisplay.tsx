import React, { useState } from 'react';
import { CustomCounter } from '../modules/player/types';
import { PlayerCounterModal } from './PlayerCounterModal';

interface HealthDisplayProps {
  label: string;
  health: number;
  onModifyHealth: (delta: number) => void;
  variant?: 'local' | 'opponent';
  playerId?: string;
  customCounters?: CustomCounter[];
  onAddCounter?: (title: string, icon: string) => void;
  onModifyCounter?: (counterId: string, delta: number) => void;
  onRemoveCounter?: (counterId: string) => void;
  exileCount?: number;
  discardCount?: number;
  handCount?: number;
  allowViewHand?: boolean;
  onViewExile?: () => void;
  onViewDiscard?: () => void;
  onViewHand?: () => void;
}

export const HealthDisplay: React.FC<HealthDisplayProps> = ({
  label,
  health,
  onModifyHealth,
  variant = 'local',
  playerId,
  customCounters = [],
  onAddCounter,
  onModifyCounter,
  onRemoveCounter,
  exileCount = 0,
  discardCount = 0,
  handCount = 0,
  allowViewHand = false,
  onViewExile,
  onViewDiscard,
  onViewHand,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Emit modal open/close event. Used for hiding hotkey tooltip
  React.useEffect(() => {
    if (showModal) {
      window.dispatchEvent(new CustomEvent('modalOpen'));
    } else {
      window.dispatchEvent(new CustomEvent('modalClosed'));
    }
  }, [showModal]);

  const handleAddCounter = (title: string, icon: string) => {
    onAddCounter?.(title, icon);
    setShowModal(false);
  };

  const containerClass = variant === 'local' 
    ? 'bg-slate-950 border border-emerald-500 rounded-lg px-4 py-3 flex flex-row-reverse items-center gap-2 w-fit transition-all duration-200 cursor-pointer min-h-[132px]' 
    : 'bg-slate-950/90 border border-red-500 rounded-lg px-4 py-3 flex flex-row-reverse items-center gap-2 transition-all duration-200 min-h-[132px] w-fit';

  const handleMouseEnter = () => {
    setIsHovered(true);

    // Emit custom event for opponent board opacity control
    if (variant === 'opponent' && playerId) {
      window.dispatchEvent(new CustomEvent('opponentBoardHover', {
        detail: { playerId, isHovered: true }
      }));
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);

    // Emit custom event for opponent board opacity control
    if (variant === 'opponent' && playerId) {
      window.dispatchEvent(new CustomEvent('opponentBoardHover', {
        detail: { playerId, isHovered: false }
      }));
    }
  };

  const handleClick = () => {
    // Emit custom event for pinning opponent board
    if (variant === 'opponent' && playerId) {
      window.dispatchEvent(new CustomEvent('opponentBoardPin', {
        detail: { playerId }
      }));
    }
  };

  return (
    <>
      <div
        className={containerClass}
        data-player-id={playerId}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center min-w-[96px]">
          <div className={variant === 'local' 
            ? 'text-[11px] text-gray-400 uppercase tracking-wider' 
            : 'text-[11px] text-gray-400 uppercase tracking-wider mb-1'}>
            {label}
          </div>
          <div className={variant === 'local' 
            ? 'text-[36px] font-bold text-emerald-400 font-mono' 
            : 'text-[32px] font-bold text-red-500 font-mono'}>
            {health}
          </div>
          <div className={variant === 'local' 
            ? 'flex gap-2' 
            : 'flex gap-2 mt-2'}>
            <button 
              onClick={() => onModifyHealth(-1)}
              className={variant === 'local'
                ? 'w-8 h-8 bg-slate-900 border border-slate-700 rounded-md text-slate-50 text-lg cursor-pointer transition-all duration-150 hover:bg-slate-800 hover:border-slate-500 active:bg-slate-950'
                : 'w-7 h-7 bg-red-500/20 border border-red-500/40 rounded-md text-red-500 text-base cursor-pointer transition-all duration-200 hover:bg-red-500/30 hover:border-red-400 active:bg-red-500/40'}
            >-</button>
            <button 
              onClick={() => onModifyHealth(1)}
              className={variant === 'local'
                ? 'w-8 h-8 bg-slate-900 border border-slate-700 rounded-md text-slate-50 text-lg cursor-pointer transition-all duration-150 hover:bg-slate-800 hover:border-slate-500 active:bg-slate-950'
                : 'w-7 h-7 bg-red-500/20 border border-red-500/40 rounded-md text-red-500 text-base cursor-pointer transition-all duration-200 hover:bg-red-500/30 hover:border-red-400 active:bg-red-500/40'}
            >+</button>
          </div>
        </div>

        {variant === 'opponent' && isHovered && (
          <>
            <div
              className={`resource-pile hand-pile ${allowViewHand ? 'cursor-pointer opacity-100' : 'cursor-default opacity-70'}`}
              onClick={allowViewHand ? onViewHand : undefined}
            >
              <div className="pile-label">Hand</div>
              <div className="pile-count">{handCount}</div>
            </div>
            <div className="resource-pile exile-pile" onClick={onViewExile}>
              <div className="pile-label">Exile</div>
              <div className="pile-count">{exileCount}</div>
            </div>
            <div className="resource-pile discard-pile" onClick={onViewDiscard}>
              <div className="pile-label">Discard</div>
              <div className="pile-count">{discardCount}</div>
            </div>
          </>
        )}

        {isHovered && (
          <div className={`grid grid-flow-col grid-rows-2 gap-2 w-full overflow-hidden transition-all duration-300 ${variant === 'opponent' ? 'rtl [&>*]:ltr' : 'ltr'}`}>
            {customCounters.map((counter) => (
              <div 
                key={counter.id} 
                className={`flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg min-w-[140px] ${variant === 'opponent' ? 'bg-red-500/15 border-red-500/30' : ''}`}
              >
                <span className="text-lg w-6 text-center">{counter.icon}</span>
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">{counter.title}</div>
                  <div className={`text-lg font-bold font-mono ${variant === 'opponent' ? 'text-red-500' : 'text-green-500'}`}>{counter.value}</div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => onModifyCounter?.(counter.id, -1)}
                    className="w-6 h-6 bg-slate-950 border border-slate-700 rounded text-slate-50 text-sm cursor-pointer transition-all duration-150 flex items-center justify-center hover:bg-slate-800 hover:border-slate-500"
                  >-</button>
                  <button 
                    onClick={() => onModifyCounter?.(counter.id, 1)}
                    className="w-6 h-6 bg-slate-950 border border-slate-700 rounded text-slate-50 text-sm cursor-pointer transition-all duration-150 flex items-center justify-center hover:bg-slate-800 hover:border-slate-500"
                  >+</button>
                </div>
                <button
                  className="w-6 h-6 bg-transparent border border-slate-700 rounded text-red-400 text-base cursor-pointer transition-all duration-150 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500"
                  onClick={() => onRemoveCounter?.(counter.id)}
                  title="Remove counter"
                >
                  ×
                </button>
              </div>
            ))}

            {onAddCounter && (
              <button
                className={`w-9 h-9 bg-slate-900 border border-dashed border-slate-700 rounded-lg text-slate-400 text-xl cursor-pointer transition-all duration-150 flex items-center justify-center col-span-2 self-center ${variant === 'opponent' ? 'hover:bg-red-500/20 hover:border-red-500 hover:text-red-500 border-red-500/40' : 'hover:bg-slate-800 hover:border-emerald-500 hover:text-emerald-400'}`}
                onClick={() => setShowModal(true)}
                title="Add custom counter"
              >
                +
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <PlayerCounterModal
          onAdd={handleAddCounter}
          onCancel={() => setShowModal(false)}
          openedFromBottom={variant === 'local'}
        />
      )}
    </>
  );
};