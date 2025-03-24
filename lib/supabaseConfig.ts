import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dwszpyfiphkfcvrjaqvt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3c3pweWZpcGhrZmN2cmphcXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDIzNzIsImV4cCI6MjA1ODIxODM3Mn0.QNb8JhI9pExtmYwnAfsYAnxZXtBFp1Inp8srfUW9NNE';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;