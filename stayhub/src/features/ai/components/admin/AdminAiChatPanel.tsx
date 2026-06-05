import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, Trash2 } from "lucide-react";
import { useTourAssistantChat } from "../../hooks/useTourAssistantChat";
import { AiTourRecommendationCard } from "../AiTourRecommendationCard";
import { AdminJsonPanel } from "./AdminJsonPanel";
import { useTranslation } from "../../../../contexts/LocaleContext";

export const AdminAiChatPanel: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const { messages, isSending, sendMessage, logInteraction, clearMessages, sessionId } =
    useTourAssistantChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  const defaultSuggestions = useMemo(
    () => [t("ai.suggestionBeach"), t("ai.suggestionCulture"), t("ai.suggestionDaLat")],
    [t],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim() || isSending) return;
    setInput("");
    await sendMessage(msg);
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const suggestions = lastAssistant?.response?.suggestedQuestions ?? defaultSuggestions;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="glass-card flex min-h-[520px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-brand" />
            <div>
              <p className="text-sm font-bold text-slate-900">{t("ai.adminAi.chatbotTitle")}</p>
              <p className="text-xs text-slate-500">{t("ai.adminAi.chatbotDesc")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearMessages}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-rose-200 hover:text-rose-600"
          >
            <Trash2 size={14} />
            {t("ai.adminAi.clearChat")}
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <Sparkles size={28} className="mx-auto mb-3 text-brand" />
              <p className="text-sm font-bold text-slate-800">{t("ai.greeting")}</p>
              <p className="mt-1 text-xs text-slate-500">{t("ai.greetingHint")}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {suggestions.slice(0, 3).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="rounded-full border border-brand/20 bg-brand-light px-3 py-1.5 text-[11px] font-semibold text-brand"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-md bg-brand text-white"
                      : "rounded-bl-md bg-slate-100 text-slate-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>

              {msg.response && msg.response.recommendedTours.length > 0 && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {msg.response.recommendedTours.slice(0, 4).map((tour) => (
                    <AiTourRecommendationCard
                      key={tour.tourId}
                      tour={tour}
                      compact
                      showScoreBreakdown
                      onTourClick={(id) => logInteraction(id, "chat_recommend")}
                    />
                  ))}
                </div>
              )}

              {msg.response && (
                <div className="mt-3">
                  <AdminJsonPanel
                    title={t("ai.adminAi.chatDebug")}
                    data={msg.response}
                    defaultOpen={msg.role === "assistant"}
                  />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-2xl bg-slate-100 px-4 py-3">
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

        <div className="flex gap-2 border-t border-slate-100 p-3">
          <input
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-4">
          <p className="travel-eyebrow mb-2">{t("ai.adminAi.session")}</p>
          <p className="break-all text-xs font-mono text-slate-600">{sessionId}</p>
        </div>
        <AdminJsonPanel
          title={t("ai.adminAi.lastResponse")}
          data={lastAssistant?.response ?? null}
          defaultOpen
        />
      </div>
    </div>
  );
};
