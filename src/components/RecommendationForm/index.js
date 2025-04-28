import React, { useState } from 'react';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import { useAssessment } from '../../contexts/AssessmentContext';

const RecommendationForm = ({ assessmentId }) => {
  const { addRecommendation } = useAssessment();
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [validated, setValidated] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    
    // Form validation
    if (!form.checkValidity()) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    // Add the recommendation to the assessment
    addRecommendation(assessmentId, {
      text,
      priority,
      assignee,
      dueDate
    });
    
    // Reset form
    setText('');
    setPriority('Medium');
    setAssignee('');
    setDueDate('');
    setValidated(false);
  };
  
  // Set default date to 14 days from now if not set
  const handleAddRecommendation = () => {
    if (!dueDate) {
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
      setDueDate(twoWeeksFromNow.toISOString().split('T')[0]);
    }
  };
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <h4>Add New Recommendation</h4>
      </Card.Header>
      <Card.Body>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Recommendation*</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              placeholder="Describe the recommendation or corrective action needed..."
            />
            <Form.Control.Feedback type="invalid">
              Please provide a recommendation.
            </Form.Control.Feedback>
          </Form.Group>
          
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Priority Level</Form.Label>
                <Form.Select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Assignee*</Form.Label>
                <Form.Control
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  required
                  placeholder="Person responsible"
                />
                <Form.Control.Feedback type="invalid">
                  Please specify who is responsible.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Due Date*</Form.Label>
                <Form.Control
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please specify a due date.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          
          <div className="mt-3 d-grid">
            <Button 
              variant="primary" 
              type="submit" 
              onClick={handleAddRecommendation}
            >
              Add Recommendation
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default RecommendationForm;