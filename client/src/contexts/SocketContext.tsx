import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'sticker' | 'gif';
  mediaUrl?: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
  replyTo?: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (message: Omit<Message, 'id' | 'createdAt' | 'isRead'>) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  onMessage: (callback: (message: Message) => void) => void;
  offMessage: (callback: (message: Message) => void) => void;
  onMatch: (callback: (matchData: any) => void) => void;
  offMatch: (callback: (matchData: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect socket if not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, token]);

  const sendMessage = (message: Omit<Message, 'id' | 'createdAt' | 'isRead'>) => {
    if (socket && isConnected) {
      socket.emit('send_message', message);
    } else {
      toast.error('Нет соединения с сервером');
    }
  };

  const joinRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('join_room', roomId);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_room', roomId);
    }
  };

  const onMessage = (callback: (message: Message) => void) => {
    if (socket) {
      socket.on('receive_message', callback);
    }
  };

  const offMessage = (callback: (message: Message) => void) => {
    if (socket) {
      socket.off('receive_message', callback);
    }
  };

  const onMatch = (callback: (matchData: any) => void) => {
    if (socket) {
      socket.on('new_match', callback);
    }
  };

  const offMatch = (callback: (matchData: any) => void) => {
    if (socket) {
      socket.off('new_match', callback);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    sendMessage,
    joinRoom,
    leaveRoom,
    onMessage,
    offMessage,
    onMatch,
    offMatch,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
