import { useCallback, useState } from "react";
import { useToast } from "../../../contexts/ToastContext";
import { getApiErrorMessage } from "../../content/utils/apiError";
import { postSemanticSearch } from "../services/tourAssistant.service";
import type { TourSearchResultItem } from "../types/tourAssistant";

export const useAiSemanticSearch = () => {
  const { error: showError } = useToast();
  const [results, setResults] = useState<TourSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(
    async (query: string, options?: { top?: number; maxPrice?: number }) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        showError("Từ khóa tìm kiếm phải có ít nhất 2 ký tự.");
        return [];
      }

      setIsSearching(true);
      try {
        const data = await postSemanticSearch({
          query: trimmed,
          top: options?.top ?? 8,
          maxPrice: options?.maxPrice,
        });
        const list = Array.isArray(data) ? data : (data as { data?: TourSearchResultItem[] })?.data ?? [];
        setResults(list);
        return list;
      } catch (err: unknown) {
        showError(getApiErrorMessage(err, "Tìm kiếm AI thất bại."));
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [showError],
  );

  return { results, isSearching, search, clearResults: () => setResults([]) };
};
