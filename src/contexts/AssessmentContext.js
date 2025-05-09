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
  const [loadError, setLoadError] = useState(null);

  // Load assessments from Supabase and questions from CSV
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('*')
          .order('createdat', { ascending: false }); // use lowercase column name
        
        if (error) {
          console.error('Error loading assessments:', error);
          setLoadError(error.message || 'Failed to load assessments');
          // Still continue with empty assessment array
          setAssessments([]);
        } else {
          // Normalize assessment data to ensure consistent field naming throughout the app
          const normalizedAssessments = (data || []).map(assessment => ({
            ...assessment,
            createdAt: assessment.createdat,
            modifiedAt: assessment.modifiedat,
            answers: assessment.answers || {},
            recommendations: assessment.recommendations || []
          }));
          
          setAssessments(normalizedAssessments);
          setLoadError(null);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setLoadError(err.message || 'An unexpected error occurred');
        setAssessments([]);
      } finally {
        // Ensure we're not in a perpetual loading state
        setLoading(false);
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

  // Create a new assessment in Supabase with error handling
  const createAssessment = async (assessmentData) => {
    try {
      console.log('Creating assessment with data:', assessmentData);
      
      // Generate a new ID for the assessment
      const newId = uuidv4();
      
      // First create locally for immediate feedback
      const newAssessment = { 
        ...assessmentData, 
        id: newId,
        createdAt: new Date().toISOString(),
        createdat: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        modifiedat: new Date().toISOString(),
      };
      
      // Update local state first for responsive UI
      setAssessments(prev => [newAssessment, ...prev]);
      
      // Then try to save to Supabase
      const { data, error } = await supabase
        .from('assessments')
        .insert([{ ...assessmentData, id: newId }])
        .select()
        .single();
        
      if (error) {
        console.error('Error saving to Supabase:', error);
        // We keep the local version even if Supabase save fails
      }
      
      return newId;
    } catch (error) {
      console.error('Error in createAssessment:', error);
      // Return the locally created ID even if there was an error
      return assessmentData.id;
    }
  };

  // Update an existing assessment in Supabase with error handling
  const updateAssessment = async (id, data) => {
    try {
      // Update local state first for responsive UI
      const currentAssessment = assessments.find(a => a.id === id) || {};
      const updatedAssessment = { 
        ...currentAssessment,
        ...data,
        modifiedAt: new Date().toISOString(),
        modifiedat: new Date().toISOString()
      };
      
      setAssessments(prev => prev.map(a => a.id === id ? updatedAssessment : a));
      
      // Then try to update in Supabase
      const { data: updated, error } = await supabase
        .from('assessments')
        .update({ 
          ...data, 
          modifiedat: new Date().toISOString() // Ensure consistent lowercase field name for Supabase
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating in Supabase:', error);
        // We keep the local version even if Supabase update fails
        return updatedAssessment;
      }
      
      // If Supabase update was successful, normalize the returned data
      if (updated) {
        // Convert Supabase's lowercase timestamp fields to camelCase for frontend consistency
        const normalizedData = {
          ...updated,
          createdAt: updated.createdat,
          modifiedAt: updated.modifiedat
        };
        
        // Update the assessment in our local state with the normalized data from the server
        setAssessments(prev => prev.map(a => a.id === id ? normalizedData : a));
        return normalizedData;
      }
      
      return updatedAssessment;
    } catch (error) {
      console.error('Error in updateAssessment:', error);
      // Return the locally updated assessment even if there was an error
      return assessments.find(a => a.id === id) || {};
    }
  };

  // Save a question answer in Supabase with error handling
  const saveAnswer = async (assessmentId, questionId, answer, comments = '', photos = []) => {
    try {
      const assessment = assessments.find(a => a.id === assessmentId);
      
      if (!assessment) {
        throw new Error(`Assessment with ID ${assessmentId} not found`);
      }
      
      // Process photos to ensure we're storing only the persistent dataUrls
      // This prevents storing temporary blob URLs that won't work after the session ends
      const processedPhotos = (photos || []).map(photo => {
        if (!photo) return null;
        
        // Keep all properties but ensure dataUrl is used for storage
        // If uploading to a storage service in the future, this is where you'd
        // replace the dataUrl with a permanent URL from your storage service
        return {
          id: photo.id || `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: photo.name || 'photo',
          type: photo.type || 'image/jpeg',
          size: photo.size || 0,
          dataUrl: photo.dataUrl, // Store the persistent data URL
          createdAt: photo.createdAt || new Date().toISOString()
        };
      }).filter(Boolean); // Remove any nulls
      
      // Update the answers object
      const updatedAnswers = {
        ...((assessment && assessment.answers) || {}),
        [questionId]: { answer, comments, photos: processedPhotos }
      };
      
      // Update local state first
      const updatedAssessment = {
        ...assessment,
        answers: updatedAnswers
      };
      
      setAssessments(prev => 
        prev.map(a => a.id === assessmentId ? updatedAssessment : a)
      );
      
      // Then try to update in Supabase
      await updateAssessment(assessmentId, { 
        answers: updatedAnswers,
        modifiedat: new Date().toISOString()
      });
      
      return true;
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
    loadError,
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