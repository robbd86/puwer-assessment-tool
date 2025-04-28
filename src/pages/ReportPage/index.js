import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Badge, Alert } from 'react-bootstrap';
import { useAssessment } from '../../contexts/AssessmentContext';
import { generatePDF, savePDF } from '../../services/pdfService';

const ReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { assessments, questions, loading } = useAssessment();
  
  const [assessment, setAssessment] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Load assessment data
  useEffect(() => {
    if (id && assessments.length > 0) {
      const existingAssessment = assessments.find(a => a.id === id);
      if (existingAssessment) {
        setAssessment(existingAssessment);
      } else {
        // Assessment not found
        navigate('/');
      }
    }
  }, [id, assessments, navigate]);
  
  // Calculate statistics
  const getStatistics = () => {
    if (!assessment || !assessment.answers) return { yes: 0, no: 0, na: 0, total: 0, completion: 0 };
    
    const answerCounts = Object.values(assessment.answers).reduce((counts, answer) => {
      counts[answer.answer]++;
      return counts;
    }, { yes: 0, no: 0, na: 0 });
    
    const answeredCount = Object.keys(assessment.answers).length;
    const totalQuestions = questions.length;
    const completion = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
    
    return {
      ...answerCounts,
      total: answeredCount,
      completion
    };
  };
  
  // Generate and download PDF report
  const handleGeneratePDF = async () => {
    if (!assessment) return;
    setGenerating(true);
    setError('');
    try {
      const doc = await generatePDF(assessment, questions); // Await the async function
      savePDF(doc, assessment);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  // Group questions by section
  const getSectionedQuestions = () => {
    const sectionedQuestions = {};
    
    questions.forEach(q => {
      if (!sectionedQuestions[q.section]) {
        sectionedQuestions[q.section] = [];
      }
      sectionedQuestions[q.section].push(q);
    });
    
    return sectionedQuestions;
  };
  
  if (loading || !assessment) {
    return (
      <Container>
        <div className="text-center py-5">
          <h3>Loading...</h3>
          <p>Please wait while we load your assessment report.</p>
        </div>
      </Container>
    );
  }
  
  const stats = getStatistics();
  const sectionedQuestions = getSectionedQuestions();
  
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>PUWER Assessment Report</h1>
        <div>
          <Button 
            variant="primary" 
            onClick={handleGeneratePDF}
            disabled={generating}
            className="me-2"
          >
            {generating ? 'Generating...' : 'Download PDF Report'}
          </Button>
          <Button 
            as={Link} 
            to={`/assessment/${assessment.id}`} 
            variant="outline-secondary"
          >
            Edit Assessment
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}
      
      {/* Equipment Details */}
      <Card className="mb-4">
        <Card.Header>
          <h3>Equipment Details</h3>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p><strong>Equipment:</strong> {assessment.equipmentDetails?.name || 'Not specified'}</p>
              <p><strong>Location:</strong> {assessment.equipmentDetails?.location || 'Not specified'}</p>
            </Col>
            <Col md={6}>
              <p><strong>Reference:</strong> {assessment.equipmentDetails?.reference || 'Not specified'}</p>
              <p><strong>Assessor:</strong> {assessment.equipmentDetails?.assessor || 'Not specified'}</p>
              <p><strong>Date:</strong> {new Date(assessment.createdAt).toLocaleDateString()}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Assessment Statistics */}
      <Card className="mb-4">
        <Card.Header>
          <h3>Assessment Summary</h3>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="mb-3">
                <h5>Completion Rate:</h5>
                <div className="progress">
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ width: `${stats.completion}%` }}
                    aria-valuenow={stats.completion} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  >
                    {stats.completion}%
                  </div>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex justify-content-around">
                <div className="text-center">
                  <h5>Compliant</h5>
                  <Badge bg="success" className="p-2 fs-6">{stats.yes}</Badge>
                </div>
                <div className="text-center">
                  <h5>Non-Compliant</h5>
                  <Badge bg="danger" className="p-2 fs-6">{stats.no}</Badge>
                </div>
                <div className="text-center">
                  <h5>Not Applicable</h5>
                  <Badge bg="secondary" className="p-2 fs-6">{stats.na}</Badge>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Assessment Details */}
      <Card className="mb-4">
        <Card.Header>
          <h3>Assessment Details</h3>
        </Card.Header>
        <Card.Body>
          {Object.entries(sectionedQuestions).map(([section, sectionQuestions]) => (
            <div key={section} className="mb-4">
              <h4 className="section-header">Section {section}</h4>
              
              <Row>
                {sectionQuestions.map(question => {
                  const answer = assessment.answers[question.regulationNumber];
                  return (
                    <Col md={6} key={question.regulationNumber} className="mb-3">
                      <Card className={`question-card ${answer?.answer || ''}`}>
                        <Card.Body>
                          <Card.Title>{question.regulationNumber}</Card.Title>
                          <Card.Text>{question.text}</Card.Text>
                          
                          {answer ? (
                            <>
                              <div className="mb-2">
                                <Badge 
                                  bg={answer.answer === 'yes' ? 'success' : answer.answer === 'no' ? 'danger' : 'secondary'}
                                  className="p-2"
                                >
                                  {answer.answer === 'yes' ? 'Compliant' : answer.answer === 'no' ? 'Non-Compliant' : 'N/A'}
                                </Badge>
                              </div>
                              
                              {answer.comments && (
                                <div className="mb-2">
                                  <strong>Comments:</strong> {answer.comments}
                                </div>
                              )}
                              
                              {answer.photos && answer.photos.length > 0 && (
                                <div>
                                  <strong>Evidence:</strong> {answer.photos.length} photo(s) attached
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-muted">No answer provided</div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          ))}
        </Card.Body>
      </Card>
      
      {/* Recommendations */}
      <Card className="mb-4">
        <Card.Header>
          <h3>Recommendations</h3>
        </Card.Header>
        <Card.Body>
          {assessment.recommendations && assessment.recommendations.length > 0 ? (
            assessment.recommendations.map(rec => (
              <Card key={rec.id} className="mb-3">
                <Card.Body>
                  <Card.Title className="d-flex justify-content-between">
                    <span>{rec.text}</span>
                    <Badge 
                      bg={
                        rec.priority === 'High' ? 'danger' : 
                        rec.priority === 'Medium' ? 'warning' : 'info'
                      }
                    >
                      {rec.priority} Priority
                    </Badge>
                  </Card.Title>
                  <div className="mt-2">
                    <strong>Assigned to:</strong> {rec.assignee}
                    <br />
                    <strong>Due date:</strong> {rec.dueDate}
                  </div>
                </Card.Body>
              </Card>
            ))
          ) : (
            <p>No recommendations have been added to this assessment.</p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ReportPage;