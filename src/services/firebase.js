import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAnDie124FxEmjgvpMSYkE4KHsNWxqfIWU",
  authDomain: "puwer-app.firebaseapp.com",
  projectId: "puwer-app",
  storageBucket: "puwer-app.appspot.com",
  messagingSenderId: "291260990093",
  appId: "1:291260990093:web:7f035f75308bb73b2f98c4",
  measurementId: "G-9FLSKDGCLW"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);