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
    title: 'DEATHTOUCH',
    imageUrl: '/assets/token_images/ability-deathtouch.svg',
    backgroundColor: '#a69f9d',
  },
  {
    title: 'DEFENDER',
    imageUrl: '/assets/token_images/ability-defender.svg',
    backgroundColor: '#b3ceea',
  },
  {
    title: 'DOUBLE STRIKE',
    imageUrl: '/assets/token_images/ability-doublestrike.svg',
    backgroundColor: '#f8e7b9',
  },
  {
    title: 'FIRST STRIKE',
    imageUrl: '/assets/token_images/ability-firststrike.svg',
    backgroundColor: '#f8e7b9',
  },
  {
    title: 'FLYING',
    imageUrl: '/assets/token_images/ability-flying.svg',
    backgroundColor: '#f8e7b9',
  },
  {
    title: 'GOAD',
    imageUrl: '/assets/token_images/ability-goad.svg',
    backgroundColor: '#eba082',
  },
  {
    title: 'HASTE',
    imageUrl: '/assets/token_images/ability-haste.svg',
    backgroundColor: '#eba082',
  },
  {
    title: 'HEXPROOF',
    imageUrl: '/assets/token_images/ability-hexproof.svg',
    backgroundColor: '#c4d3ca',
  },
  {
    title: 'INDESTRUCTIBLE',
    imageUrl: '/assets/token_images/ability-indestructible.svg',
    backgroundColor: '#f8e7b9',
  },
  {
    title: 'LIFELINK',
    imageUrl: '/assets/token_images/ability-lifelink.svg',
    backgroundColor: '#f8e7b9',
  },
  {
    title: 'MENACE',
    imageUrl: '/assets/token_images/ability-menace.svg',
    backgroundColor: '#eba082',
  },
  {
    title: 'REACH',
    imageUrl: '/assets/token_images/ability-reach.svg',
    backgroundColor: '#c4d3ca',
  },
  {
    title: 'TRAMPLE',
    imageUrl: '/assets/token_images/ability-trample.svg',
    backgroundColor: '#c4d3ca',
  },
  {
    title: 'VIGILANCE',
    imageUrl: '/assets/token_images/ability-vigilance.svg',
    backgroundColor: '#f8e7b9',
    count: undefined,
  },
  {
    title: 'Black',
    imageUrl: '/assets/token_images/b.svg',
    backgroundColor: '#a69f9d',
    count: 1,
  },
  {
    title: 'Green',
    imageUrl: '/assets/token_images/g.svg',
    backgroundColor: '#c4d3ca',
    count: 1,
  },
  {
    title: 'Red',
    imageUrl: '/assets/token_images/r.svg',
    backgroundColor: '#eba082',
    count: 1,
  },
  {
    title: 'Blue',
    imageUrl: '/assets/token_images/u.svg',
    backgroundColor: '#b3ceea',
    count: 1,
  },
  {
    title: 'White',
    imageUrl: '/assets/token_images/w.svg',
    backgroundColor: '#f8e7b9',
    count: 1,
  },
  {
    title: 'Colorless',
    imageUrl: '/assets/token_images/c.svg',
    backgroundColor: '#e8e1df',
    count: 1,
  },
  {
    title: 'TOKEN_IMAGES',
    imageUrl: '',
    backgroundColor: '#e8e1df',
    count: 1,
  },
  // Add more default templates here as you create token images
];

const closeDelay = 200;

// Read fade duration from CSS variable
const getFadeDuration = (): number => {
  const duration = getComputedStyle(document.documentElement)
    .getPropertyValue('--fade-duration')
    .trim();
  // Parse CSS time value (e.g., "300ms" -> 300)
  return parseInt(duration) || 300; // Fallback to 300ms
};

export const ControlsMenu: React.FC<ControlsMenuProps> = ({
  onScry,
  onAddCard,
  tokenTemplates = DEFAULT_TOKEN_TEMPLATES,
  tokenGridColumns = 7,
  tokenGridRows,
  tokenGridGap = 12,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const fadeDurationRef = React.useRef<number>(getFadeDuration());

  const handleMouseEnter = () => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsClosing(false);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Delay closing to allow user to move to expanded menu
    closeTimeoutRef.current = setTimeout(() => {
      startClosing();
    }, closeDelay); // 200ms delay
  };

  const startClosing = () => {
    setIsClosing(true);
    // After fade-down animation completes, actually hide the menu
    setTimeout(() => {
      setIsHovered(false);
      setIsClosing(false);
    }, fadeDurationRef.current); // Match fadeDown animation duration from CSS
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
        <div className={styles.hoverIndicator}>
          <svg
            width="20"
            height="12"
            viewBox="0 0 20 12"
            fill="none"
            className={styles.arrowIcon}
          >
            <path
              d="M10 2L15 8H5L10 2Z"
              fill="currentColor"
              opacity="0.6"
            />
          </svg>
        </div>
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

      {(isHovered || isClosing) && (
        <div className={`${styles.expandedContent} ${isClosing ? styles.closing : ''}`}>
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