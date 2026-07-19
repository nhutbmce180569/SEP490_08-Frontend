import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "../../../contexts/LocaleContext";

export const useCountries = () => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { locale } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    const fetchCountries = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("https://countriesnow.space/api/v0.1/countries/states");
        if (!response.ok) {
          throw new Error("Failed to fetch countries");
        }
        const payload = await response.json();
        
        if (!cancelled) {
          setRawData(payload.data || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load countries");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchCountries();

    return () => {
      cancelled = true;
    };
  }, []);

  const countries = useMemo(() => {
    let regionNames: Intl.DisplayNames | null = null;
    try {
      regionNames = new Intl.DisplayNames([locale], { type: 'region' });
    } catch (e) {
      console.warn("Intl.DisplayNames not supported");
    }

    const options = rawData.map((c) => {
      let localizedName = c.name;
      if (c.iso2 && regionNames) {
        try {
          localizedName = regionNames.of(c.iso2) || c.name;
        } catch (e) {
          // Ignore invalid iso codes
        }
      }
      return {
        label: localizedName,
        value: c.name, // Keep the value as the English name for consistency in the DB
      };
    });

    // Sort alphabetically by localized label
    options.sort((a, b) => a.label.localeCompare(b.label));

    return options;
  }, [rawData, locale]);

  return { countries, isLoading, error };
};
