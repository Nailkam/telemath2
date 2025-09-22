import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { messagesApi } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { MessageCircle, Heart, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: conversationsData, isLoading } = useQuery(
    ['conversations'],
    () => messagesApi.getConversations(),
    {
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  );

  const getMainPhoto = (photos: any[]) => {
    const mainPhoto = photos.find(photo => photo.isMain);
    return mainPhoto ? mainPhoto.url : (photos[0] ? photos[0].url : null);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Только что';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}м назад`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}ч назад`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const isOnline = (lastSeen: string) => {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    return diffInMinutes < 5; // Online if seen within last 5 minutes
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const conversations = conversationsData?.conversations || [];

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Нет сообщений
        </h3>
        <p className="text-gray-600">
          Начните общение с вашими совпадениями!
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Сообщения
        </h1>
        <p className="text-gray-600">
          {conversations.length} {conversations.length === 1 ? 'разговор' : 'разговоров'}
        </p>
      </div>

      <div className="space-y-3">
        {conversations.map((conversation, index) => (
          <motion.div
            key={conversation._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/chat/${conversation._id}`)}
          >
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100">
                  {getMainPhoto(conversation.user.photos) ? (
                    <img
                      src={getMainPhoto(conversation.user.photos)}
                      alt={conversation.user.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                      <span className="text-primary-600 text-lg font-bold">
                        {conversation.user.firstName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Online indicator */}
                {isOnline(conversation.user.lastSeen) && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>

              {/* Conversation info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {conversation.user.firstName} {conversation.user.lastName}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                    {conversation.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>

                {conversation.lastMessage ? (
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600 truncate flex-1">
                      {conversation.lastMessage.content}
                    </p>
                    {!conversation.lastMessage.isRead && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <p className="text-sm text-primary-600">
                      Начните общение!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8 space-y-3">
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Начните общение</h3>
              <p className="text-sm opacity-90">
                Отправьте первое сообщение вашим совпадениям
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-secondary-500 to-accent-500 rounded-2xl p-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Найдите больше совпадений</h3>
              <p className="text-sm opacity-90">
                Продолжайте свайпать, чтобы найти свою любовь
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
