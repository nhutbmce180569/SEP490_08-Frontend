import React, { useEffect, useRef, useState } from "react";
import { Send, Sparkles, AlertCircle } from "lucide-react";
import { useIntelligentChat } from "../hooks/useIntelligentChat";
import { AiTourRecommendationCard } from "./AiTourRecommendationCard";
import { WeatherAdviceCard } from "./WeatherAdviceCard";
import { useTranslation } from "../../../contexts/LocaleContext";

export const IntelligentChatWizard: React.FC = () => {
  const { t } = useTranslation();
  const { messages, isSending, sendMessage } = useIntelligentChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim() || isSending) return;
    setInput("");
    await sendMessage(msg);
  };

  const welcomeSuggestions = [
    "Tôi muốn đi Đà Lạt 3 ngày gia đình",
    "Gợi ý tour Nha Trang giá rẻ cho cặp đôi",
    "Tư vấn đi du lịch Sa Pa mùa này",
  ];

  const renderMessageText = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-2" />;
      
      let content: React.ReactNode = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      
      if (line.includes("**")) {
        const parts = line.split(boldRegex);
        content = parts.map((part, index) => {
          return index % 2 === 1 ? (
            <strong key={index} className="font-extrabold text-[var(--color-navy)]">
              {part}
            </strong>
          ) : (
            part
          );
        });
      }

      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const bulletText = line.trim().substring(2);
        let bulletContent: React.ReactNode = bulletText;
        if (bulletText.includes("**")) {
          const parts = bulletText.split(boldRegex);
          bulletContent = parts.map((part, index) => {
            return index % 2 === 1 ? (
              <strong key={index} className="font-extrabold text-[var(--color-navy)]">
                {part}
              </strong>
            ) : (
              part
            );
          });
        }
        return (
          <div key={i} className="flex gap-2.5 pl-1.5 my-1.5 items-start">
            <span className="text-brand shrink-0 mt-2 h-1.5 w-1.5 rounded-full bg-brand" />
            <span className="flex-1 text-slate-700 text-sm font-medium leading-relaxed">{bulletContent}</span>
          </div>
        );
      }

      return (
        <p key={i} className="mb-2 last:mb-0 text-slate-700 text-sm font-medium leading-relaxed">
          {content}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full flex-1 bg-[var(--surface-dashboard)] overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand mb-4 animate-bounce">
              <Sparkles size={28} />
            </div>
            <h3 className="text-sm font-bold text-[var(--color-navy)] mb-2 uppercase tracking-wide">
              StayHub AI Travel Assistant
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mb-6 leading-relaxed">
              Xin chào! Hãy chia sẻ mong muốn du lịch của bạn (như điểm đến, ngày khởi hành, bạn đồng hành, ngân sách...) để tôi tìm kiếm và đề xuất các tour tốt nhất cho bạn nhé!
            </p>
            <div className="w-full max-w-xs space-y-2">
              {welcomeSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="w-full text-left bg-white hover:bg-slate-50 border border-[var(--border-subtle)] rounded-xl p-3 text-xs font-bold text-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center gap-2"
                >
                  <Sparkles size={12} className="text-brand shrink-0 animate-pulse" />
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-3">
            {/* Main Message Bubble */}
            <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="flex gap-2.5 max-w-[88%] items-start">
                {msg.role === "assistant" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand to-indigo-600 text-white shadow-md">
                    <Sparkles size={16} />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4.5 py-3 text-sm font-medium leading-relaxed shadow-sm border transition-all ${
                    msg.role === "user"
                      ? "bg-gradient-to-tr from-brand to-indigo-600 text-white border-transparent rounded-br-sm shadow-md"
                      : "bg-white text-slate-800 border-[var(--border-subtle)] rounded-bl-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-line font-semibold">{msg.text}</p>
                  ) : (
                    renderMessageText(msg.text)
                  )}
                </div>
              </div>
            </div>

            {/* Rich Outputs (Tours, Weather, Cultural Facts) */}
            {msg.role === "assistant" && (
              <div className="pl-11.5 pr-2 space-y-4">
                {/* Weather Advice */}
                {msg.weatherAdvice && (
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 shadow-sm max-w-[420px] transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🌤️</span>
                      <h4 className="text-xs font-extrabold text-sky-900 uppercase tracking-wider">
                        Thông tin thời tiết & tư vấn
                      </h4>
                    </div>
                    <WeatherAdviceCard weather={msg.weatherAdvice} compact={false} />
                  </div>
                )}

                {/* Cultural Facts / Local Insights */}
                {msg.culturalFacts && msg.culturalFacts.length > 0 && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm max-w-[420px] transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={15} className="text-amber-600" />
                      <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                        Lưu ý văn hóa & Lời khuyên
                      </h4>
                    </div>
                    <ul className="list-disc pl-4 space-y-2 text-xs text-amber-950 font-semibold">
                      {msg.culturalFacts.map((fact, index) => (
                        <li key={index} className="leading-relaxed">
                          {fact.fact}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tourism Insights */}
                {msg.tourismInsights && msg.tourismInsights.length > 0 && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm max-w-[420px] transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-emerald-600" />
                      <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
                        Thông tin du lịch & Ẩm thực
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {msg.tourismInsights.map((insight, index) => (
                        <div key={index} className="text-xs text-emerald-950">
                          <p className="font-bold text-emerald-900 text-sm">{insight.name} ({insight.type})</p>
                          {insight.description && (
                            <p className="mt-1 opacity-90 leading-relaxed font-medium">{insight.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Tours List */}
                {msg.recommendedTours && msg.recommendedTours.length > 0 && (
                  <div className="space-y-3.5 max-w-[420px]">
                    <h4 className="text-xs font-extrabold text-[var(--color-navy)] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-brand animate-pulse" />
                      Đề xuất tour du lịch phù hợp:
                    </h4>
                    <div className="grid gap-3.5">
                      {msg.recommendedTours.map((tour) => (
                        <AiTourRecommendationCard
                          key={tour.tourId}
                          tour={tour}
                          compact
                          showCustomerBreakdown={false}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Follow-up Questions */}
                {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1.5 max-w-[420px]">
                    {msg.suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleSend(q)}
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full px-3.5 py-2 text-[10.5px] font-bold shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97]"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="flex gap-2.5 max-w-[85%] items-start">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-md">
                <Sparkles size={16} className="animate-spin" />
              </div>
              <div className="bg-white border border-[var(--border-subtle)] flex gap-1.5 rounded-2xl px-4 py-3.5 shadow-sm rounded-bl-sm">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 animate-bounce rounded-full bg-brand/60"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="flex shrink-0 gap-2.5 p-4 border-t border-[var(--border-subtle)] bg-white shadow-lg">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Nhập yêu cầu du lịch của bạn..."
          maxLength={2000}
          disabled={isSending}
          className="input-field flex-1 py-3 px-4 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all disabled:bg-slate-50"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={isSending || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition-all hover:opacity-95 disabled:opacity-40 shadow-md hover:scale-[1.05] active:scale-[0.95]"
          aria-label={t("ai.send")}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
