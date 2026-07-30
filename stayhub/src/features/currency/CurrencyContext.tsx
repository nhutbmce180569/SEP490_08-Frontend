import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";

export type CurrencyMode = "VND" | "USD";

type ExchangeRateResponse = {
  rate?: number;
  date?: string;
};

type CurrencyContextValue = {
  mode: CurrencyMode;
  setMode: (mode: CurrencyMode) => void;
  toggleMode: () => void;
  usdToVndRate: number | null;
  rateDate: string | null;
  isRateLoading: boolean;
  isRateUnavailable: boolean;
};

const STORAGE_KEY = "stayhub_currency";
const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const getStoredCurrencyMode = (): CurrencyMode => {
  if (typeof window === "undefined") return "VND";
  return window.localStorage.getItem(STORAGE_KEY) === "USD" ? "USD" : "VND";
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const fetchUsdToVndRate = async (): Promise<ExchangeRateResponse> => {
  const response = await fetch("https://api.frankfurter.dev/v2/rate/USD/VND");
  if (!response.ok) {
    throw new Error("Unable to fetch exchange rate");
  }

  const data = (await response.json()) as ExchangeRateResponse;
  if (typeof data.rate !== "number" || !Number.isFinite(data.rate) || data.rate <= 0) {
    throw new Error("Invalid exchange rate");
  }

  return data;
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<CurrencyMode>(() => getStoredCurrencyMode());

  const exchangeRateQuery = useQuery({
    queryKey: ["exchange-rate", "USD", "VND", getTodayKey()],
    queryFn: fetchUsdToVndRate,
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    enabled: mode === "USD",
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = useCallback((next: CurrencyMode) => {
    setModeState(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => (current === "VND" ? "USD" : "VND"));
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode,
      usdToVndRate: exchangeRateQuery.data?.rate ?? null,
      rateDate: exchangeRateQuery.data?.date ?? null,
      isRateLoading: exchangeRateQuery.isLoading,
      isRateUnavailable: exchangeRateQuery.isError,
    }),
    [
      exchangeRateQuery.data?.date,
      exchangeRateQuery.data?.rate,
      exchangeRateQuery.isError,
      exchangeRateQuery.isLoading,
      mode,
      setMode,
      toggleMode,
    ],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
}
