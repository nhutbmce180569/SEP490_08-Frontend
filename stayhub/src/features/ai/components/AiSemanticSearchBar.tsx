import React, { useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../config/routes/route";
import { useAiSemanticSearch } from "../hooks/useAiSemanticSearch";

interface Props {
  className?: string;
  placeholder?: string;
}

export const AiSemanticSearchBar: React.FC<Props> = ({
  className = "",
  placeholder = "Tìm tour bằng AI — VD: tour văn hóa miền Trung 4 ngày",
}) => {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { results, isSearching, search, clearResults } = useAiSemanticSearch();
  const navigate = useNavigate();

  const handleSearch = async () => {
    const list = await search(query);
    setShowResults(true);
    if (list.length === 0) return;
  };

  const handleClear = () => {
    setQuery("");
    clearResults();
    setShowResults(false);
  };

  const goToAiAssistant = () => navigate(PATH.PUBLIC.AI_ASSISTANT);

  return (
    <div className={`relative ${className}`}>
      <div
        className="flex items-center gap-2 rounded-2xl px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-[var(--color-brand)]/30"
        style={{
          background: "#fff",
          border: "1px solid rgba(5,7,60,0.1)",
          boxShadow: "0 2px 12px rgba(5,7,60,0.04)",
        }}
      >
        <Sparkles size={18} style={{ color: "var(--color-brand)" }} className="shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none font-medium min-w-0"
        />
        {query && (
          <button type="button" onClick={handleClear} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || query.trim().length < 2}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white disabled:opacity-50 transition-opacity shrink-0"
          style={{ background: "var(--color-brand)" }}
        >
          {isSearching ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search size={14} />
          )}
          AI Search
        </button>
      </div>

      {showResults && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-40 max-h-80 overflow-y-auto"
          style={{
            background: "#fff",
            border: "1px solid rgba(5,7,60,0.1)",
            boxShadow: "0 8px 32px rgba(5,7,60,0.12)",
          }}
        >
          {results.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-bold text-slate-600 mb-2">Không tìm thấy tour phù hợp</p>
              <button
                type="button"
                onClick={goToAiAssistant}
                className="text-xs font-bold text-brand hover:underline"
              >
                Thử khảo sát AI chi tiết →
              </button>
            </div>
          ) : (
            <>
              {results.slice(0, 6).map((tour) => (
                <button
                  key={tour.tourId}
                  type="button"
                  onClick={() => {
                    navigate(PATH.PUBLIC.TOUR_DETAIL(tour.tourId));
                    setShowResults(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <p className="text-sm font-black text-slate-800 line-clamp-1">{tour.name}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {[tour.city, tour.minPrice != null ? `${tour.minPrice.toLocaleString("vi-VN")} đ` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {tour.snippet && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{tour.snippet}</p>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={goToAiAssistant}
                className="w-full py-3 text-xs font-black text-brand hover:bg-brand-light transition-colors"
              >
                Gợi ý cá nhân hóa với AI →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
