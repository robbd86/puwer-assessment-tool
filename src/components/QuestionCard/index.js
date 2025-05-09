import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
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
  const [saveError, setSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Defensive: ensure value is always an object
  useEffect(() => {
    setAnswer(value?.answer || '');
    setComments(value?.comments || '');
    setPhotos(value?.photos || []);
  }, [value]);
  
  // Handle answer selection (yes, no, na) with error handling
  const handleAnswerChange = async (e) => {
    const newAnswer = e.target.value;
    setAnswer(newAnswer); // Update UI immediately
    setSaveError(false);
    setIsSaving(true);
    
    try {
      await saveAnswer(assessmentId, question.regulationNumber, newAnswer, comments, photos);
    } catch (error) {
      console.error('Error saving answer:', error);
      setSaveError(true);
      // Continue with local state even if saving fails
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle comment changes with error handling
  const handleCommentsChange = async (e) => {
    const newComments = e.target.value;
    setComments(newComments); // Update UI immediately
    
    // Don't try to save on every keystroke - wait until user stops typing
    // This is handled in the onBlur event below
  };
  
  // Save comments when user finishes typing
  const handleCommentBlur = async () => {
    setSaveError(false);
    setIsSaving(true);
    
    try {
      await saveAnswer(assessmentId, question.regulationNumber, answer, comments, photos);
    } catch (error) {
      console.error('Error saving comments:', error);
      setSaveError(true);
      // Continue with local state even if saving fails
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle photo updates with error handling
  const handlePhotosChange = async (newPhotos) => {
    setPhotos(newPhotos); // Update UI immediately
    setSaveError(false);
    setIsSaving(true);
    
    try {
      await saveAnswer(assessmentId, question.regulationNumber, answer, comments, newPhotos);
    } catch (error) {
      console.error('Error saving photos:', error);
      setSaveError(true);
      // Continue with local state even if saving fails
    } finally {
      setIsSaving(false);
    }
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
        
        {saveError && (
          <Alert variant="warning" className="mb-3">
            There was an issue saving your response to the server. Your answer is saved locally and will be available while you're on this page.
          </Alert>
        )}
        
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
              disabled={isSaving}
            />
            <Form.Check
              type="radio"
              label="No - Non-compliant"
              name={`assessment-${question.regulationNumber}`}
              id={`no-${question.regulationNumber}`}
              value="no"
              checked={answer === 'no'}
              onChange={handleAnswerChange}
              disabled={isSaving}
            />
            <Form.Check
              type="radio"
              label="N/A - Not applicable"
              name={`assessment-${question.regulationNumber}`}
              id={`na-${question.regulationNumber}`}
              value="na"
              checked={answer === 'na'}
              onChange={handleAnswerChange}
              disabled={isSaving}
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
            onBlur={handleCommentBlur}
            placeholder="Add any observations, notes or justifications..."
            disabled={isSaving}
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