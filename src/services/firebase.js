import { initializeApp } from 'firebase/app';const firebaseConfig = {  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,  appId: process.env.REACT_APP_FIREBASE_APP_ID,  measurementId: "G-9FLSKDGCLW"};const app = initializeApp(firebaseConfig);// Local storage implementation to replace Firebase storage

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