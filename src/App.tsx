/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import POSLayout from './pages/POSLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { initializeData } from './data/initialData';
import PrintArea from './components/print/PrintArea';
import OfflineIndicator from './components/pwa/OfflineIndicator';
import PWAUpdatePrompt from './components/pwa/PWAUpdatePrompt';
import InstallPrompt from './components/pwa/InstallPrompt';
import DynamicPromptModal from './components/modals/DynamicPromptModal';
import GlobalSearch from './components/ui/GlobalSearch';
import SyncDebugPanel from './components/debug/SyncDebugPanel';
import { PrinterProvider } from './context/PrinterContext';

export default function App() {
  useEffect(() => {
    initializeData();
  }, []);

  return (
    <HashRouter>
      <PrinterProvider>
        <div className="min-h-screen bg-background text-text-primary font-sans">
          <OfflineIndicator />
          <PWAUpdatePrompt />
          <InstallPrompt />
          
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/pos" 
              element={
                <ProtectedRoute>
                  <POSLayout />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          <PrintArea />
          <DynamicPromptModal />
          <GlobalSearch />
          <SyncDebugPanel />
        </div>
      </PrinterProvider>
    </HashRouter>
  );
}

