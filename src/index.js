import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AssessmentProvider } from './contexts/AssessmentContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AssessmentProvider>
      <App />
    </AssessmentProvider>
  </React.StrictMode>
);
