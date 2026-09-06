import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import ProjectBoard from './pages/ProjectBoard';
import Settings from './pages/Settings';
import Toaster from './components/Toaster';

function App() {
  return (
    <UIProvider>
      <NotificationProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<ProjectBoard />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </WorkspaceProvider>
        </AuthProvider>
        <Toaster />
      </NotificationProvider>
    </UIProvider>
  );
}

export default App;