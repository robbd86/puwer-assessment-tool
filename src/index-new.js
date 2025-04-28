import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// Simple test component
function App() {
  return (
    <div className="container p-5">
      <div className="alert alert-success">
        <h2>PUWER Assessment Tool</h2>
        <p>React is rendering successfully!</p>
      </div>
    </div>
  );
}

// Mount React using the new React 18 API
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);