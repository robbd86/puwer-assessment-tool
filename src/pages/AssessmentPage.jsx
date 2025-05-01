// Find the function handling the "Next: Recommendations" button click
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
  window.location.href = `/recommendations/${assessmentId}`;
};

// Make sure your button has this event handler
// <button onClick={handleNextRecommendations}>Next: Recommendations</button>