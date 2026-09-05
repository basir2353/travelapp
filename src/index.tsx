import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { App } from './App';
import { THEME_VERSION } from './lib/theme';

document.documentElement.setAttribute('data-theme', THEME_VERSION);
if (Capacitor.getPlatform() === 'ios') {
  document.documentElement.setAttribute('data-platform', 'ios');
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}
