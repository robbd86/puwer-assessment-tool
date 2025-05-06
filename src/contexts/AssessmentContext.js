import React, { createContext, useState, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadQuestions } from '../services/csvService';
import { db } from '../services/firebase';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc
} from 'firebase/firestore';

// Create the context
const AssessmentContext = createContext();

// Custom hook to use the assessment context
export const useAssessment = () => useContext(AssessmentContext);

export const AssessmentProvider = ({ children }) => {
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load assessments from Firestore and questions from CSV
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'assessments'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAssessments(data);
      } catch (error) {
        console.error('Error loading assessments:', error);
      }
    };
    fetchAssessments();

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

  // Create a new assessment in Firestore
  const createAssessment = async (equipmentDetails) => {
    const newAssessment = {
      equipmentDetails,
      answers: {},
      recommendations: [],
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      completed: false
    };
    const docRef = await addDoc(collection(db, 'assessments'), newAssessment);
    const created = { id: docRef.id, ...newAssessment };
    setAssessments(prev => [created, ...prev]);
    return docRef.id;
  };

  // Update an existing assessment in Firestore
  const updateAssessment = async (id, data) => {
    const docRef = doc(db, 'assessments', id);
    await updateDoc(docRef, { ...data, modifiedAt: new Date().toISOString() });
    setAssessments(prev => prev.map(assessment =>
      assessment.id === id ? { ...assessment, ...data, modifiedAt: new Date().toISOString() } : assessment
    ));
  };

  // Save a question answer in Firestore
  const saveAnswer = async (assessmentId, questionId, answer, comments = '', photos = []) => {
    const docRef = doc(db, 'assessments', assessmentId);
    const assessment = assessments.find(a => a.id === assessmentId);
    const updatedAnswers = {
      ...((assessment && assessment.answers) || {}),
      [questionId]: { answer, comments, photos }
    };
    await updateDoc(docRef, { answers: updatedAnswers, modifiedAt: new Date().toISOString() });
    setAssessments(prev => prev.map(a =>
      a.id === assessmentId ? { ...a, answers: updatedAnswers, modifiedAt: new Date().toISOString() } : a
    ));
  };

  // Add a recommendation in Firestore
  const addRecommendation = async (assessmentId, recommendation) => {
    const docRef = doc(db, 'assessments', assessmentId);
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
    await updateDoc(docRef, { recommendations: updatedRecommendations, modifiedAt: new Date().toISOString() });
    setAssessments(prev => prev.map(a =>
      a.id === assessmentId ? { ...a, recommendations: updatedRecommendations, modifiedAt: new Date().toISOString() } : a
    ));
  };

  // Delete an assessment in Firestore
  const deleteAssessment = async (id) => {
    await deleteDoc(doc(db, 'assessments', id));
    setAssessments(prev => prev.filter(assessment => assessment.id !== id));
  };

  // Mark an assessment as completed in Firestore
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