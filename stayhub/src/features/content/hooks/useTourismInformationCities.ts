import { useState, useEffect } from "react";
import { tourismInformationService } from "../services/tourismInformation.service";

export const useTourismInformationCities = () => {
  const [cities, setCities] = useState<{ label: string; value: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCities = async () => {
      setIsLoading(true);
      try {
        const distinctCities = await tourismInformationService.getAllDistinctCities();
        const options = distinctCities.map(c => ({ label: c, value: c }));
        if (!cancelled) {
          setCities(options);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load cities");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchCities();

    return () => {
      cancelled = true;
    };
  }, []);

  return { cities, isLoading, error };
};
