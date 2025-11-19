import React, { useState } from 'react';
import styles from './ControlsMenu.module.css';

interface ControlsMenuProps {
  onScry: () => void;
  onAddCard: () => void;
}

export const ControlsMenu: React.FC<ControlsMenuProps> = ({
  onScry,
  onAddCard,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={styles.controlsContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.collapsedContent}>
        <button
          className="draw-button"
          onClick={onScry}
          title="Scry"
        >
          Scry
        </button>
        <button
          className="draw-button"
          onClick={onAddCard}
          title="Add Card (A)"
        >
          Add Card
        </button>
      </div>

      {isHovered && (
        <div className={styles.expandedContent}>
          {/* Empty for now - will be populated with additional controls later */}
        </div>
      )}
    </div>
  );
};