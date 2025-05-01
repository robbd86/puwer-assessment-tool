import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// Import your Firebase service or utility functions
import { saveAssessment } from '../services/firebase';

// Add this utility function or import it from a utilities file
const generateId = () => Math.random().toString(36).substring(2, 15);

const AssessmentPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [assessment, setAssessment] = useState({
    id: id || generateId(),
    sections: {}
  });
  const [currentSection, setCurrentSection] = useState('section1'); // Or whatever your section id is

  // Add this function inside your component
  const handleNextRecommendations = (e) => {
    // Prevent default form submission behavior
    e.preventDefault();
    
    // Make sure assessment has an ID
    const assessmentId = assessment?.id || generateId();
    
    // Save current section data to ensure nothing is lost
    const updatedAssessment = {
      ...assessment,
      id: assessmentId,
      sections: {
        ...assessment.sections,
        [currentSection]: {
          ...assessment.sections?.[currentSection],
          // Add any form data that needs to be captured
          comments: document.querySelector('textarea[name="comments"]')?.value || '',
          // Add other form fields as needed
        }
      },
      lastUpdated: new Date().toISOString()
    };
    
    // Save the assessment to localStorage
    saveAssessment(updatedAssessment);
    
    // Force navigation to recommendations page with the correct ID
    console.log('Navigating to recommendations with ID:', assessmentId);
    navigate(`/recommendations/${assessmentId}`);
  };

  return (
    <div>
      {/* Your form elements */}
      
      {/* Update your button to use the new handler */}
      <button onClick={handleNextRecommendations}>
        Next: Recommendations
      </button>
    </div>
  );
};

export default AssessmentPage;