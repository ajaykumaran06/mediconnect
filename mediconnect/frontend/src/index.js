import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './lib/i18n'; // Initialize i18n before App renders
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
