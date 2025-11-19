import React, { useState } from 'react';
import styles from './ControlsMenu.module.css';
import { KeywordTokenGrid } from '../KeywordTokenGrid';
import { KeywordTokenTemplate } from '../../modules/keywordTokens/types';

interface ControlsMenuProps {
  onScry: () => void;
  onAddCard: () => void;
  tokenTemplates?: KeywordTokenTemplate[]; // Allow customization
  tokenGridColumns?: number; // Grid columns configuration (default: 5)
  tokenGridRows?: number; // Grid rows configuration (auto if not specified)
  tokenGridGap?: number; // Gap between tokens (default: 12px)
}

// Default token templates - users can override via props
const DEFAULT_TOKEN_TEMPLATES: KeywordTokenTemplate[] = [
  {
    title: 'Deathtouch',
    imageUrl: '/assets/token_images/ability-deathtouch.svg',
    backgroundColor: '#ffffff',
    initialCount: 1,
  },
  {
    title: 'Deathtouch',
    imageUrl: '/assets/token_images/ability-deathtouch.svg',
    backgroundColor: '#ffffff',
    initialCount: 1,
  },
  {
    title: 'Deathtouch',
    imageUrl: '/assets/token_images/ability-deathtouch.svg',
    backgroundColor: '#ffffff',
    initialCount: 1,
  },
  {
    title: 'Deathtouch',
    imageUrl: '/assets/token_images/ability-deathtouch.svg',
    backgroundColor: '#ffffff',
    initialCount: 1,
  },
  {
    title: 'Deathtouch',
    imageUrl: '/assets/token_images/ability-deathtouch.svg',
    backgroundColor: '#ffffff',
    initialCount: 1,
  },
  {
    title: 'Deathtouch',
    imageUrl: '/assets/token_images/ability-deathtouch.svg',
    backgroundColor: '#ffffff',
    initialCount: 1,
  },
  {
    title: 'Deathtouch',
    imageUrl: '/assets/token_images/ability-deathtouch.svg',
    backgroundColor: '#ffffff',
    initialCount: 1,
  },
  {
    title: 'Deathtouch',
    imageUrl: '/assets/token_images/ability-deathtouch.svg',
    backgroundColor: '#ffffff',
    initialCount: 1,
  },
  {
    title: 'Deathtouch',
    imageUrl: '/assets/token_images/ability-deathtouch.svg',
    backgroundColor: '#ffffff',
    initialCount: 1,
  },
  // Add more default templates here as you create token images
];

export const ControlsMenu: React.FC<ControlsMenuProps> = ({
  onScry,
  onAddCard,
  tokenTemplates = DEFAULT_TOKEN_TEMPLATES,
  tokenGridColumns = 3,
  tokenGridRows,
  tokenGridGap = 12,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Delay closing to allow user to move to expanded menu
    closeTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200); // 200ms delay
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={styles.controlsContainer}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
          <KeywordTokenGrid
            templates={tokenTemplates}
            columns={tokenGridColumns}
            rows={tokenGridRows}
            gap={tokenGridGap}
          />
        </div>
      )}
    </div>
  );
};