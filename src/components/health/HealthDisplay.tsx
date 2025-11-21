import React, { useState } from 'react';
import { CustomCounter } from '@/modules/player/types';
import { PlayerCounterModal } from '../PlayerCounterModal';
import styles from './HealthDisplay.module.css';
import {EditableHealth} from "./EditableHealth";

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
  const [editableHealth, setEditableHealth] = useState(String(health));

  React.useEffect(() => {
    // Keep editable field in sync with external health changes
    setEditableHealth(String(health));
  }, [health]);

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

  const containerClass = variant === 'local' ? styles.healthContainer : styles.opponentHealth;
  const expandClass = variant === 'opponent' ? styles.expandLeft : styles.expandRight;

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
        className={`${containerClass} ${expandClass}`}
        data-player-id={playerId}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div className={styles.health}>
          <div className={variant === 'local' ? styles.healthLabel : styles.opponentHealthLabel}>
            {label}
          </div>
          <EditableHealth
            health={health}
            onModifyHealth={onModifyHealth}
            className={variant === 'local' ? styles.healthValue : styles.opponentHealthValue}
          />
          <div className={variant === 'local' ? styles.healthControls : styles.opponentHealthControls}>
            <button onClick={() => onModifyHealth(-1)}>-</button>
            <button onClick={() => onModifyHealth(1)}>+</button>
          </div>
        </div>

        {variant === 'opponent' && isHovered && (
          <>
            <div
              className="resource-pile hand-pile"
              onClick={allowViewHand ? onViewHand : undefined}
              style={{ cursor: allowViewHand ? 'pointer' : 'default', opacity: allowViewHand ? 1 : 0.7 }}
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
          <div className={styles.expandedContent}>
            {customCounters.map((counter) => (
              <div key={counter.id} className={styles.customCounter}>
                <span className={styles.counterIcon}>{counter.icon}</span>
                <div className={styles.counterInfo}>
                  <div className={styles.counterTitle}>{counter.title}</div>
                  <div className={styles.counterValue}>{counter.value}</div>
                </div>
                <div className={styles.counterControls}>
                  <button onClick={() => onModifyCounter?.(counter.id, -1)}>-</button>
                  <button onClick={() => onModifyCounter?.(counter.id, 1)}>+</button>
                </div>
                <button
                  className={styles.deleteButton}
                  onClick={() => onRemoveCounter?.(counter.id)}
                  title="Remove counter"
                >
                  ×
                </button>
              </div>
            ))}

            {onAddCounter && (
              <button
                className={styles.addCounterButton}
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