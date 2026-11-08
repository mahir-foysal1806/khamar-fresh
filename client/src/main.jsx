import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <SettingsProvider>
          <CartProvider>
            <AuthProvider>
              <App />
              <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', fontSize: '14px' } }} />
            </AuthProvider>
          </CartProvider>
        </SettingsProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
