import React, { useState, useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { useAssessment } from '../../contexts/AssessmentContext';
import { getQuestionHelp } from '../../services/mcpService';
import PhotoUploader from '../PhotoUploader';

const QuestionCard = ({ question, assessmentId, value = {} }) => {
  const { saveAnswer } = useAssessment();
  const [answer, setAnswer] = useState(value?.answer || '');
  const [comments, setComments] = useState(value?.comments || '');
  const [photos, setPhotos] = useState(value?.photos || []);
  const [showHelp, setShowHelp] = useState(false);
  const [helpText, setHelpText] = useState('');
  const [loadingHelp, setLoadingHelp] = useState(false);

  // Defensive: ensure value is always an object
  useEffect(() => {
    setAnswer(value?.answer || '');
    setComments(value?.comments || '');
    setPhotos(value?.photos || []);
  }, [value]);
  
  // Handle answer selection (yes, no, na)
  const handleAnswerChange = (e) => {
    const newAnswer = e.target.value;
    setAnswer(newAnswer);
    saveAnswer(assessmentId, question.regulationNumber, newAnswer, comments, photos);
  };
  
  // Handle comment changes
  const handleCommentsChange = (e) => {
    const newComments = e.target.value;
    setComments(newComments);
    saveAnswer(assessmentId, question.regulationNumber, answer, newComments, photos);
  };
  
  // Handle photo updates
  const handlePhotosChange = (newPhotos) => {
    setPhotos(newPhotos);
    saveAnswer(assessmentId, question.regulationNumber, answer, comments, newPhotos);
  };
  
  // Get help from MCP service
  const handleGetHelp = async () => {
    setLoadingHelp(true);
    setShowHelp(true);
    try {
      const help = await getQuestionHelp(question.regulationNumber, question.text);
      setHelpText(help);
    } catch (error) {
      console.error('Error getting help:', error);
      setHelpText('Unable to load help content. Please try again later.');
    }
    setLoadingHelp(false);
  };
  
  return (
    <Card className={`question-card mb-3 ${answer}`}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span>Regulation {question.regulationNumber}</span>
        <Button 
          variant="outline-info" 
          size="sm"
          onClick={handleGetHelp}
        >
          Get Help
        </Button>
      </Card.Header>
      <Card.Body>
        <Card.Title className="mb-3">{question.text}</Card.Title>
        
        {/* Help section */}
        {showHelp && (
          <Card.Text className="bg-light p-3 rounded mb-3">
            {loadingHelp ? 'Loading help content...' : helpText}
          </Card.Text>
        )}
        
        {/* Response options */}
        <Form.Group className="mb-3">
          <Form.Label><strong>Assessment:</strong></Form.Label>
          <div className="d-flex gap-3">
            <Form.Check
              type="radio"
              label="Yes - Compliant"
              name={`assessment-${question.regulationNumber}`}
              id={`yes-${question.regulationNumber}`}
              value="yes"
              checked={answer === 'yes'}
              onChange={handleAnswerChange}
            />
            <Form.Check
              type="radio"
              label="No - Non-compliant"
              name={`assessment-${question.regulationNumber}`}
              id={`no-${question.regulationNumber}`}
              value="no"
              checked={answer === 'no'}
              onChange={handleAnswerChange}
            />
            <Form.Check
              type="radio"
              label="N/A - Not applicable"
              name={`assessment-${question.regulationNumber}`}
              id={`na-${question.regulationNumber}`}
              value="na"
              checked={answer === 'na'}
              onChange={handleAnswerChange}
            />
          </div>
        </Form.Group>
        
        {/* Comments field */}
        <Form.Group className="mb-3">
          <Form.Label><strong>Comments:</strong></Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={comments}
            onChange={handleCommentsChange}
            placeholder="Add any observations, notes or justifications..."
          />
        </Form.Group>
        
        {/* Photo evidence */}
        <PhotoUploader 
          photos={photos} 
          onChange={handlePhotosChange} 
        />
      </Card.Body>
    </Card>
  );
};

export default QuestionCard;