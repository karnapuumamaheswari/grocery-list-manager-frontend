import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface AppContextValue {
  sessionTimeoutMinutes: number;
  setSessionTimeoutMinutes: (value: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState<number>(
    Number(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES ?? "60"),
  );

  const value = useMemo(
    () => ({ sessionTimeoutMinutes, setSessionTimeoutMinutes }),
    [sessionTimeoutMinutes],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return context;
}

