import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// REPLACE THESE WITH YOUR KEYS FROM THE SUPABASE DASHBOARD
const supabaseUrl = 'https://gcjfvnbarsqvrmpxbtcp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjamZ2bmJhcnNxdnJtcHhidGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NDg5NTUsImV4cCI6MjA4MjIyNDk1NX0.xwAdchLlr1HCPIvzmoartYorTeSsxW6cHn-7pbyh3IY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});