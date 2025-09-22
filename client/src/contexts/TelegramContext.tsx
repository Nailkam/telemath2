import React, { createContext, useContext, useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  isVerticalSwipesEnabled: boolean;
  ready(): void;
  expand(): void;
  close(): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  enableVerticalSwipes(): void;
  disableVerticalSwipes(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  showPopup(params: any, callback?: (buttonId: string) => void): void;
  showScanQrPopup(params: any, callback?: (text: string) => void): void;
  closeScanQrPopup(): void;
  readTextFromClipboard(callback?: (text: string) => void): void;
  requestWriteAccess(callback?: (granted: boolean) => void): void;
  requestContact(callback?: (granted: boolean) => void): void;
  sendData(data: string): void;
  switchInlineQuery(query: string, choose_chat_types?: string[]): void;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  openInvoice(url: string, callback?: (status: string) => void): void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
    setParams(params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }): void;
  };
  BackButton: {
    isVisible: boolean;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  CloudStorage: {
    setItem(key: string, value: string, callback?: (error: string | null, result?: boolean) => void): void;
    getItem(key: string, callback: (error: string | null, result?: string) => void): void;
    getItems(keys: string[], callback: (error: string | null, result?: Record<string, string>) => void): void;
    removeItem(key: string, callback?: (error: string | null, result?: boolean) => void): void;
    removeItems(keys: string[], callback?: (error: string | null, result?: boolean) => void): void;
    getKeys(callback: (error: string | null, result?: string[]) => void): void;
  };
  onEvent(eventType: string, eventHandler: () => void): void;
  offEvent(eventType: string, eventHandler: () => void): void;
}

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  initData: string;
  isReady: boolean;
}

export const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  user: null,
  initData: '',
  isReady: false,
});

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};

interface TelegramProviderProps {
  children: React.ReactNode;
}

export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    // Check if we're running in Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Initialize the WebApp
      tg.ready();
      tg.expand();
      
      setWebApp(tg);
      setInitData(tg.initData);
      
      if (tg.initDataUnsafe.user) {
        setUser(tg.initDataUnsafe.user);
      }
      
      setIsReady(true);
      
      // Set up theme
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
      document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
      document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
      document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
      document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f1f1f1');
      
      // Set viewport height
      document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
      
      // Handle viewport changes
      const handleViewportChange = () => {
        document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
      };
      
      tg.onEvent('viewportChanged', handleViewportChange);
      
      return () => {
        tg.offEvent('viewportChanged', handleViewportChange);
      };
    } else {
      // Development mode - create mock data
      const mockUser: TelegramUser = {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'mock_hash'
      };
      
      setUser(mockUser);
      setInitData('mock_init_data');
      setIsReady(true);
    }
  }, []);

  const value: TelegramContextType = {
    webApp,
    user,
    initData,
    isReady,
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
