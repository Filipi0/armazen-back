import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sfcacnsydnjucqtshobw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmY2FjbnN5ZG5qdWNxdHNob2J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NDk2MTAsImV4cCI6MjA1MzEyNTYxMH0.LWeOMbB1CnJh5JAljOj4lem-bC7GvuhB1-Nmly0j4zU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
