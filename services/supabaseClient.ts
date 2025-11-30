
import { createClient } from '@supabase/supabase-js';

// Inferred from your JWT
const SUPABASE_URL = 'https://ahmxecozcvsahnsxgomn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobXhlY296Y3ZzYWhuc3hnb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Mzk0ODIsImV4cCI6MjA4MDAxNTQ4Mn0.rxaDe7XkNWKcOuUZj63-XMKruPq4XCx-_PIlqBz3Avw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
