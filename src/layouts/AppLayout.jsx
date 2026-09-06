import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import CommandPalette from '../components/CommandPalette';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useUI();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar (Responsive: Fixed on desktop, sliding drawer on mobile) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-auto transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <Outlet />
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
