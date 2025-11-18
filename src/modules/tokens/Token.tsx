import React, { useEffect, useRef } from 'react';
import { Token } from './types';

interface TokenElementProps {
  token: Token;
  width: number;
  height: number;
  onUpdate: (token: Token) => void;
  onDelete: (tokenId: string) => void;
  onKeyDown?: (tokenId: string, key: string) => void;
  isHovered?: boolean;
}

export const TokenElement: React.FC<TokenElementProps> = ({
  token,
  width,
  height,
  onUpdate,
  onDelete,
  onKeyDown,
  isHovered = false,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);

  const incrementCount = () => {
    onUpdate({
      ...token,
      count: token.count + 1,
    });
  };

  const decrementCount = () => {
    if (token.count > 0) {
      onUpdate({
        ...token,
        count: token.count - 1,
      });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    incrementCount();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    decrementCount();
  };

  // Handle keyboard events when this token is hovered
  useEffect(() => {
    if (!isHovered || !onKeyDown) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      onKeyDown(token.id, e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovered, token.id, onKeyDown]);

  return (
    <div
      ref={elementRef}
      className="token"
      data-token-id={token.id}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{
        position: 'absolute',
        width: `${width}px`,
        height: `${height}px`,
        left: `${token.x}px`,
        top: `${token.y}px`,
        zIndex: token.zIndex,
        cursor: 'grab',
      }}
    >
      <img
        src={token.imageUrl}
        alt="token"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        draggable={false}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '0 0 4px black, 0 0 8px black',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {token.count}
      </div>
    </div>
  );
};