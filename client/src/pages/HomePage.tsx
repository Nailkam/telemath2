import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { usersApi, matchesApi } from '../services/api';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Heart, X, Star, MapPin, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedUsers, setSwipedUsers] = useState<string[]>([]);

  // Fetch potential matches
  const { data: matchesData, isLoading, refetch } = useQuery(
    ['potential-matches'],
    () => usersApi.getPotentialMatches(20, 0),
    {
      enabled: !!user,
    }
  );

  // Swipe mutation
  const swipeMutation = useMutation(
    ({ userId, action }: { userId: string; action: 'like' | 'pass' | 'superlike' }) =>
      matchesApi.swipe(userId, action),
    {
      onSuccess: (response, variables) => {
        if (response.isMatch) {
          toast.success('У вас есть совпадение! 💕');
        }
        
        setSwipedUsers(prev => [...prev, variables.userId]);
        setCurrentIndex(prev => prev + 1);
        
        // Refetch matches if we're running low
        if (currentIndex >= (matchesData?.matches.length || 0) - 3) {
          refetch();
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Ошибка при свайпе');
      },
    }
  );

  const handleSwipe = (action: 'like' | 'pass' | 'superlike') => {
    const currentUser = matchesData?.matches[currentIndex];
    if (currentUser) {
      swipeMutation.mutate({ userId: currentUser.id, action });
    }
  };

  const currentUser = matchesData?.matches[currentIndex];

  const getAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getMainPhoto = (photos: any[]) => {
    const mainPhoto = photos.find(photo => photo.isMain);
    return mainPhoto ? mainPhoto.url : (photos[0] ? photos[0].url : null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Пока что никого нет
        </h3>
        <p className="text-gray-600 mb-6">
          Попробуйте изменить настройки поиска или зайдите позже
        </p>
        <Button onClick={() => refetch()}>
          Обновить
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentUser.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, x: 300 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* User Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Photo */}
              <div className="relative h-96">
                {getMainPhoto(currentUser.photos) ? (
                  <img
                    src={getMainPhoto(currentUser.photos)}
                    alt={currentUser.firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-2xl font-bold">
                          {currentUser.firstName.charAt(0)}
                        </span>
                      </div>
                      <p className="text-gray-600">Нет фото</p>
                    </div>
                  </div>
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* User info overlay */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold">
                      {currentUser.firstName} {currentUser.lastName}
                    </h2>
                    {currentUser.age && (
                      <span className="text-lg font-medium">
                        {currentUser.age}
                      </span>
                    )}
                  </div>
                  
                  {currentUser.location?.city && (
                    <div className="flex items-center space-x-1 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">
                        {currentUser.location.city}
                      </span>
                    </div>
                  )}
                  
                  {currentUser.bio && (
                    <p className="text-sm opacity-90 line-clamp-2">
                      {currentUser.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Interests */}
              {currentUser.interests && currentUser.interests.length > 0 && (
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {currentUser.interests.slice(0, 5).map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                    {currentUser.interests.length > 5 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                        +{currentUser.interests.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-6 mt-6">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleSwipe('pass')}
                className="w-14 h-14 rounded-full p-0"
                disabled={swipeMutation.isLoading}
              >
                <X className="w-6 h-6 text-red-500" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => handleSwipe('superlike')}
                className="w-14 h-14 rounded-full p-0"
                disabled={swipeMutation.isLoading}
              >
                <Star className="w-6 h-6 text-blue-500" />
              </Button>

              <Button
                size="lg"
                onClick={() => handleSwipe('like')}
                className="w-14 h-14 rounded-full p-0"
                disabled={swipeMutation.isLoading}
              >
                <Heart className="w-6 h-6" />
              </Button>
            </div>

            {/* Progress indicator */}
            <div className="flex justify-center mt-4">
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, matchesData?.matches.length || 0) }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentIndex ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HomePage;
