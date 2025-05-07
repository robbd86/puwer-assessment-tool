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
        .order('createdAt', { ascending: false });
      if (error) {
        console.error('Error loading assessments:', error);
      } else {
        setAssessments(data || []);
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
      .update({ ...data, modifiedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setAssessments(prev => prev.map(a => a.id === id ? updated : a));
  };

  // Save a question answer in Supabase
  const saveAnswer = async (assessmentId, questionId, answer, comments = '', photos = []) => {
    const assessment = assessments.find(a => a.id === assessmentId);
    const updatedAnswers = {
      ...((assessment && assessment.answers) || {}),
      [questionId]: { answer, comments, photos }
    };
    await updateAssessment(assessmentId, { answers: updatedAnswers });
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