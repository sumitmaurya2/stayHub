import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co'; // from Settings -> API
const supabaseAnonKey = 'YOUR_ANON_PUBLIC_KEY'; // from Settings -> API

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
