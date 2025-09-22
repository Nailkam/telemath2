import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Edit, Camera, MapPin, Heart, Settings, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    bio: user?.bio || '',
    interests: user?.interests || [],
  });

  const { data: profileData, isLoading } = useQuery(
    ['profile'],
    () => usersApi.getProfile(),
    {
      enabled: !!user,
    }
  );

  const updateProfileMutation = useMutation(
    (data: any) => usersApi.updateProfile(data),
    {
      onSuccess: (response) => {
        updateUser(response.user);
        setIsEditing(false);
        toast.success('Профиль обновлен!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Ошибка обновления профиля');
      },
    }
  );

  const uploadPhotoMutation = useMutation(
    (file: File) => usersApi.uploadPhoto(file, false),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile']);
        toast.success('Фото загружено!');
      },
      onError: (error: any) => {
        toast.error('Ошибка загрузки фото');
      },
    }
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editData);
  };

  const handleCancel = () => {
    setEditData({
      bio: user?.bio || '',
      interests: user?.interests || [],
    });
    setIsEditing(false);
  };

  const addInterest = (interest: string) => {
    if (interest.trim() && !editData.interests.includes(interest.trim())) {
      setEditData(prev => ({
        ...prev,
        interests: [...prev.interests, interest.trim()],
      }));
    }
  };

  const removeInterest = (interest: string) => {
    setEditData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest),
    }));
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

  const profile = profileData?.user || user;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Профиль не найден</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="opacity-90">
              {profile.age && `${profile.age} лет`}
            </p>
          </div>
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20">
            {getMainPhoto(profile.photos) ? (
              <img
                src={getMainPhoto(profile.photos)}
                alt={profile.firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {profile.firstName.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photos Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Фото</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('photo-upload')?.click()}
            disabled={uploadPhotoMutation.isLoading}
          >
            <Camera className="w-4 h-4 mr-2" />
            Добавить
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((index) => {
            const photo = profile.photos[index - 1];
            return (
              <div
                key={index}
                className="aspect-square bg-gray-100 rounded-xl overflow-hidden"
              >
                {photo ? (
                  <img
                    src={photo.url}
                    alt={`Photo ${index}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bio Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">О себе</h2>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editData.bio}
              onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Расскажите о себе..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {editData.bio.length}/500 символов
            </p>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleSave}
                loading={updateProfileMutation.isLoading}
                className="flex-1"
              >
                Сохранить
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700">
            {profile.bio || 'Расскажите о себе в разделе редактирования'}
          </p>
        )}
      </div>

      {/* Interests Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Интересы</h2>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {editData.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {['Музыка', 'Спорт', 'Путешествия', 'Кино', 'Книги', 'Искусство']
                .filter(interest => !editData.interests.includes(interest))
                .map((interest) => (
                  <button
                    key={interest}
                    onClick={() => addInterest(interest)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    + {interest}
                  </button>
                ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.interests && profile.interests.length > 0 ? (
              profile.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                >
                  {interest}
                </span>
              ))
            ) : (
              <p className="text-gray-500">Добавьте свои интересы</p>
            )}
          </div>
        )}
      </div>

      {/* Location Section */}
      {profile.location && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <h3 className="font-medium text-gray-900">Местоположение</h3>
              <p className="text-sm text-gray-600">
                {profile.location.city && profile.location.country
                  ? `${profile.location.city}, ${profile.location.country}`
                  : 'Местоположение указано'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Статистика</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-primary-50 rounded-xl">
            <Heart className="w-6 h-6 text-primary-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary-600">0</p>
            <p className="text-sm text-gray-600">Совпадения</p>
          </div>
          <div className="text-center p-4 bg-secondary-50 rounded-xl">
            <Star className="w-6 h-6 text-secondary-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary-600">0</p>
            <p className="text-sm text-gray-600">Лайки</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
