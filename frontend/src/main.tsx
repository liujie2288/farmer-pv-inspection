import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { initToast } from './components/ui/Toast';
import { initDialog } from './components/ui/Dialog';
import { initImagePreview } from './components/ui/ImagePreview';
import './index.css';

initToast();
initDialog();
initImagePreview();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
