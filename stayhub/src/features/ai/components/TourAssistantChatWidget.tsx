import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Minimize2 } from "lucide-react";
import { useTourAssistantChat } from "../hooks/useTourAssistantChat";
import { AiTourRecommendationCard } from "./AiTourRecommendationCard";

export const TourAssistantChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isSending, sendMessage, logInteraction } = useTourAssistantChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const suggestions = lastAssistant?.response?.suggestedQuestions ?? [
    "Gợi ý tour biển giá dưới 5 triệu",
    "Tour văn hóa miền Trung 4 ngày",
    "Đà Lạt 3 ngày cho 2 người",
  ];

  return (
    <>
      {/* Floating button — Shopee/Amazon style */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-black text-sm shadow-2xl transition-transform hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #EB662B 0%, #d55821 100%)",
            boxShadow: "0 8px 32px rgba(235,102,43,0.45)",
          }}
          aria-label="Mở trợ lý AI"
        >
          <MessageCircle size={20} />
          <span className="hidden sm:inline">Trợ lý AI</span>
          <Sparkles size={16} className="opacity-80" />
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col w-[min(100vw-2rem,400px)] h-[min(80vh,560px)] rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: "#fff",
            border: "1px solid rgba(5,7,60,0.1)",
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #EB662B, #c94e15)" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <div>
                <p className="text-sm font-black">StayHub AI</p>
                <p className="text-[10px] opacity-80 font-medium">Tư vấn tour thông minh</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Thu nhỏ"
              >
                <Minimize2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center py-8 px-4">
                <p className="text-sm font-bold text-slate-700 mb-2">
                  Xin chào! Tôi có thể giúp gì?
                </p>
                <p className="text-xs text-slate-500 font-medium mb-4">
                  Hỏi bằng ngôn ngữ tự nhiên — ví dụ giá, địa điểm, số người...
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.slice(0, 3).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSend(q)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors"
                      style={{
                        background: "#FFF1EB",
                        color: "#EB662B",
                        border: "1px solid rgba(235,102,43,0.2)",
                      }}
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
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                      msg.role === "user"
                        ? "text-white rounded-br-md"
                        : "text-slate-700 bg-white border border-slate-200 rounded-bl-md"
                    }`}
                    style={
                      msg.role === "user"
                        ? { background: "#EB662B" }
                        : undefined
                    }
                  >
                    {msg.text}
                  </div>
                </div>

                {msg.response && msg.response.recommendedTours.length > 0 && (
                  <div className="mt-3 space-y-3 pl-1">
                    {msg.response.recommendedTours.slice(0, 3).map((tour) => (
                      <div key={tour.tourId} className="scale-[0.92] origin-left">
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
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.response.suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleSend(q)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{ background: "#fff", border: "1px solid rgba(5,7,60,0.1)", color: "#64748b" }}
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
                <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="shrink-0 p-3 flex gap-2"
            style={{ borderTop: "1px solid rgba(5,7,60,0.08)", background: "#fff" }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Nhập câu hỏi..."
              maxLength={2000}
              disabled={isSending}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none font-medium"
              style={{
                background: "rgba(5,7,60,0.04)",
                border: "1px solid rgba(5,7,60,0.08)",
              }}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={isSending || input.trim().length < 2}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-white disabled:opacity-40 transition-opacity"
              style={{ background: "#EB662B" }}
              aria-label="Gửi"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
