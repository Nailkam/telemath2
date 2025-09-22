import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { messagesApi, usersApi } from '../services/api';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Send, ArrowLeft, MoreVertical, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, sendMessage, joinRoom, leaveRoom, onMessage, offMessage } = useSocket();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user data
  const { data: userData, isLoading: isUserLoading } = useQuery(
    ['user', userId],
    () => usersApi.getUser(userId!),
    {
      enabled: !!userId,
    }
  );

  // Fetch conversation
  const { data: conversationData, isLoading: isConversationLoading } = useQuery(
    ['conversation', userId],
    () => messagesApi.getConversation(userId!, 50, 0),
    {
      enabled: !!userId,
      refetchInterval: 5000,
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    (messageData: any) => messagesApi.sendMessage(messageData),
    {
      onSuccess: (response) => {
        setMessages(prev => [...prev, response.data]);
        setMessage('');
        scrollToBottom();
      },
      onError: (error: any) => {
        toast.error('Ошибка отправки сообщения');
      },
    }
  );

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    () => messagesApi.markConversationAsRead(userId!),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['conversations']);
      },
    }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && userId) {
      sendMessageMutation.mutate({
        receiverId: userId,
        content: message.trim(),
        type: 'text',
      });
    }
  };

  const getMainPhoto = (photos: any[]) => {
    const mainPhoto = photos.find(photo => photo.isMain);
    return mainPhoto ? mainPhoto.url : (photos[0] ? photos[0].url : null);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  // Socket message handling
  useEffect(() => {
    const handleReceiveMessage = (newMessage: any) => {
      if (newMessage.senderId === userId || newMessage.receiverId === userId) {
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      }
    };

    onMessage(handleReceiveMessage);

    return () => {
      offMessage(handleReceiveMessage);
    };
  }, [userId, onMessage, offMessage]);

  // Join room and mark as read
  useEffect(() => {
    if (userId && socket) {
      joinRoom(userId);
      markAsReadMutation.mutate();
    }

    return () => {
      if (userId && socket) {
        leaveRoom(userId);
      }
    };
  }, [userId, socket]);

  // Update messages when conversation data changes
  useEffect(() => {
    if (conversationData?.messages) {
      setMessages(conversationData.messages);
      scrollToBottom();
    }
  }, [conversationData]);

  if (isUserLoading || isConversationLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const chatUser = userData?.user;

  if (!chatUser) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Пользователь не найден</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
          {getMainPhoto(chatUser.photos) ? (
            <img
              src={getMainPhoto(chatUser.photos)}
              alt={chatUser.firstName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
              <span className="text-primary-600 text-sm font-bold">
                {chatUser.firstName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {chatUser.firstName} {chatUser.lastName}
          </h3>
          <p className="text-sm text-gray-500">
            {chatUser.age && `${chatUser.age} лет`}
          </p>
        </div>
        
        <Button variant="ghost" size="sm" className="p-2">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, index) => {
            const isOwn = msg.senderId === user?.id;
            const showDate = index === 0 || 
              formatDate(msg.createdAt) !== formatDate(messages[index - 1]?.createdAt);

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="text-center mb-4">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-primary-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Напишите сообщение..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <Button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isLoading}
            className="w-10 h-10 rounded-full p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
