import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      toast.error('Ошибка сервера. Попробуйте позже.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Превышено время ожидания. Проверьте соединение.');
    }
    return Promise.reject(error);
  }
);

// Types
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

interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

interface Match {
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName?: string;
    age?: number;
    photos: Array<{
      url: string;
      isMain: boolean;
    }>;
    lastSeen: string;
  };
  matchedAt: string;
  lastMessage?: {
    content: string;
    type: string;
    createdAt: string;
    isRead: boolean;
  };
}

interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'sticker' | 'gif';
  mediaUrl?: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
  replyTo?: string;
}

// Auth API
export const authApi = {
  login: (initData: string, userData: Partial<User>): Promise<LoginResponse> =>
    api.post('/auth/telegram', { initData, ...userData }).then(res => res.data),

  refreshToken: (): Promise<{ token: string; refreshToken: string }> =>
    api.post('/auth/refresh', { 
      refreshToken: localStorage.getItem('refreshToken') 
    }).then(res => res.data),

  getCurrentUser: (): Promise<{ user: User }> =>
    api.get('/auth/me').then(res => res.data),

  logout: (): Promise<void> =>
    api.post('/auth/logout').then(res => res.data),
};

// Users API
export const usersApi = {
  getProfile: (): Promise<{ user: User }> =>
    api.get('/users/profile').then(res => res.data),

  updateProfile: (userData: Partial<User>): Promise<{ user: User }> =>
    api.put('/users/profile', userData).then(res => res.data),

  uploadPhoto: (file: File, isMain: boolean = false): Promise<{ photo: { url: string; isMain: boolean } }> => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('isMain', isMain.toString());
    
    return api.post('/users/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },

  setMainPhoto: (photoId: string): Promise<void> =>
    api.put(`/users/photos/${photoId}/main`).then(res => res.data),

  deletePhoto: (photoId: string): Promise<void> =>
    api.delete(`/users/photos/${photoId}`).then(res => res.data),

  updateLocation: (location: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  }): Promise<{ location: any }> =>
    api.put('/users/location', location).then(res => res.data),

  getPotentialMatches: (limit: number = 20, skip: number = 0): Promise<{ matches: User[]; hasMore: boolean }> =>
    api.get(`/users/matches/potential?limit=${limit}&skip=${skip}`).then(res => res.data),

  searchUsers: (params: {
    ageMin?: number;
    ageMax?: number;
    gender?: string;
    interests?: string;
    maxDistance?: number;
    limit?: number;
    skip?: number;
  }): Promise<{ users: User[]; hasMore: boolean }> =>
    api.get('/users/search', { params }).then(res => res.data),

  getUser: (userId: string): Promise<{ user: User }> =>
    api.get(`/users/${userId}`).then(res => res.data),

  updateSettings: (settings: {
    notifications?: any;
    privacy?: any;
  }): Promise<{ settings: any }> =>
    api.put('/users/settings', settings).then(res => res.data),

  deactivateAccount: (): Promise<void> =>
    api.put('/users/deactivate').then(res => res.data),
};

// Matches API
export const matchesApi = {
  swipe: (targetUserId: string, action: 'like' | 'pass' | 'superlike'): Promise<{ isMatch: boolean; action: string }> =>
    api.post('/matches/swipe', { targetUserId, action }).then(res => res.data),

  getMatches: (): Promise<{ matches: Match[] }> =>
    api.get('/matches').then(res => res.data),

  getMatch: (matchId: string): Promise<{ match: Match }> =>
    api.get(`/matches/${matchId}`).then(res => res.data),

  unmatch: (matchId: string): Promise<void> =>
    api.delete(`/matches/${matchId}`).then(res => res.data),

  getSwipeHistory: (limit: number = 50, skip: number = 0): Promise<{ swipes: any[]; hasMore: boolean }> =>
    api.get(`/matches/history/swipes?limit=${limit}&skip=${skip}`).then(res => res.data),

  getReceivedLikes: (limit: number = 20, skip: number = 0): Promise<{ likes: any[]; hasMore: boolean }> =>
    api.get(`/matches/likes/received?limit=${limit}&skip=${skip}`).then(res => res.data),

  getSentLikes: (limit: number = 20, skip: number = 0): Promise<{ likes: any[]; hasMore: boolean }> =>
    api.get(`/matches/likes/sent?limit=${limit}&skip=${skip}`).then(res => res.data),

  getStats: (): Promise<{ stats: any }> =>
    api.get('/matches/stats').then(res => res.data),
};

// Messages API
export const messagesApi = {
  getConversations: (): Promise<{ conversations: any[] }> =>
    api.get('/messages/conversations').then(res => res.data),

  getConversation: (userId: string, limit: number = 50, skip: number = 0): Promise<{ messages: Message[]; hasMore: boolean }> =>
    api.get(`/messages/conversation/${userId}?limit=${limit}&skip=${skip}`).then(res => res.data),

  sendMessage: (message: {
    receiverId: string;
    content: string;
    type?: 'text' | 'image' | 'sticker' | 'gif';
    mediaUrl?: string;
    replyTo?: string;
  }): Promise<{ data: Message }> =>
    api.post('/messages/send', message).then(res => res.data),

  markConversationAsRead: (userId: string): Promise<void> =>
    api.put(`/messages/conversation/${userId}/read`).then(res => res.data),

  deleteMessage: (messageId: string): Promise<void> =>
    api.delete(`/messages/${messageId}`).then(res => res.data),

  getUnreadCount: (): Promise<{ unreadCount: number }> =>
    api.get('/messages/unread/count').then(res => res.data),

  searchMessages: (params: {
    query: string;
    userId?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ messages: Message[]; hasMore: boolean }> =>
    api.get('/messages/search', { params }).then(res => res.data),

  reportMessage: (messageId: string, reason: string, description?: string): Promise<void> =>
    api.post(`/messages/${messageId}/report`, { reason, description }).then(res => res.data),
};

export default api;
