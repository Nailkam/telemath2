import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTelegram } from './TelegramContext';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  age?: number;
  gender: 'male' | 'female' | 'other';
  lookingFor: 'male' | 'female' | 'both';
  bio?: string;
  photos: Array<{
    url: string;
    isMain: boolean;
    uploadedAt: string;
  }>;
  interests: string[];
  location?: {
    coordinates: [number, number];
    city?: string;
    country?: string;
  };
  preferences: {
    ageRange: {
      min: number;
      max: number;
    };
    maxDistance: number;
    showMe: 'male' | 'female' | 'both';
  };
  isVerified: boolean;
  subscription: {
    type: 'free' | 'premium';
    expiresAt?: string;
  };
  settings: {
    notifications: {
      newMatches: boolean;
      messages: boolean;
      likes: boolean;
    };
    privacy: {
      showAge: boolean;
      showDistance: boolean;
      showOnlineStatus: boolean;
    };
  };
  lastSeen: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user: telegramUser, initData } = useTelegram();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check if user is authenticated
  const isAuthenticated = !!token && !!user;

  // Fetch current user data
  const { data: currentUser, isLoading: isUserLoading } = useQuery(
    ['user', 'me'],
    () => authApi.getCurrentUser(),
    {
      enabled: !!token,
      retry: false,
      onError: () => {
        // Token is invalid, clear it
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      },
    }
  );

  // Login mutation
  const loginMutation = useMutation(
    (userData: Partial<User>) => authApi.login(initData, userData),
    {
      onSuccess: (response) => {
        const { user: userData, token: newToken, refreshToken } = response;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', refreshToken);
        toast.success('Добро пожаловать!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Ошибка входа');
      },
    }
  );

  // Refresh token mutation
  const refreshTokenMutation = useMutation(
    () => authApi.refreshToken(),
    {
      onSuccess: (response) => {
        const { token: newToken, refreshToken } = response;
        setToken(newToken);
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', refreshToken);
      },
      onError: () => {
        // Refresh failed, logout user
        logout();
      },
    }
  );

  // Auto-login on app start
  useEffect(() => {
    const initializeAuth = async () => {
      if (!telegramUser || !initData) {
        setIsLoading(false);
        return;
      }

      // If we have a token, try to get current user
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData.user);
        } catch (error) {
          // Token is invalid, try to refresh
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              await refreshTokenMutation.mutateAsync();
            } catch {
              // Refresh failed, clear tokens
              setToken(null);
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
            }
          }
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, [telegramUser, initData, token]);

  // Update user when current user data changes
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser.user);
    }
  }, [currentUser]);

  const login = async (userData: Partial<User>) => {
    await loginMutation.mutateAsync(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    queryClient.clear();
    toast.success('Вы вышли из аккаунта');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const refreshToken = async () => {
    await refreshTokenMutation.mutateAsync();
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || isUserLoading,
    login,
    logout,
    updateUser,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
