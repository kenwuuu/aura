import { createContext, useContext } from 'react';
import { TooltipManager } from '@/modules/whiteboard/TooltipManager';

/**
 * Context for sharing the TooltipManager across the app
 * Avoids prop drilling through multiple component layers
 */
const TooltipContext = createContext<TooltipManager | null>(null);

export const TooltipProvider = TooltipContext.Provider;

/**
 * Hook to access the TooltipManager from any component
 * Returns null if used outside of TooltipProvider
 */
export const useTooltipManager = (): TooltipManager | null => {
  return useContext(TooltipContext);
};
