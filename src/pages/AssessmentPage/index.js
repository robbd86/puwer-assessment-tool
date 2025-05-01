import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Form, 
  Button, 
  Tabs, 
  Tab, 
  Alert,
  Row,
  Col
} from 'react-bootstrap';
import { useAssessment } from '../../contexts/AssessmentContext';
import { loadQuestions } from '../../services/csvService';
import { getRecommendations } from '../../services/mcpService';
import QuestionCard from '../../components/QuestionCard';
import RecommendationForm from '../../components/RecommendationForm';
import PhotoUploader from '../../components/PhotoUploader';

const AssessmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    assessments, 
    questions, 
    loading, 
    createAssessment, 
    updateAssessment, 
    completeAssessment,
    setQuestions
  } = useAssessment();
  
  const [assessment, setAssessment] = useState(null);
  const [equipmentDetails, setEquipmentDetails] = useState({
    name: '',
    location: '',
    reference: '',
    assessor: ''
  });
  const [activeTab, setActiveTab] = useState('details');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [mcpRecommendations, setMcpRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [nameplatePhotos, setNameplatePhotos] = useState([]);
  
  // Load questions from CSV if not already loaded
  useEffect(() => {
    if (questions.length === 0) {
      const fetchQuestions = async () => {
        try {
          const loadedQuestions = await loadQuestions();
          setQuestions(loadedQuestions);
        } catch (error) {
          console.error('Error loading questions:', error);
          setMessage('Failed to load PUWER questions. Please refresh the page.');
          setMessageType('danger');
        }
      };
      
      fetchQuestions();
    }
  }, [questions, setQuestions]);
  
  // Load existing assessment if ID is provided
  useEffect(() => {
    if (id && assessments.length > 0) {
      const existingAssessment = assessments.find(a => a.id === id);
      if (existingAssessment) {
        setAssessment(existingAssessment);
        setEquipmentDetails(existingAssessment.equipmentDetails || {});
        setNameplatePhotos(existingAssessment.equipmentDetails?.nameplatePhotos || []);
        setActiveTab('assessment');
      } else {
        // Assessment not found
        navigate('/');
      }
    }
  }, [id, assessments, navigate]);
  
  // Keep equipmentDetails.nameplatePhotos in sync
  useEffect(() => {
    setEquipmentDetails(prev => ({ ...prev, nameplatePhotos }));
    if (id) {
      updateAssessment(id, { equipmentDetails: { ...equipmentDetails, nameplatePhotos } });
    }
  }, [nameplatePhotos]);
  
  // Handle equipment details changes
  const handleEquipmentDetailsChange = (e) => {
    const { name, value } = e.target;
    setEquipmentDetails(prev => ({ ...prev, [name]: value }));
  };
  
  // Start or update assessment
  const handleStartAssessment = () => {
    if (!equipmentDetails.name || !equipmentDetails.assessor) {
      setMessage('Please enter equipment name and assessor name to continue.');
      setMessageType('danger');
      return;
    }
    
    setMessage('');
    
    if (!id) {
      // Create new assessment
      const newId = createAssessment(equipmentDetails);
      navigate(`/assessment/${newId}`);
    } else {
      // Update existing assessment
      updateAssessment(id, { equipmentDetails });
      setActiveTab('assessment');
    }
  };
  
  // Generate recommendations using MCP
  const handleGenerateRecommendations = async () => {
    if (!assessment) return;
    
    setLoadingRecommendations(true);
    
    try {
      const recommendations = await getRecommendations(assessment);
      setMcpRecommendations(recommendations);
      setMessage('Recommendations generated successfully.');
      setMessageType('success');
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setMessage('Failed to generate recommendations. Please try again.');
      setMessageType('danger');
    }
    
    setLoadingRecommendations(false);
    setActiveTab('recommendations');
  };
  
  // Complete assessment and go to report
  const handleCompleteAssessment = () => {
    if (!assessment) return;
    
    // Check if we have answers for at least some questions
    const answerCount = Object.keys(assessment.answers).length;
    if (answerCount === 0) {
      setMessage('Please answer at least one question before completing the assessment.');
      setMessageType('danger');
      return;
    }
    
    completeAssessment(assessment.id);
    navigate(`/report/${assessment.id}`);
  };
  
  // Add this new handler for next to recommendations button
  const handleNextToRecommendations = () => {
    if (id && assessment) {
      try {
        // Force update the assessment with current data
        updateAssessment(id, { 
          ...assessment,
          modifiedAt: new Date().toISOString() 
        });
        
        // Force a tab change with a small delay to ensure state updates
        setTimeout(() => {
          setActiveTab('recommendations');
          
          // Show a success message
          setMessage('Assessment saved successfully');
          setMessageType('success');
          
          // Force a redraw by setting a state value
          setAssessment({...assessment});
        }, 100);
      } catch (error) {
        console.error("Error saving assessment:", error);
        setMessage('Error saving assessment. Please try again.');
        setMessageType('danger');
      }
    } else {
      // Just change tabs if no assessment
      setActiveTab('recommendations');
    }
  };
  
  // Group questions by section
  const sectionedQuestions = {};
  questions.forEach(question => {
    if (!sectionedQuestions[question.section]) {
      sectionedQuestions[question.section] = [];
    }
    sectionedQuestions[question.section].push(question);
  });
  
  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <h3>Loading...</h3>
          <p>Please wait while we set up your PUWER assessment.</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <h1 className="mb-4">{id ? 'Edit Assessment' : 'New Assessment'}</h1>
      
      {message && (
        <Alert variant={messageType} onClose={() => setMessage('')} dismissible>
          {message}
        </Alert>
      )}
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="details" title="Equipment Details">
          <Card>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Equipment Name*</Form.Label>
                      <Form.Control 
                        type="text"
                        name="name"
                        value={equipmentDetails.name || ''}
                        onChange={handleEquipmentDetailsChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location*</Form.Label>
                      <Form.Control 
                        type="text"
                        name="location"
                        value={equipmentDetails.location || ''}
                        onChange={handleEquipmentDetailsChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Reference Number</Form.Label>
                      <Form.Control 
                        type="text"
                        name="reference"
                        value={equipmentDetails.reference || ''}
                        onChange={handleEquipmentDetailsChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Assessor Name*</Form.Label>
                      <Form.Control 
                        type="text"
                        name="assessor"
                        value={equipmentDetails.assessor || ''}
                        onChange={handleEquipmentDetailsChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nameplate / Machine Info</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="nameplateInfo"
                        value={equipmentDetails.nameplateInfo || ''}
                        onChange={handleEquipmentDetailsChange}
                        placeholder="Enter details from the machine nameplate, serial number, manufacturer, etc."
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nameplate / Machine Info Photos</Form.Label>
                      <PhotoUploader photos={nameplatePhotos} onChange={setNameplatePhotos} />
                      <Form.Text muted>
                        Upload clear photos of the machine nameplate, serial number, or other key info.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Button 
                  variant="primary" 
                  onClick={handleStartAssessment}
                >
                  {id ? 'Update Details & Continue' : 'Start Assessment'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="assessment" title="Assessment Questions" disabled={!id}>
          {assessment && (
            <>
              {Object.entries(sectionedQuestions).length > 0 ? (
                Object.entries(sectionedQuestions).map(([section, sectionQuestions]) => (
                  <div key={section} className="mb-4">
                    <h3 className="section-header">Section {section}</h3>
                    
                    {sectionQuestions.map(question => (
                      <QuestionCard
                        key={question.regulationNumber}
                        question={question}
                        assessmentId={assessment.id}
                        value={assessment.answers[question.regulationNumber]}
                      />
                    ))}
                  </div>
                ))
              ) : (
                <Alert variant="info">
                  No questions loaded. Please ensure your CSV file is properly formatted and accessible.
                </Alert>
              )}
              
              <div className="d-flex justify-content-between mt-4">
                <Button 
                  variant="primary" 
                  onClick={handleNextToRecommendations}
                >
                  Next: Recommendations
                </Button>
              </div>
            </>
          )}
        </Tab>
        
        <Tab eventKey="recommendations" title="Recommendations" disabled={!id}>
          {assessment && (
            <>
              <Card className="mb-4">
                <Card.Header>
                  <h4>AI-Generated Recommendations</h4>
                </Card.Header>
                <Card.Body>
                  <p>
                    Generate recommendations based on your assessment answers using the MCP AI assistant.
                    These recommendations can help you address non-compliance issues identified during the assessment.
                  </p>
                  
                  <Button 
                    variant="outline-primary" 
                    onClick={handleGenerateRecommendations}
                    disabled={loadingRecommendations}
                  >
                    {loadingRecommendations ? 'Generating...' : 'Generate Recommendations'}
                  </Button>
                  
                  {mcpRecommendations.length > 0 && (
                    <div className="mt-4">
                      <h5>Generated Recommendations:</h5>
                      {mcpRecommendations.map((rec, index) => (
                        <Card key={index} className="mb-2">
                          <Card.Body>
                            <h6>For Question {rec.questionId}:</h6>
                            <p>{rec.text}</p>
                            <div>
                              <small>
                                <strong>Priority:</strong> {rec.priority} | 
                                <strong> Assignee:</strong> {rec.assignee} | 
                                <strong> Due:</strong> {rec.dueDate}
                              </small>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
              
              <h4 className="mb-3">Custom Recommendations</h4>
              
              {assessment.recommendations.length > 0 && (
                <div className="mb-4">
                  <h5>Added Recommendations:</h5>
                  {assessment.recommendations.map((rec) => (
                    <Card key={rec.id} className="mb-2">
                      <Card.Body>
                        <p>{rec.text}</p>
                        <div>
                          <small>
                            <strong>Priority:</strong> {rec.priority} | 
                            <strong> Assignee:</strong> {rec.assignee} | 
                            <strong> Due:</strong> {rec.dueDate}
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
              
              <RecommendationForm assessmentId={assessment.id} />
              
              <div className="d-flex justify-content-between mt-4">
                <Button 
                  variant="primary" 
                  onClick={() => setActiveTab('assessment')}
                >
                  Back to Questions
                </Button>
                <Button 
                  variant="success" 
                  onClick={handleCompleteAssessment}
                >
                  Complete Assessment
                </Button>
              </div>
            </>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AssessmentPage;