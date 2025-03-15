import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Ensure `rootElement` is not null before calling `createRoot`
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Root element with ID 'root' not found.");
}

// Create and render the React root
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
