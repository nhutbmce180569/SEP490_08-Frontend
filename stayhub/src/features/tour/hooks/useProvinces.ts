import { useState, useEffect } from "react";

export interface Province {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  phone_code: number;
}

export const useProvinces = () => {
  const [provinces, setProvinces] = useState<{ label: string; value: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProvinces = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("https://provinces.open-api.vn/api/v2/?depth=1");
        if (!response.ok) {
          throw new Error("Failed to fetch provinces");
        }
        const data: Province[] = await response.json();
        const options = data.map((p) => ({
          label: p.name,
          value: p.name,
        }));
        
        // Sort alphabetically
        options.sort((a, b) => a.label.localeCompare(b.label));
        
        if (!cancelled) {
          setProvinces(options);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load provinces");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchProvinces();

    return () => {
      cancelled = true;
    };
  }, []);

  return { provinces, isLoading, error };
};
