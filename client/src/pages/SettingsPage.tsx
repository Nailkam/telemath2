import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../services/api';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  Bell, 
  Shield, 
  MapPin, 
  Heart, 
  LogOut, 
  Trash2, 
  ChevronRight,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    notifications: {
      newMatches: user?.settings?.notifications?.newMatches ?? true,
      messages: user?.settings?.notifications?.messages ?? true,
      likes: user?.settings?.notifications?.likes ?? true,
    },
    privacy: {
      showAge: user?.settings?.privacy?.showAge ?? true,
      showDistance: user?.settings?.privacy?.showDistance ?? true,
      showOnlineStatus: user?.settings?.privacy?.showOnlineStatus ?? true,
    },
  });

  const updateSettingsMutation = useMutation(
    (newSettings: any) => usersApi.updateSettings(newSettings),
    {
      onSuccess: () => {
        toast.success('Настройки обновлены!');
        queryClient.invalidateQueries(['profile']);
      },
      onError: (error: any) => {
        toast.error('Ошибка обновления настроек');
      },
    }
  );

  const deactivateAccountMutation = useMutation(
    () => usersApi.deactivateAccount(),
    {
      onSuccess: () => {
        toast.success('Аккаунт деактивирован');
        logout();
      },
      onError: (error: any) => {
        toast.error('Ошибка деактивации аккаунта');
      },
    }
  );

  const handleToggle = (category: 'notifications' | 'privacy', setting: string) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: !settings[category][setting as keyof typeof settings[typeof category]],
      },
    };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  const handleDeactivateAccount = () => {
    if (window.confirm('Вы уверены, что хотите деактивировать аккаунт? Это действие нельзя отменить.')) {
      deactivateAccountMutation.mutate();
    }
  };

  const SettingItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    value: boolean;
    onChange: () => void;
  }> = ({ icon, title, description, value, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <button onClick={onChange} className="text-primary-500">
        {value ? (
          <ToggleRight className="w-6 h-6" />
        ) : (
          <ToggleLeft className="w-6 h-6" />
        )}
      </button>
    </div>
  );

  const MenuItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    description?: string;
    onClick: () => void;
    danger?: boolean;
  }> = ({ icon, title, description, onClick, danger = false }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          danger ? 'bg-red-100' : 'bg-primary-100'
        }`}>
          {icon}
        </div>
        <div className="text-left">
          <h3 className={`font-medium ${danger ? 'text-red-600' : 'text-gray-900'}`}>
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      <ChevronRight className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-gray-400'}`} />
    </button>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Profile Summary */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20">
            {user?.photos?.[0] ? (
              <img
                src={user.photos[0].url}
                alt={user.firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {user?.firstName.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="opacity-90">
              {user?.age && `${user.age} лет`}
            </p>
          </div>
        </div>
      </div>

      {/* Notifications Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Уведомления
        </h3>
        <div className="space-y-3">
          <SettingItem
            icon={<Heart className="w-5 h-5 text-primary-500" />}
            title="Новые совпадения"
            description="Получать уведомления о новых совпадениях"
            value={settings.notifications.newMatches}
            onChange={() => handleToggle('notifications', 'newMatches')}
          />
          <SettingItem
            icon={<Bell className="w-5 h-5 text-primary-500" />}
            title="Сообщения"
            description="Получать уведомления о новых сообщениях"
            value={settings.notifications.messages}
            onChange={() => handleToggle('notifications', 'messages')}
          />
          <SettingItem
            icon={<Heart className="w-5 h-5 text-primary-500" />}
            title="Лайки"
            description="Получать уведомления о новых лайках"
            value={settings.notifications.likes}
            onChange={() => handleToggle('notifications', 'likes')}
          />
        </div>
      </div>

      {/* Privacy Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Приватность
        </h3>
        <div className="space-y-3">
          <SettingItem
            icon={<Heart className="w-5 h-5 text-primary-500" />}
            title="Показывать возраст"
            description="Отображать ваш возраст в профиле"
            value={settings.privacy.showAge}
            onChange={() => handleToggle('privacy', 'showAge')}
          />
          <SettingItem
            icon={<MapPin className="w-5 h-5 text-primary-500" />}
            title="Показывать расстояние"
            description="Отображать расстояние до других пользователей"
            value={settings.privacy.showDistance}
            onChange={() => handleToggle('privacy', 'showDistance')}
          />
          <SettingItem
            icon={<Bell className="w-5 h-5 text-primary-500" />}
            title="Статус онлайн"
            description="Показывать, когда вы в сети"
            value={settings.privacy.showOnlineStatus}
            onChange={() => handleToggle('privacy', 'showOnlineStatus')}
          />
        </div>
      </div>

      {/* Account Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Аккаунт
        </h3>
        <div className="space-y-3">
          <MenuItem
            icon={<LogOut className="w-5 h-5 text-primary-500" />}
            title="Выйти из аккаунта"
            description="Выйти из текущего аккаунта"
            onClick={logout}
          />
          <MenuItem
            icon={<Trash2 className="w-5 h-5 text-red-500" />}
            title="Деактивировать аккаунт"
            description="Удалить аккаунт навсегда"
            onClick={handleDeactivateAccount}
            danger
          />
        </div>
      </div>

      {/* App Info */}
      <div className="text-center py-6">
        <p className="text-sm text-gray-500">
          Telegram Dating App v1.0.0
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Сделано с ❤️ для поиска любви
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
