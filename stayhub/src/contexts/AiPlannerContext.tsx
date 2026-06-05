import React, { createContext, useCallback, useContext, useState } from "react";

interface AiPlannerContextValue {
  isOpen: boolean;
  /** Path user was on when opening the planner (for legacy /ai-assistant route shim). */
  openerPath: string | null;
  open: (fromPath?: string) => void;
  close: () => void;
}

const AiPlannerContext = createContext<AiPlannerContextValue>({
  isOpen: false,
  openerPath: null,
  open: () => {},
  close: () => {},
});

export const AiPlannerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openerPath, setOpenerPath] = useState<string | null>(null);

  const open = useCallback((fromPath?: string) => {
    if (fromPath) setOpenerPath(fromPath);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <AiPlannerContext.Provider value={{ isOpen, openerPath, open, close }}>
      {children}
    </AiPlannerContext.Provider>
  );
};

export const useAiPlanner = () => useContext(AiPlannerContext);
