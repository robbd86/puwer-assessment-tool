import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import AssessmentPage from './pages/AssessmentPage';
import ReportPage from './pages/ReportPage';
import { AssessmentProvider } from './contexts/AssessmentContext';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log error info here if needed
    // console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AssessmentProvider>
        <Router>
          <Header />
          <Container className="py-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/assessment/:id?" element={<AssessmentPage />} />
              <Route path="/report/:id" element={<ReportPage />} />
            </Routes>
          </Container>
        </Router>
      </AssessmentProvider>
    </ErrorBoundary>
  );
}

export default App;
