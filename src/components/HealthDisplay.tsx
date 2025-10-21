import React, { useState } from 'react';
import { CustomCounter } from '../modules/player/types';
import { CounterModal } from './CounterModal';
import styles from './HealthDisplay.module.css';

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
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
        <div className={variant === 'local' ? styles.healthLabel : styles.opponentHealthLabel}>
          {label}
        </div>
        <div className={variant === 'local' ? styles.healthValue : styles.opponentHealthValue}>
          {health}
        </div>
        <div className={variant === 'local' ? styles.healthControls : styles.opponentHealthControls}>
          <button onClick={() => onModifyHealth(-1)}>-</button>
          <button onClick={() => onModifyHealth(1)}>+</button>
        </div>

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
        <CounterModal
          onAdd={handleAddCounter}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
};