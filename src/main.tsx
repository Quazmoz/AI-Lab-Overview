// Suppress benign ResizeObserver loop limit / undelivered notification events
if (typeof window !== 'undefined') {
  if (window.ResizeObserver) {
    const NativeResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class SafeResizeObserver extends NativeResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        super((entries, observer) => {
          window.requestAnimationFrame(() => {
            callback(entries, observer);
          });
        });
      }
    };
  }

  const isResizeObserverError = (msg?: string) =>
    Boolean(
      msg &&
        (msg.includes('ResizeObserver loop completed with undelivered notifications') ||
          msg.includes('ResizeObserver loop limit exceeded'))
    );

  window.addEventListener('error', (event) => {
    if (isResizeObserverError(event.message)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message ?? (typeof event.reason === 'string' ? event.reason : '');
    if (isResizeObserverError(msg)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
