import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import Header from './Header';

const MainLayout: React.FC = () => {
  const location = useLocation();
  
  // Hide navigation on certain pages
  const hideNavigation = ['/onboarding', '/chat'].some(path => 
    location.pathname.includes(path)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      
      {!hideNavigation && <BottomNavigation />}
    </div>
  );
};

export default MainLayout;
