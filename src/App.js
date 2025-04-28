import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import AssessmentPage from './pages/AssessmentPage';
import ReportPage from './pages/ReportPage';
import { AssessmentProvider } from './contexts/AssessmentContext';

function App() {
  return (
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
  );
}

export default App;
