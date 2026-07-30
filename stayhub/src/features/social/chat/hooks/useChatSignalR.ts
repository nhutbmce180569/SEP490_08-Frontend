import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';
import type { ChatMessage } from '../types/chat.type';
import { chatService } from '../services/chatService';
import { SIGNALR_HUB_BASE } from '../../../../config/api/api';
import { useToast } from '../../../../contexts/ToastContext';

export const useChatSignalR = (roomId: number | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    // 🚀 LOCAL CHAT ROOM FLOW: Only responsible for connection and message exchange when a chat room is open
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_HUB_BASE}/chat`, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || localStorage.getItem('access_token') || '',
      })
      .configureLogging(signalR.LogLevel.None)
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    const startSignalR = async () => {
      try {
        await newConnection.start();
        setIsConnected(true);

        // Call the JoinRoom group function on the C# Server
        await newConnection.invoke('JoinRoom', roomId);

        // Receive real-time messages pushed to the current chat room
        newConnection.on('ReceiveMessage', (newMsg: ChatMessage) => {
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        });
      } catch (error: any) {
        if (error.name === 'AbortError' || error.message?.includes('negotiation')) {
          console.warn('SignalR Chat: Negotiation cancelled due to React Strict Mode.');
        } else {
          console.error('SignalR Chat Connection Error: ', error);
        }
      }
    };

    startSignalR();

    return () => {
      newConnection.off('ReceiveMessage');
      newConnection.stop().then(() => setIsConnected(false));
    };
  }, [roomId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (connection && isConnected && roomId) {
        try {
          // Pass 2 discrete parameters that exactly match the Task SendMessage(int chatRoomId, string content) signature in ChatHub.cs Backend
          await connection.invoke('SendMessage', roomId, content.trim());
        } catch (err) {
          console.error('SignalR Error sending message:', err);
          toast.error('Send error! Please check your connection and try again.');
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