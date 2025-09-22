import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const getTitle = () => {
    const path = location.pathname;
    
    if (path === '/home') return 'Поиск';
    if (path === '/matches') return 'Совпадения';
    if (path === '/messages') return 'Сообщения';
    if (path === '/profile') return 'Профиль';
    if (path === '/settings') return 'Настройки';
    if (path.startsWith('/chat/')) return 'Чат';
    if (path === '/onboarding') return 'Настройка профиля';
    
    return 'Telegram Dating';
  };

  const canGoBack = () => {
    const path = location.pathname;
    return path.startsWith('/chat/') || path === '/settings';
  };

  const handleBack = () => {
    if (canGoBack()) {
      navigate(-1);
    }
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {canGoBack() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <h1 className="text-lg font-semibold text-gray-900">
            {getTitle()}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          {location.pathname !== '/settings' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSettings}
              className="p-2"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
          
          {user && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.firstName.charAt(0)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
