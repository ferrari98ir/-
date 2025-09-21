// This file is now used to initialize the Supabase client instead of Firebase.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bjooqsbstrnijjkevlgw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqb29zcWJzdHJuaWpqa2V3bGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NzU2NDQsImV4cCI6MjA3NDA1MTY0NH0.vk1EmC7V6BwGAVmt_sukBR2aWFS2_fVSG9ftgmsJ01Y';

export const supabase = createClient(supabaseUrl, supabaseKey);
