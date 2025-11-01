import { createClient } from '@supabase/supabase-js';

// Ortam değişkenlerini al
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Kontrol logları (sadece geliştirme ortamında)
if (process.env.NODE_ENV === "development") {
  console.log("Supabase URL Check:", supabaseUrl ? "Loaded" : "MISSING");
  console.log("Supabase Anon Key Check:", supabaseKey && supabaseKey.length > 20 ? "Loaded" : "MISSING");
}

// ✅ Auth parametreleri eklendi — mobil cihazlarda oturum ve cookie yönetimi düzgün çalışır
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,           // Kullanıcı oturumu localStorage'da tutulur
    autoRefreshToken: true,         // Access token otomatik yenilenir
    detectSessionInUrl: true,       // Auth callback URL'si (email doğrulama vs.) otomatik yakalanır
  },
});
