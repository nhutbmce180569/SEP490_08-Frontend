import React, { useState, useEffect, useRef } from "react";
import { useContext } from "react";
import { AuthContext } from "../../../../contexts/AuthContext";
import { MessageSquare, Send, Users, ShieldAlert, Loader2 } from "lucide-react";
import { useGetChatRooms, useGetRoomMessages, useSendMessage } from "../hooks/useChats";
import { useQueryClient } from "@tanstack/react-query";
import * as signalR from "@microsoft/signalr";

export const ChatInterface: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [typedMessage, setTypedMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch danh sách phòng chat từ Hook React Query
  const { data: rooms = [], isLoading: isLoadingRooms } = useGetChatRooms();

  // 2. Fetch tin nhắn của phòng đang chọn (Flatten data từ Infinite Query)
  const { data: infiniteMessageData, isLoading: isLoadingMessages } = useGetRoomMessages(activeRoomId || 0);
  const currentRoomMessages = infiniteMessageData?.pages.flatMap((page) => page) || [];

  const { user } = useContext(AuthContext);
const currentUserId = user?.id || 0;
  const { mutate: sendMessageAPI, isPending: isSendingMessage } = useSendMessage();

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  // Tự động cuộn xuống đáy khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentRoomMessages.length, activeRoomId]);

  // 3. Kết nối Real-time qua SignalR ChatHub
  useEffect(() => {
    if (!activeRoomId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7004/hubs/chat", {
        accessTokenFactory: () => localStorage.getItem("accessToken") || "",
      })
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        // Tham gia vào phòng chat cụ thể trên Server SignalR
        connection.invoke("JoinRoom", activeRoomId);
      })
      .catch((err) => console.error("SignalR Chat Connection Error: ", err));

    // Lắng nghe tin nhắn mới từ Hub gửi về
    connection.on("ReceiveMessage", (roomId: number, senderId: number, content: string, sentAt: string) => {
      if (roomId === activeRoomId) {
        // Cấy trực tiếp tin nhắn mới vào Cache của React Query để UI update lập tức
        queryClient.setQueryData(["chats", "messages", activeRoomId], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: [
              [{ id: Date.now(), chatRoomId: roomId, senderId, content, isRead: false, sentAt }, ...oldData.pages[0]],
              ...oldData.pages.slice(1),
            ],
          };
        });
      }
    });

    return () => {
      connection.stop();
    };
  }, [activeRoomId, queryClient]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeRoomId || isSendingMessage) return;
    
    sendMessageAPI(
      { roomId: activeRoomId, content: typedMessage.trim() },
      {
        onSuccess: () => {
          setTypedMessage("");
        },
        onError: (err) => {
          console.error("Lỗi gửi tin nhắn: ", err);
        }
      }
    );
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex h-[600px]">
      
      {/* SIDEBAR BÊN TRÁI: DANH SÁCH PHÒNG CHAT */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-100 bg-white">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#0068E0]" />
            Conversations
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
          {isLoadingRooms && (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          )}
          {!isLoadingRooms && rooms.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400 font-medium">No active chat rooms.</div>
          )}
          {rooms.map((room) => {
            const isSelected = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 outline-none ${
                  isSelected 
                    ? "bg-[#0068E0]/10 text-[#0068E0] font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-[#0068E0] text-white" : "bg-slate-200 text-slate-500"}`}>
                  {room.isGroupChat ? <Users className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-sm truncate font-semibold">{room.roomName}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {room.isGroupChat ? "Group Chat" : "Direct Message"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KHUNG NỘI DUNG BÊN PHẢI: TIN NHẮN */}
      <div className="flex-1 flex flex-col bg-white">
        {activeRoom ? (
          <>
            {/* Header phòng chat */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shadow-sm z-10 bg-white">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{activeRoom.roomName}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Active Session</p>
              </div>
            </div>

            {/* Vùng hiển thị danh sách tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-3 bg-slate-50/30 custom-scrollbar">
              <div ref={messagesEndRef} />
              
              {isLoadingMessages ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : (
                currentRoomMessages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[75%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMe 
                          ? "bg-[#0068E0] text-white rounded-br-none font-medium"
                          : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-tight mt-1 px-1 font-medium">
                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Ô nhập input gửi tin nhắn */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0068E0]/50 transition-colors text-slate-800"
              />
              <button
                type="submit"
                disabled={!typedMessage.trim() || isSendingMessage}
                className="p-2.5 bg-[#0068E0] hover:bg-[#0058D0] disabled:opacity-40 text-white rounded-xl transition-all shadow-md shadow-[#0068E0]/10 cursor-pointer"
              >
                {isSendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        ) : (
          /* Trạng thái trống khi chưa chọn phòng */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 mb-3 text-slate-300">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No Chat Selected</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] text-center">Choose a room from the sidebar menu to begin talking.</p>
          </div>
        )}
      </div>
    </div>
  );
};
