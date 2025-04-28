import React, { createContext, useState, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadQuestions } from '../services/csvService';

// Create the context
const AssessmentContext = createContext();

// Custom hook to use the assessment context
export const useAssessment = () => useContext(AssessmentContext);

export const AssessmentProvider = ({ children }) => {
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load saved assessments from localStorage and questions from CSV
  useEffect(() => {
    const savedAssessments = localStorage.getItem('puwer_assessments');
    if (savedAssessments) {
      setAssessments(JSON.parse(savedAssessments));
    }
    
    // Load questions from CSV file
    const fetchQuestions = async () => {
      try {
        const questionsData = await loadQuestions();
        setQuestions(questionsData);
      } catch (error) {
        console.error('Error loading questions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, []);

  // Save assessments to localStorage whenever they change
  useEffect(() => {
    // Only strip for localStorage, not in-memory state
    const assessmentsToSave = assessments.map(a => ({
      ...a,
      equipmentDetails: {
        ...a.equipmentDetails,
        nameplatePhotos: [] // Remove nameplate photos for localStorage
      },
      answers: Object.fromEntries(
        Object.entries(a.answers).map(([qid, ans]) => [
          qid,
          { ...ans, photos: [] } // Remove photos for localStorage
        ])
      )
    }));
    localStorage.setItem('puwer_assessments', JSON.stringify(assessmentsToSave));
  }, [assessments]);

  // Create a new assessment
  const createAssessment = (equipmentDetails) => {
    const newAssessment = {
      id: uuidv4(),
      equipmentDetails,
      answers: {},
      recommendations: [],
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      completed: false
    };
    
    setAssessments(prev => [newAssessment, ...prev]);
    return newAssessment.id;
  };

  // Update an existing assessment
  const updateAssessment = (id, data) => {
    setAssessments(prev => prev.map(assessment => {
      if (assessment.id === id) {
        return {
          ...assessment,
          ...data,
          modifiedAt: new Date().toISOString()
        };
      }
      return assessment;
    }));
  };

  // Save a question answer
  const saveAnswer = (assessmentId, questionId, answer, comments = '', photos = []) => {
    setAssessments(prev => prev.map(assessment => {
      if (assessment.id === assessmentId) {
        return {
          ...assessment,
          answers: {
            ...assessment.answers,
            [questionId]: { answer, comments, photos }
          },
          modifiedAt: new Date().toISOString()
        };
      }
      return assessment;
    }));
  };

  // Add a recommendation
  const addRecommendation = (assessmentId, recommendation) => {
    setAssessments(prev => prev.map(assessment => {
      if (assessment.id === assessmentId) {
        const newRecommendation = {
          id: uuidv4(),
          ...recommendation,
          createdAt: new Date().toISOString()
        };
        return {
          ...assessment,
          recommendations: [...assessment.recommendations, newRecommendation],
          modifiedAt: new Date().toISOString()
        };
      }
      return assessment;
    }));
  };

  // Delete an assessment
  const deleteAssessment = (id) => {
    setAssessments(prev => prev.filter(assessment => assessment.id !== id));
  };

  // Mark an assessment as completed
  const completeAssessment = (id) => {
    updateAssessment(id, { completed: true });
  };

  const value = {
    assessments,
    questions,
    loading,
    createAssessment,
    updateAssessment,
    saveAnswer,
    addRecommendation,
    deleteAssessment,
    completeAssessment,
    setQuestions
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
};