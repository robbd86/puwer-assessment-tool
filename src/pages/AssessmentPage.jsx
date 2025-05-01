// Find the function that handles the "Next: Recommendations" button click

const handleNextRecommendations = (e) => {
  // Add this line to prevent default form submission
  e.preventDefault();
  
  // Make sure to save the current assessment data first
  const updatedAssessment = {
    ...assessment,
    sections: {
      ...assessment.sections,
      [currentSection]: {
        ...assessment.sections[currentSection],
        recommendations: recommendationsValue, // Make sure this value is captured
        // other section data...
      }
    }
  };
  
  // Save to localStorage BEFORE navigation
  saveAssessment(updatedAssessment);
  
  // Only navigate after saving is complete
  setTimeout(() => {
    navigate(`/recommendations/${assessment.id}`);
  }, 100);
};