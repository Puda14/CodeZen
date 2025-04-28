"use client";

import { createContext, useState, useContext, useMemo } from "react";

const ContestContext = createContext({
  isInContest: false,
  setIsInContest: () => {},
  activeContestId: null,
  setActiveContestId: () => {},
  showContestReturnPopup: false,
  setShowContestReturnPopup: () => {},
});

export function ContestProvider({ children }) {
  const [isInContest, setIsInContest] = useState(false);
  const [activeContestId, setActiveContestId] = useState(null);
  const [showContestReturnPopup, setShowContestReturnPopup] = useState(false);

  const value = useMemo(
    () => ({
      isInContest,
      setIsInContest,
      activeContestId,
      setActiveContestId,
      showContestReturnPopup,
      setShowContestReturnPopup,
    }),
    [isInContest, activeContestId, showContestReturnPopup]
  );

  return (
    <ContestContext.Provider value={value}>{children}</ContestContext.Provider>
  );
}

export const useContest = () => {
  const context = useContext(ContestContext);
  if (context === undefined) {
    throw new Error("useContest must be used within a ContestProvider");
  }
  return context;
};
