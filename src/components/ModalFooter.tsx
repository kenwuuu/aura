import React from 'react';

export interface ModalFooterButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  align?: 'left' | 'right';
}

interface ModalFooterProps {
  buttons: ModalFooterButton[];
  style?: React.CSSProperties;
}

const styles = {
  footer: {
    display: 'flex',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #3d3d3d',
    alignItems: 'center',
  } as React.CSSProperties,
  spacer: {
    flex: 1,
  } as React.CSSProperties,
  button: {
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid #3d3d3d',
  } as React.CSSProperties,
  buttonDefault: {
    backgroundColor: '#2d2d2d',
    color: '#ffffff',
  } as React.CSSProperties,
  buttonPrimary: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    color: '#ffffff',
  } as React.CSSProperties,
  buttonDanger: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
    color: '#ffffff',
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  } as React.CSSProperties,
};

export const ModalFooter: React.FC<ModalFooterProps> = ({ buttons, style }) => {
  const getButtonStyle = (button: ModalFooterButton): React.CSSProperties => {
    const baseStyle = { ...styles.button };

    if (button.variant === 'primary') {
      Object.assign(baseStyle, styles.buttonPrimary);
    } else if (button.variant === 'danger') {
      Object.assign(baseStyle, styles.buttonDanger);
    } else {
      Object.assign(baseStyle, styles.buttonDefault);
    }

    if (button.disabled) {
      Object.assign(baseStyle, styles.buttonDisabled);
    }

    return baseStyle;
  };

  const getHoverStyle = (button: ModalFooterButton): React.CSSProperties => {
    if (button.disabled) return {};

    if (button.variant === 'primary') {
      return { backgroundColor: '#2563eb', borderColor: '#2563eb' };
    } else if (button.variant === 'danger') {
      return { backgroundColor: '#b91c1c', borderColor: '#b91c1c' };
    } else {
      return { backgroundColor: '#3d3d3d', borderColor: '#4d4d4d' };
    }
  };

  // Group buttons by alignment
  const leftButtons = buttons.filter(b => b.align === 'left');
  const rightButtons = buttons.filter(b => !b.align || b.align === 'right');

  return (
    <div style={{ ...styles.footer, ...style }}>
      {leftButtons.map((button, index) => (
        <button
          key={`left-${index}`}
          onClick={button.onClick}
          disabled={button.disabled}
          style={getButtonStyle(button)}
          onMouseEnter={(e) => {
            if (!button.disabled) {
              Object.assign(e.currentTarget.style, getHoverStyle(button));
            }
          }}
          onMouseLeave={(e) => {
            if (!button.disabled) {
              Object.assign(e.currentTarget.style, getButtonStyle(button));
            }
          }}
        >
          {button.label}
        </button>
      ))}

      {leftButtons.length > 0 && rightButtons.length > 0 && (
        <div style={styles.spacer} />
      )}

      {rightButtons.map((button, index) => (
        <button
          key={`right-${index}`}
          onClick={button.onClick}
          disabled={button.disabled}
          style={getButtonStyle(button)}
          onMouseEnter={(e) => {
            if (!button.disabled) {
              Object.assign(e.currentTarget.style, getHoverStyle(button));
            }
          }}
          onMouseLeave={(e) => {
            if (!button.disabled) {
              Object.assign(e.currentTarget.style, getButtonStyle(button));
            }
          }}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
};
