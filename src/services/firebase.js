// Removed all Firebase references and initialization. Only localStorage-based utilities remain.

const generateId = () => Math.random().toString(36).substring(2, 15);

// Mock storage service using localStorage
export const storage = {
  ref: (path) => ({
    put: async (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const id = generateId();
          const key = `storage_${path}_${id}`;
          localStorage.setItem(key, reader.result);
          resolve({
            ref: {
              getDownloadURL: () => Promise.resolve(`local://${key}`),
            },
            metadata: {
              name: file.name,
              contentType: file.type,
              size: file.size,
            }
          });
        };
        reader.readAsDataURL(file);
      });
    },
    delete: async () => {
      // Implementation omitted for brevity
      return Promise.resolve();
    },
    listAll: () => {
      const prefix = `storage_${path}_`;
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith(prefix));
      return Promise.resolve({
        items: keys.map(key => ({
          getDownloadURL: () => Promise.resolve(`local://${key}`),
          name: key.replace(prefix, ''),
        }))
      });
    }
  }),
  // Helper to retrieve data
  getFromLocalURL: (url) => {
    if (url.startsWith('local://')) {
      const key = url.replace('local://', '');
      return localStorage.getItem(key);
    }
    return null;
  }
};

// Export a utility function to handle the local URLs
export const getDataFromURL = (url) => {
  if (url.startsWith('local://')) {
    return storage.getFromLocalURL(url);
  }
  return url;
};

// Add this helper function if not already present
export const saveAssessment = (assessment) => {
  try {
    // Get existing assessments
    const assessments = JSON.parse(localStorage.getItem('assessments')) || [];
    // Find if this assessment exists
    const index = assessments.findIndex(a => a.id === assessment.id);
    // Update or add the assessment
    if (index >= 0) {
      assessments[index] = assessment;
    } else {
      assessments.push(assessment);
    }
    // Save back to localStorage
    localStorage.setItem('assessments', JSON.stringify(assessments));
    return true;
  } catch (error) {
    console.error('Error saving assessment:', error);
    return false;
  }
};