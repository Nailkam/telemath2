import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useTelegram } from '../hooks/useTelegram';
import { authApi } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Heart, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: telegramUser, isReady } = useTelegram();
  const { login, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    lookingFor: 'both' as 'male' | 'female' | 'both',
    bio: '',
    interests: [] as string[],
  });

  const [step, setStep] = useState(1);

  const loginMutation = useMutation(
    (userData: any) => login(userData),
    {
      onSuccess: () => {
        const from = location.state?.from?.pathname || '/home';
        navigate(from, { replace: true });
      },
      onError: (error: any) => {
        toast.error(error.message || 'Ошибка входа');
      },
    }
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isReady && telegramUser) {
      setFormData(prev => ({
        ...prev,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name || '',
      }));
    }
  }, [isReady, telegramUser]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!formData.firstName || !formData.age || !formData.gender) {
        toast.error('Заполните все обязательные поля');
        return;
      }
      setStep(2);
    } else {
      loginMutation.mutate(formData);
    }
  };

  const addInterest = (interest: string) => {
    if (interest.trim() && !formData.interests.includes(interest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest.trim()],
      }));
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest),
    }));
  };

  const commonInterests = [
    'Музыка', 'Спорт', 'Путешествия', 'Кино', 'Книги', 'Искусство',
    'Кулинария', 'Фотография', 'Танцы', 'Игры', 'Природа', 'Технологии'
  ];

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Добро пожаловать!
          </h1>
          <p className="text-gray-600">
            Создайте профиль и найдите свою любовь
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Шаг {step} из 2
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((step / 2) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="space-y-4">
                <Input
                  label="Имя *"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Введите ваше имя"
                />

                <Input
                  label="Фамилия"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Введите вашу фамилию"
                />

                <Input
                  label="Возраст *"
                  type="number"
                  min="18"
                  max="100"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Введите ваш возраст"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Пол *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['male', 'female', 'other'].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => handleInputChange('gender', gender)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                          formData.gender === gender
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {gender === 'male' ? 'Мужской' : 
                         gender === 'female' ? 'Женский' : 'Другой'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ищу
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['male', 'female', 'both'].map((lookingFor) => (
                      <button
                        key={lookingFor}
                        type="button"
                        onClick={() => handleInputChange('lookingFor', lookingFor)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                          formData.lookingFor === lookingFor
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {lookingFor === 'male' ? 'Мужчин' : 
                         lookingFor === 'female' ? 'Женщин' : 'Всех'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    О себе
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Расскажите о себе..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio.length}/500 символов
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Интересы
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {commonInterests
                      .filter(interest => !formData.interests.includes(interest))
                      .map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => addInterest(interest)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                        >
                          + {interest}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Назад
                </Button>
              )}
              <Button
                type="submit"
                loading={loginMutation.isLoading}
                className="flex-1"
              >
                {step === 1 ? 'Далее' : 'Создать профиль'}
              </Button>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Создавая аккаунт, вы соглашаетесь с нашими{' '}
            <a href="#" className="text-primary-500 hover:underline">
              Условиями использования
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
