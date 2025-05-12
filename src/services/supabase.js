import { createClient } from '@supabase/supabase-js';

// Simple check to see if we're running in the browser
const isBrowser = typeof window !== 'undefined';

// Log the environment to understand what's available
if (isBrowser) {
  console.log('Environment check - running in browser');
  console.log('Window location:', window.location.hostname);
} else {
  console.log('Environment check - not running in browser');
}

// Detect if environment variables are available
const envDebug = {
  REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Not set',
  SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Not set',
  NODE_ENV: process.env.NODE_ENV || 'Not set'
};
console.log('Environment variables status:', envDebug);

// Get URLs with a more robust approach
let supabaseUrl;
let supabaseAnonKey;

// For production Vercel builds, these variables should be available
if (process.env.REACT_APP_SUPABASE_URL) {
  supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  console.log('Using REACT_APP_ environment variables');
} else if (process.env.SUPABASE_URL) {
  // Try plain environment variables (Vercel might provide these directly)
  supabaseUrl = process.env.SUPABASE_URL;
  supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  console.log('Using plain environment variables');
} else {
  // Last resort fallback - not ideal, but prevents app from crashing
  console.warn('No environment variables found, using default values');
  
  // Use your actual Supabase URL (this is needed for your app to work)
  // Note: this is your project URL that you can find in your Supabase dashboard
  // It's safe to expose this URL (but not ideal)
  supabaseUrl = 'https://yhaqvjeeqiwtbwlbzcui.supabase.co';
  
  // IMPORTANT: Use a restricted/public anon key - never expose keys with elevated permissions
  // This is just a template - you need to replace with your actual anon key
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloYXF2amVlcWl3dGJ3bGJ6Y3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU1MzU5MTIsImV4cCI6MjAzMTExMTkxMn0.h7lhUpS3-h5vmEqzIKoqx7qQBtJSBZj1_I-fQqeX7n8';
}

// Log partial information to help debug (never log full keys)
console.log(`Connecting to Supabase at: ${supabaseUrl}`);
if (supabaseAnonKey) {
  // Only log beginning and end of key for security
  const firstChars = supabaseAnonKey.substring(0, 5);
  const lastChars = supabaseAnonKey.substring(supabaseAnonKey.length - 4);
  console.log(`Using API key: ${firstChars}...${lastChars}`);
} else {
  console.error('API key is missing or invalid');
}

// Configure Supabase with options that help with CORS
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  },
  // Add required db schema if your table is in a specific schema
  db: {
    schema: 'public',
  },
};

// Create the client with proper error handling
let supabaseClient;
try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);
  console.log('Supabase client created successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a mock client that logs errors instead of crashing
  supabaseClient = {
    from: () => ({
      select: () => Promise.reject(new Error('Supabase client initialization failed')),
      insert: () => Promise.reject(new Error('Supabase client initialization failed')),
      update: () => Promise.reject(new Error('Supabase client initialization failed')),
      delete: () => Promise.reject(new Error('Supabase client initialization failed')),
    }),
  };
}

export const supabase = supabaseClient;