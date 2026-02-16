import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './styles/index.css';

// HashRouter is required for GitHub Pages (no server-side routing)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '12px', fontSize: '14px' },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);
