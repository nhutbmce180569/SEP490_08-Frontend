import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Minimize2 } from "lucide-react";
import { useTourAssistantChat } from "../hooks/useTourAssistantChat";
import { AiTourRecommendationCard } from "./AiTourRecommendationCard";
import { useTranslation } from "../../../contexts/LocaleContext";

export const TourAssistantChatWidget = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isSending, sendMessage, logInteraction } = useTourAssistantChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultSuggestions = useMemo(
    () => [t("ai.suggestionBeach"), t("ai.suggestionCulture"), t("ai.suggestionDaLat")],
    [t],
  );

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  const handleSend = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim() || isSending) return;
    setInput("");
    await sendMessage(msg);
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const suggestions = lastAssistant?.response?.suggestedQuestions ?? defaultSuggestions;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ai-fab fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white transition-transform hover:scale-105"
          aria-label={t("ai.openAssistant")}
        >
          <MessageCircle size={20} />
          <span className="hidden sm:inline">{t("ai.assistantLabel")}</span>
          <Sparkles size={16} className="opacity-90" />
        </button>
      )}

      {open && (
        <div className="ai-chat-panel fixed bottom-6 right-6 z-50 flex h-[min(80vh,560px)] w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-3xl">
          <div className="ai-surface-header flex shrink-0 items-center justify-between px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <div>
                <p className="text-sm font-bold">{t("ai.stayhubAi")}</p>
                <p className="text-[10px] font-medium opacity-90">{t("ai.smartAdvisor")}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-white/20"
                aria-label={t("ai.minimize")}
              >
                <Minimize2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-white/20"
                aria-label={t("ai.close")}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="ai-chat-messages custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="mb-2 text-sm font-bold text-[var(--color-navy)]">
                  {t("ai.greeting")}
                </p>
                <p className="mb-4 text-xs font-medium text-[var(--text-muted)]">
                  {t("ai.greetingHint")}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.slice(0, 3).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSend(q)}
                      className="ai-chip rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id}>
                <div
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed ${
                      msg.role === "user"
                        ? "ai-user-bubble rounded-br-md text-white"
                        : "ai-chat-bubble-assistant rounded-bl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                {msg.response && msg.response.recommendedTours.length > 0 && (
                  <div className="mt-3 space-y-3 pl-1">
                    {msg.response.recommendedTours.slice(0, 3).map((tour) => (
                      <div key={tour.tourId} className="origin-left scale-[0.92]">
                        <AiTourRecommendationCard
                          tour={tour}
                          compact
                          onTourClick={(id) => logInteraction(id, "chat_recommend")}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {msg.response && msg.response.suggestedQuestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.response.suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleSend(q)}
                        className="ai-chip rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="ai-chat-bubble-assistant flex gap-1 rounded-2xl px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 animate-bounce rounded-full bg-brand/40"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="ai-chat-footer flex shrink-0 gap-2 p-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={t("ai.inputPlaceholder")}
              maxLength={2000}
              disabled={isSending}
              className="input-field flex-1 py-2.5"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={isSending || input.trim().length < 2}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition-opacity hover:bg-brand-hover disabled:opacity-40"
              aria-label={t("ai.send")}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
