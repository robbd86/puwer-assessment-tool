import { createClient } from '@supabase/supabase-js';

// Define hardcoded fallback values for development and testing
// ⚠️ WARNING: NEVER commit actual production keys to your repository
const FALLBACK_URL = 'https://your-supabase-project.supabase.co';
const FALLBACK_KEY = 'your-public-anon-key-for-development-only';

// Get URL from environment variables with fallbacks for different environments
const supabaseUrl = 
  process.env.REACT_APP_SUPABASE_URL || // CRA local development
  process.env.NEXT_PUBLIC_SUPABASE_URL || // Next.js format
  process.env.SUPABASE_URL || // Plain environment variable
  FALLBACK_URL; // Fallback for development

// Get API key from environment variables with fallbacks for different environments
const supabaseAnonKey = 
  process.env.REACT_APP_SUPABASE_ANON_KEY || // CRA local development
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || // Next.js format
  process.env.SUPABASE_ANON_KEY || // Plain environment variable
  FALLBACK_KEY; // Fallback for development

// Log connection info (but not the full key in production)
console.log(`Connecting to Supabase at: ${supabaseUrl}`);
console.log(`Using API key: ${supabaseAnonKey ? '********' + supabaseAnonKey.slice(-4) : 'MISSING KEY'}`);

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