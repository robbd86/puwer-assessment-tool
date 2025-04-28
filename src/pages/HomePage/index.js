import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAssessment } from '../../contexts/AssessmentContext';

const HomePage = () => {
  const { assessments, loading } = useAssessment();
  
  // Function to get completion percentage of an assessment
  const getCompletionPercentage = (assessment) => {
    if (!assessment.answers || Object.keys(assessment.answers).length === 0) return 0;
    // For simplicity, assume 30 questions total (adjust based on your actual CSV)
    return Math.round((Object.keys(assessment.answers).length / 30) * 100);
  };
  
  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <h3>Loading...</h3>
          <p>Please wait while we load your PUWER assessments.</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>PUWER Assessment Dashboard</h1>
        <Button as={Link} to="/assessment" variant="success">
          + New Assessment
        </Button>
      </div>
      
      {/* Stats Overview */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>Total Assessments</Card.Title>
              <h2>{assessments.length}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>Completed</Card.Title>
              <h2>{assessments.filter(a => a.completed).length}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>In Progress</Card.Title>
              <h2>{assessments.filter(a => !a.completed).length}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Recent Assessments */}
      <h3 className="mb-3">Recent Assessments</h3>
      {assessments.length === 0 ? (
        <Card body className="text-center">
          <p>No assessments found.</p>
          <p>Start by creating a new PUWER assessment for your equipment.</p>
          <Button as={Link} to="/assessment" variant="primary">
            Create Assessment
          </Button>
        </Card>
      ) : (
        <Row>
          {assessments.map(assessment => (
            <Col md={6} lg={4} key={assessment.id} className="mb-3">
              <Card>
                <Card.Body>
                  <Card.Title>{assessment.equipmentDetails?.name || 'Unnamed Equipment'}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {assessment.equipmentDetails?.location || 'No location specified'}
                  </Card.Subtitle>
                  
                  <div className="my-3">
                    <small>Created: {new Date(assessment.createdAt).toLocaleDateString()}</small>
                    <br />
                    <small>By: {assessment.equipmentDetails?.assessor || 'Unknown'}</small>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Completion:</span>
                      <span>{getCompletionPercentage(assessment)}%</span>
                    </div>
                    <div className="progress">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${getCompletionPercentage(assessment)}%` }}
                        role="progressbar"
                        aria-valuenow={getCompletionPercentage(assessment)}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>
                  </div>
                  
                  <div className="d-grid gap-2">
                    <Button 
                      as={Link}
                      to={`/assessment/${assessment.id}`}
                      variant={assessment.completed ? "outline-primary" : "primary"}
                    >
                      {assessment.completed ? 'View Assessment' : 'Continue Assessment'}
                    </Button>
                    
                    {assessment.completed && (
                      <Button 
                        as={Link}
                        to={`/report/${assessment.id}`}
                        variant="success"
                      >
                        View Report
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default HomePage;