import React, { createContext, useCallback, useContext, useState } from "react";

interface TourAssistantChatContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const TourAssistantChatContext = createContext<TourAssistantChatContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export const TourAssistantChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <TourAssistantChatContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </TourAssistantChatContext.Provider>
  );
};

export const useTourAssistantChatState = () => useContext(TourAssistantChatContext);
