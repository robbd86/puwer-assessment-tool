import { createClient } from '@supabase/supabase-js';

// For local development, use environment variables
// For production, use the ones from Vercel
// If all else fails, try to use a direct URL that works in the browser
// Note: These are FALLBACKS and should be configurable through environment variables

// ⚠️ WARNING: Using hardcoded values only as a last resort
// In production, always use environment variables where possible
const FALLBACK_URL = window.location.hostname.includes('vercel.app') 
  ? 'https://yhaqvjeeqiwtbwlbzcui.supabase.co' // Only use a real URL in production as last resort
  : 'https://example.supabase.co'; // Fake URL for development

// Anon key should never be hardcoded in real code - this is just a last resort fallback
// The key below is NOT an actual key, just a placeholder
const FALLBACK_KEY = window.location.hostname.includes('vercel.app')
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key.for-demo-only'
  : 'your-public-anon-key-for-development-only';

// Get URL from environment variables with multiple fallbacks for different environments
const supabaseUrl = 
  process.env.REACT_APP_SUPABASE_URL || // CRA local development
  process.env.NEXT_PUBLIC_SUPABASE_URL || // Next.js format
  process.env.SUPABASE_URL || // Plain environment variable
  FALLBACK_URL; // Last resort fallback

// Get API key from environment variables with fallbacks for different environments
const supabaseAnonKey = 
  process.env.REACT_APP_SUPABASE_ANON_KEY || // CRA local development
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || // Next.js format
  process.env.SUPABASE_ANON_KEY || // Plain environment variable
  FALLBACK_KEY; // Last resort fallback

// Log connection info (but not the full key)
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