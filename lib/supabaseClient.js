import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// DEBUG KONTROLÜ: Ortam değişkenlerinin doğru yüklendiğinden emin olun.
console.log("Supabase URL Check:", supabaseUrl ? "Loaded" : "MISSING");
console.log("Supabase Key Check:", supabaseKey && supabaseKey.length > 20 ? "Loaded" : "MISSING");
// Eğer bu çıktılar terminalde "Loaded" olarak görünüyorsa, ortam değişkenleri doğru alınıyordur.

export const supabase = createClient(supabaseUrl, supabaseKey)