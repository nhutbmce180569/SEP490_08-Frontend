import { useState, useEffect, useCallback } from "react";
import { systemService } from "../services/system.service";
import { useLocale } from "../../../contexts/LocaleContext";
import type { SystemSettingDTO } from "../types/system";

export const useSystemSettings = () => {
  const { locale } = useLocale();
  const [settings, setSettings] = useState<SystemSettingDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await systemService.getAllSettings();
      setSettings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load system settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = (key: string): string => {
    return settings.find((s) => s.settingKey === key)?.settingValue || "";
  };

  const getLocalizedSetting = (key: string, currentLocale: string = locale): string => {
    if (currentLocale === "en") {
      const enSetting = settings.find((s) => s.settingKey === `${key}_en`)?.settingValue;
      if (enSetting) return enSetting;
    }
    return settings.find((s) => s.settingKey === key)?.settingValue || "";
  };

  return { settings, getSetting, getLocalizedSetting, isLoading, error, refetch: fetchSettings };
};
