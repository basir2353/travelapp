import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MobileFrame } from './components/MobileFrame';
import { AuthProvider } from './components/AuthContext';
import { AuthGate } from './components/AuthGate';
import { Travel } from './pages/Travel';

function AppRoutes() {
  return (
    <AuthGate>
      <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        <Routes>
          <Route path="/" element={<Travel />} />
          <Route path="/travel" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthGate>
  );
}

export function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <MobileFrame>
          <AppRoutes />
        </MobileFrame>
        <Toaster position="top-center" closeButton richColors={false} />
      </AuthProvider>
    </HashRouter>
  );
}
