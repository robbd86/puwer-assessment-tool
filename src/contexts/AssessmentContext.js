import React, { createContext, useState, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadQuestions } from '../services/csvService';
import { supabase } from '../services/supabase';

const AssessmentContext = createContext();
export const useAssessment = () => useContext(AssessmentContext);

export const AssessmentProvider = ({ children }) => {
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load assessments from Supabase and questions from CSV
  useEffect(() => {
    const fetchAssessments = async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('createdat', { ascending: false }); // use lowercase column name
      
      if (error) {
        console.error('Error loading assessments:', error);
      } else {
        // Normalize assessment data to ensure consistent field naming throughout the app
        const normalizedAssessments = (data || []).map(assessment => ({
          ...assessment,
          createdAt: assessment.createdat,
          modifiedAt: assessment.modifiedat
        }));
        
        setAssessments(normalizedAssessments);
      }
    };
    
    fetchAssessments();

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

  // Create a new assessment in Supabase
  const createAssessment = async (assessmentData) => {
    console.log('Creating assessment with data:', assessmentData);
    const { data, error } = await supabase
      .from('assessments')
      .insert([{ ...assessmentData, id: uuidv4() }])
      .select()
      .single();
    if (error) throw error;
    setAssessments(prev => [data, ...prev]);
    return data.id;
  };

  // Update an existing assessment in Supabase
  const updateAssessment = async (id, data) => {
    const { data: updated, error } = await supabase
      .from('assessments')
      .update({ 
        ...data, 
        modifiedat: new Date().toISOString() // Ensure consistent lowercase field name for Supabase
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    // When receiving data back from Supabase, normalize fields to ensure consistent 
    // access throughout the application
    if (updated) {
      // Convert Supabase's lowercase timestamp fields to camelCase for frontend consistency
      const normalizedData = {
        ...updated,
        createdAt: updated.createdat,
        modifiedAt: updated.modifiedat
      };
      
      setAssessments(prev => prev.map(a => a.id === id ? normalizedData : a));
    }
  };

  // Save a question answer in Supabase
  const saveAnswer = async (assessmentId, questionId, answer, comments = '', photos = []) => {
    try {
      const assessment = assessments.find(a => a.id === assessmentId);
      
      // Process photos to ensure we're storing only the persistent dataUrls
      // This prevents storing temporary blob URLs that won't work after the session ends
      const processedPhotos = photos.map(photo => {
        // Keep all properties but ensure dataUrl is used for storage
        // If uploading to a storage service in the future, this is where you'd
        // replace the dataUrl with a permanent URL from your storage service
        return {
          id: photo.id,
          name: photo.name,
          type: photo.type,
          size: photo.size,
          dataUrl: photo.dataUrl, // Store the persistent data URL
          createdAt: photo.createdAt
        };
      });
      
      // Update the answers object
      const updatedAnswers = {
        ...((assessment && assessment.answers) || {}),
        [questionId]: { answer, comments, photos: processedPhotos }
      };
      
      // Update the assessment in Supabase
      await updateAssessment(assessmentId, { 
        answers: updatedAnswers,
        modifiedat: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving answer:', error);
      throw new Error('Failed to save your answer. Please try again.');
    }
  };

  // Add a recommendation in Supabase
  const addRecommendation = async (assessmentId, recommendation) => {
    const assessment = assessments.find(a => a.id === assessmentId);
    const newRecommendation = {
      id: uuidv4(),
      ...recommendation,
      createdAt: new Date().toISOString()
    };
    const updatedRecommendations = [
      ...((assessment && assessment.recommendations) || []),
      newRecommendation
    ];
    await updateAssessment(assessmentId, { recommendations: updatedRecommendations });
  };

  // Delete an assessment in Supabase
  const deleteAssessment = async (id) => {
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setAssessments(prev => prev.filter(a => a.id !== id));
  };

  // Mark an assessment as completed in Supabase
  const completeAssessment = async (id) => {
    await updateAssessment(id, { completed: true });
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