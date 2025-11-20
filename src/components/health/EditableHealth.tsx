import React, { useState, useEffect } from 'react';
import ContentEditable from 'react-contenteditable';

interface EditableHealthProps {
  health: number;
  className?: string;
  onModifyHealth: (delta: number) => void;
}

export const EditableHealth: React.FC<EditableHealthProps> = ({
                                                                health,
                                                                className,
                                                                onModifyHealth,
                                                              }) => {
  const [editableHealth, setEditableHealth] = useState(String(health));

  useEffect(() => {
    // keep synced with parent
    setEditableHealth(String(health));
  }, [health]);

  const handleChange = (e: any) => {
    const text = e.target.value.replace(/[^0-9\-]/g, '');
    setEditableHealth(text);
  };

  const handleBlur = (e: any) => {
    const text = e.target.innerText.replace(/[^0-9\-]/g, '');
    const newValue = parseInt(text, 10);

    if (!isNaN(newValue) && newValue !== health) {
      onModifyHealth(newValue - health);
    }

    // reset to authoritative value
    setEditableHealth(String(health));
  };

  return (
    <ContentEditable
      className={className}
      html={editableHealth}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
      tagName="div"
    />
  );
};
