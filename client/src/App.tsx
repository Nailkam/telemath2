// client/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TelegramProvider } from './contexts/TelegramContext';
import { SocketProvider } from './contexts/SocketContext';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import MatchesPage from './pages/MatchesPage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

const App: React.FC = () => {
  return (
    <TelegramProvider>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<HomePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="matches" element={<MatchesPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="chat/:userId" element={<ChatPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </TelegramProvider>
  );
};

export default App;