import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Minimize2, ListChecks, ArrowLeft } from "lucide-react";
import { useTourAssistantChat } from "../hooks/useTourAssistantChat";
import { SystemFaqBrowser } from "./SystemFaqBrowser";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useTourAssistantChatState } from "../../../contexts/TourAssistantChatContext";

type ChatView = "chat" | "faq";

export const TourAssistantChatWidget = () => {
  const { t } = useTranslation();
  const { isOpen: open, close: setOpenFalse } = useTourAssistantChatState();
  const [view, setView] = useState<ChatView>("chat");
  const [input, setInput] = useState("");
  const { messages, isSending, sendMessage } = useTourAssistantChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const systemSuggestions = useMemo(
    () => [
      t("ai.suggestionSystem"),
      t("ai.suggestionBooking"),
      t("ai.suggestionVoucher"),
      t("ai.suggestionAiFeatures"),
    ],
    [t],
  );

  useEffect(() => {
    if (open && view === "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open, view]);

  const handleSend = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim() || isSending) return;
    setInput("");
    setView("chat");
    await sendMessage(msg);
  };

  const handleClose = () => {
    setOpenFalse();
    setView("chat");
  };

  return (
    <>
      {open && (
        <div className="ai-chat-panel fixed bottom-6 right-6 z-50 flex h-[min(80vh,560px)] w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-3xl">
          <div className="ai-surface-header flex shrink-0 items-center justify-between px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              {view === "faq" ? (
                <button
                  type="button"
                  onClick={() => setView("chat")}
                  className="rounded-full p-1.5 transition-colors hover:bg-white/20"
                  aria-label={t("ai.systemFaq.backToChat")}
                >
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <Sparkles size={18} />
              )}
              <div>
                <p className="text-sm font-bold">
                  {view === "faq" ? t("ai.systemFaq.title") : t("ai.stayhubAi")}
                </p>
                <p className="text-[10px] font-medium opacity-90">
                  {view === "faq" ? t("ai.systemFaq.subtitle") : t("ai.systemHelpSubtitle")}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {view === "chat" && (
                <button
                  type="button"
                  onClick={() => setView("faq")}
                  className="rounded-full p-2 transition-colors hover:bg-white/20"
                  aria-label={t("ai.systemFaq.browseAll")}
                  title={t("ai.systemFaq.browseAll")}
                >
                  <ListChecks size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-2 transition-colors hover:bg-white/20"
                aria-label={t("ai.minimize")}
              >
                <Minimize2 size={16} />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-2 transition-colors hover:bg-white/20"
                aria-label={t("ai.close")}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="ai-chat-messages custom-scrollbar flex-1 overflow-y-auto p-4">
            {view === "faq" ? (
              <SystemFaqBrowser onSelectQuestion={handleSend} />
            ) : (
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="px-2 py-6 text-center">
                    <p className="mb-2 text-sm font-bold text-[var(--color-navy)]">
                      {t("ai.systemGreeting")}
                    </p>
                    <p className="mb-4 text-xs font-medium text-[var(--text-muted)]">
                      {t("ai.systemGreetingHint")}
                    </p>
                    <div className="mb-4 flex flex-wrap justify-center gap-2">
                      {systemSuggestions.map((q) => (
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
                    <button
                      type="button"
                      onClick={() => setView("faq")}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand underline-offset-2 hover:underline"
                    >
                      <ListChecks size={14} />
                      {t("ai.systemFaq.browseAll")}
                    </button>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id}>
                    <div
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed whitespace-pre-line ${
                          msg.role === "user"
                            ? "ai-user-bubble rounded-br-md text-white"
                            : "ai-chat-bubble-assistant rounded-bl-md"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>

                    {msg.role === "assistant" && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {systemSuggestions.slice(0, 2).map((q) => (
                          <button
                            key={`${msg.id}-${q}`}
                            type="button"
                            onClick={() => handleSend(q)}
                            className="ai-chip rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setView("faq")}
                          className="ai-chip inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors"
                        >
                          <ListChecks size={11} />
                          {t("ai.systemFaq.browseAll")}
                        </button>
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
            )}
          </div>

          {view === "chat" && (
            <div className="ai-chat-footer flex shrink-0 gap-2 p-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={t("ai.systemInputPlaceholder")}
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
          )}
        </div>
      )}
    </>
  );
};
