import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL Check:", supabaseUrl ? "Loaded" : "MISSING");
console.log("Supabase Anon Key Check:", supabaseKey && supabaseKey.length > 20 ? "Loaded" : "MISSING");

export const supabase = createClient(supabaseUrl, supabaseKey);
