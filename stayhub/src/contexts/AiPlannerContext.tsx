import React, { createContext, useCallback, useContext, useState } from "react";

interface AiPlannerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const AiPlannerContext = createContext<AiPlannerContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export const AiPlannerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <AiPlannerContext.Provider value={{ isOpen, open, close }}>
      {children}
    </AiPlannerContext.Provider>
  );
};

export const useAiPlanner = () => useContext(AiPlannerContext);
