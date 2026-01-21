import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initSentry, captureError } from '@/lib/sentry';
import { ErrorBoundary } from '@/app/router/components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

initSentry();

window.addEventListener('error', event => {
  const err = event.error instanceof Error ? event.error : new Error(event.message || 'Unknown error');
  captureError(err, {
    type: 'window.error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', event => {
  const reason = event.reason instanceof Error
    ? event.reason
    : new Error(typeof event.reason === 'string' ? event.reason : 'Unhandled promise rejection');
  captureError(reason, { type: 'unhandledrejection' });
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
