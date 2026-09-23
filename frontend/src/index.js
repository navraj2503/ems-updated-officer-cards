import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import './styles/components.css';
import App from './App';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './components/Notification';

// ===== APP ENTRY POINT =====
// Wraps the entire app in:
// - AppProvider: global state (database, current user, all mutations)
// - NotificationProvider: toast notification system

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AppProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AppProvider>
  </React.StrictMode>
);
