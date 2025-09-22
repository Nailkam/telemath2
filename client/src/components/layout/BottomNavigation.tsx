import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, User, Search } from 'lucide-react';
import { clsx } from 'clsx';

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      path: '/home',
      icon: Search,
      label: 'Поиск',
    },
    {
      path: '/matches',
      icon: Heart,
      label: 'Совпадения',
    },
    {
      path: '/messages',
      icon: MessageCircle,
      label: 'Сообщения',
    },
    {
      path: '/profile',
      icon: User,
      label: 'Профиль',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors',
                active
                  ? 'text-primary-500 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className={clsx('w-6 h-6', active && 'stroke-2')} />
              <span className={clsx(
                'text-xs mt-1 font-medium',
                active ? 'text-primary-500' : 'text-gray-500'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
