import React, { useState, useEffect, useRef, useMemo } from "react";
import { useContext } from "react";
import { AuthContext } from "../../../../contexts/AuthContext";
import { MessageSquare, Send, Users, Loader2 } from "lucide-react";
import { useChatSignalR } from "../hooks/useChatSignalR";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "../services/chatService";
import { useTranslation } from "../../../../contexts/LocaleContext";

export const ChatInterface: React.FC = () => {
  const { t } = useTranslation();
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [typedMessage, setTypedMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  // 1. Fetch actual chat room list from chatService via React Query
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ["chatRooms"],
    queryFn: () => chatService.getChatRooms(),
  });

  // 2. Connect to SignalR Realtime and get message list from your existing Custom Hook
  const { 
    messages: currentRoomMessages, 
    sendMessage: sendMessageSignalR, 
    isConnected 
  } = useChatSignalR(activeRoomId);

  const { user } = useContext(AuthContext);
  const currentUserId = user?.id || 0;

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  // Auto-sort: Pinned to top, then by latest update time
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a: any, b: any) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const timeA = new Date(a.lastMessageCreatedAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.lastMessageCreatedAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [rooms]);

  // Select room & reset unreadCount immediately on UI using Cache (Zalo Style)
  const handleSelectRoom = (roomId: number) => {
    setActiveRoomId(roomId);
    queryClient.setQueryData(["chatRooms"], (oldRooms: any) => {
      if (!oldRooms) return oldRooms;
      return oldRooms.map((room: any) =>
        room.id === roomId ? { ...room, unreadCount: 0 } : room
      );
    });
  };

  // Automatically scroll to bottom on new message or room change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentRoomMessages.length, activeRoomId]);

  // 3. Function to handle sending messages directly through the Hook's SignalR connection
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeRoomId || !isConnected) return;
    
    const messageContent = typedMessage.trim();
    setTypedMessage(""); // Clear input field beforehand for a smoother user experience

    try {
      await sendMessageSignalR(messageContent);
    } catch (err) {
      console.error("Error sending message via SignalR: ", err);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex h-[600px]">
      
      {/* LEFT SIDEBAR: CHAT ROOM LIST */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-100 bg-white">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand" />
            {t("social.chatConversations")}
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
          {isLoadingRooms && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          )}
          {!isLoadingRooms && rooms.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400 font-medium">
              {t("social.chatNoRooms")}
            </div>
          )}
          {sortedRooms.map((room: any) => {
            const isSelected = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                onClick={() => handleSelectRoom(room.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 outline-none ${
                  isSelected 
                    ? "bg-brand/10 text-brand font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-brand text-white" : "bg-slate-200 text-slate-500"}`}>
                  {room.isGroupChat ? <Users className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-sm truncate font-semibold">{room.roomName || room.name}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {room.isGroupChat ? t("social.chatGroupLabel") : t("social.chatDirectLabel")}
                  </p>
                </div>
                {room.unreadCount > 0 && (
                  <div className="min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-[0_4px_10px_rgba(244,63,94,0.35)] border border-white/20 animate-pulse shrink-0">
                    {room.unreadCount > 5 ? "5+" : room.unreadCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT CONTENT PANE: MESSAGES */}
      <div className="flex-1 flex flex-col bg-white">
        {activeRoom ? (
          <>
            {/* Chat room header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shadow-sm z-10 bg-white">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{activeRoom.roomName || activeRoom.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isConnected ? t("social.chatActiveSession") : "Reconnecting..."}
                </p>
              </div>
            </div>

            {/* Message list display area (Using normal flow, not flex-col-reverse because the hook stores the array in forward order) */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/30 custom-scrollbar">
              {currentRoomMessages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[75%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isMe 
                        ? "bg-brand text-white rounded-br-none font-medium"
                        : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-tight mt-1 px-1 font-medium">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input box */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder={t("social.chatTypePlaceholder")}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand/50 transition-colors text-slate-800"
              />
              <button
                type="submit"
                disabled={!typedMessage.trim() || !isConnected}
                className="p-2.5 bg-brand hover:bg-brand-hover disabled:opacity-40 text-white rounded-xl transition-all shadow-md shadow-brand/10 cursor-pointer flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          /* Empty state when no room is selected */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 mb-3 text-slate-300">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">{t("social.chatNoSelected")}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] text-center">{t("social.chatChooseRoom")}</p>
          </div>
        )}
      </div>
    </div>
  );
};