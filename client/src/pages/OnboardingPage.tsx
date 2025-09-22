import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Camera, MapPin, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  } | null>(null);

  const updateProfileMutation = useMutation(
    (data: any) => usersApi.updateProfile(data),
    {
      onSuccess: (response) => {
        updateUser(response.user);
        toast.success('Профиль обновлен!');
        navigate('/home');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Ошибка обновления профиля');
      },
    }
  );

  const uploadPhotoMutation = useMutation(
    (file: File) => usersApi.uploadPhoto(file, photos.length === 0),
    {
      onSuccess: () => {
        toast.success('Фото загружено!');
      },
      onError: (error: any) => {
        toast.error('Ошибка загрузки фото');
      },
    }
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const file = files[0];
      setPhotos(prev => [...prev, file]);
      uploadPhotoMutation.mutate(file);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast.success('Местоположение определено!');
        },
        (error) => {
          toast.error('Не удалось определить местоположение');
        }
      );
    } else {
      toast.error('Геолокация не поддерживается');
    }
  };

  const handleComplete = () => {
    const data: any = {};
    
    if (location) {
      data.location = location;
    }
    
    updateProfileMutation.mutate(data);
  };

  const canComplete = () => {
    return photos.length > 0 && location;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Завершите настройку профиля
          </h1>
          <p className="text-gray-600">
            Добавьте фото и укажите местоположение
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Photos */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Добавьте фото
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300"
                  >
                    {photos[index - 1] ? (
                      <img
                        src={URL.createObjectURL(photos[index - 1])}
                        alt={`Photo ${index}`}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Фото {index}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              
              <Button
                variant="outline"
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="w-full"
                disabled={photos.length >= 4}
              >
                <Camera className="w-4 h-4 mr-2" />
                {photos.length >= 4 ? 'Максимум 4 фото' : 'Добавить фото'}
              </Button>
            </div>
          </div>

          {/* Step 2: Location */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Укажите местоположение
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {location ? 'Местоположение определено' : 'Местоположение не указано'}
                    </p>
                    {location && (
                      <p className="text-xs text-gray-500">
                        Широта: {location.latitude.toFixed(4)}, 
                        Долгота: {location.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={getCurrentLocation}
                className="w-full"
                disabled={!!location}
              >
                <MapPin className="w-4 h-4 mr-2" />
                {location ? 'Местоположение определено' : 'Определить местоположение'}
              </Button>
            </div>
          </div>

          {/* Complete Button */}
          <Button
            onClick={handleComplete}
            loading={updateProfileMutation.isLoading}
            disabled={!canComplete()}
            className="w-full"
            size="lg"
          >
            Завершить настройку
          </Button>

          <div className="text-center">
            <button
              onClick={() => navigate('/home')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Пропустить и продолжить позже
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
