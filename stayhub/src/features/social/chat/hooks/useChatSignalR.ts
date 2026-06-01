import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';
import type { ChatMessage } from '../types/chat.type';
import { chatService } from '../services/chatService';

export const useChatSignalR = (roomId: number | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(
    null
  );

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7010/hubs/chat', {
        accessTokenFactory: () => localStorage.getItem('accessToken') || '',
      })
      .configureLogging(signalR.LogLevel.None)
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    const startSignalR = async () => {
      try {
        await newConnection.start();
        setIsConnected(true);

        // Tham gia phòng chat
        await newConnection.invoke('JoinRoom', roomId);

        // Lắng nghe tin nhắn mới
        newConnection.on('ReceiveMessage', (newMsg: ChatMessage) => {
          setMessages((prev) => [...prev, newMsg]);
        });
      } catch (error: any) {
        // Phân biệt lỗi rác của React Strict Mode
        if (error.name === 'AbortError' || error.message?.includes('negotiation')) {
          console.warn('SignalR Chat: Hủy đàm phán do React Strict Mode (Bỏ qua được).');
        } else {
          console.error('SignalR Chat Connection Error: ', error);
        }
      }
    };

    startSignalR();

    // Cleanup function khi đổi phòng
    return () => {
      newConnection.off('ReceiveMessage');
      newConnection.stop().then(() => setIsConnected(false));
    };
  }, [roomId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (connection && isConnected && roomId) {
        try {
          // 👉 GỬI 1 OBJECT DUY NHẤT VỚI CÁC KEY KHỚP DTO C#
          // DTO Backend: SendMessageDto { ChatRoomId, Content }
         // 👉 TRUYỀN 2 THAM SỐ RỜI RẠC KHỚP VỚI HÀM CỦA BACKEND
          await connection.invoke('SendMessage', roomId, content.trim());
        } catch (err) {
          console.error('SignalR Lỗi khi gửi tin nhắn:', err);
          alert('Gửi lỗi! Vui lòng kiểm tra kết nối và thử lại.');
        }
      }
    },
    [connection, isConnected, roomId]
  );

  return { messages, sendMessage, isConnected, setMessages };
};

export const useCreateChatRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendId: number) => chatService.createChatRoom(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });
};