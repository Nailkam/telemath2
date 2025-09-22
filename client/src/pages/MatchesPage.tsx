import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { matchesApi } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Heart, MessageCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const MatchesPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: matchesData, isLoading } = useQuery(
    ['matches'],
    () => matchesApi.getMatches(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const getMainPhoto = (photos: any[]) => {
    const mainPhoto = photos.find(photo => photo.isMain);
    return mainPhoto ? mainPhoto.url : (photos[0] ? photos[0].url : null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Только что';
    } else if (diffInHours < 24) {
      return `${diffInHours}ч назад`;
    } else if (diffInHours < 48) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const matches = matchesData?.matches || [];

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Пока нет совпадений
        </h3>
        <p className="text-gray-600">
          Продолжайте свайпать, чтобы найти свою любовь!
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ваши совпадения
        </h1>
        <p className="text-gray-600">
          {matches.length} {matches.length === 1 ? 'совпадение' : 'совпадений'}
        </p>
      </div>

      <div className="space-y-4">
        {matches.map((match, index) => (
          <motion.div
            key={match.userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/chat/${match.userId}`)}
          >
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                  {getMainPhoto(match.user.photos) ? (
                    <img
                      src={getMainPhoto(match.user.photos)}
                      alt={match.user.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                      <span className="text-primary-600 text-lg font-bold">
                        {match.user.firstName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {match.user.firstName} {match.user.lastName}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {formatDate(match.matchedAt)}
                  </span>
                </div>
                
                {match.user.age && (
                  <p className="text-sm text-gray-600 mb-2">
                    {match.user.age} лет
                  </p>
                )}

                {match.lastMessage ? (
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-600 truncate">
                      {match.lastMessage.content}
                    </p>
                    {!match.lastMessage.isRead && (
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

              {/* Arrow */}
              <div className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats section */}
      <div className="mt-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-6 text-white">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">
            Отличная работа! 🎉
          </h3>
          <p className="text-sm opacity-90">
            У вас уже есть {matches.length} {matches.length === 1 ? 'совпадение' : 'совпадений'}. 
            Продолжайте знакомиться!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MatchesPage;
