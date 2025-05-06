import React from 'react';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useAssessment } from '../../contexts/AssessmentContext';

const RecommendationForm = ({ assessmentId }) => {
  const { addRecommendation } = useAssessment();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      text: '',
      priority: 'Medium',
      assignee: '',
      dueDate: ''
    }
  });
  
  // Set default date to 14 days from now if not set
  const handleAddRecommendation = () => {
    const currentDueDate = document.querySelector('input[name="dueDate"]').value;
    if (!currentDueDate) {
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
      setValue('dueDate', twoWeeksFromNow.toISOString().split('T')[0]);
    }
  };
  
  const onSubmit = (data) => {
    // Add the recommendation to the assessment
    addRecommendation(assessmentId, {
      text: data.text,
      priority: data.priority,
      assignee: data.assignee,
      dueDate: data.dueDate
    });
    
    // Reset form
    reset({
      text: '',
      priority: 'Medium',
      assignee: '',
      dueDate: ''
    });
  };
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <h4>Add New Recommendation</h4>
      </Card.Header>
      <Card.Body>
        <Form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3">
            <Form.Label>Recommendation*</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Describe the recommendation or corrective action needed..."
              {...register("text", { 
                required: "Recommendation text is required",
                minLength: { value: 10, message: "Please provide at least 10 characters" }
              })}
              isInvalid={!!errors.text}
            />
            <Form.Control.Feedback type="invalid">
              {errors.text?.message}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Priority Level</Form.Label>
                <Form.Select 
                  {...register("priority")}
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
                  placeholder="Person responsible"
                  {...register("assignee", { 
                    required: "Assignee is required" 
                  })}
                  isInvalid={!!errors.assignee}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.assignee?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Due Date*</Form.Label>
                <Form.Control
                  type="date"
                  {...register("dueDate", { 
                    required: "Due date is required" 
                  })}
                  isInvalid={!!errors.dueDate}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.dueDate?.message}
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