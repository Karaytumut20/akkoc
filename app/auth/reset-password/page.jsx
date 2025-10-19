// app/auth/reset-password/page.jsx

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import FloatingLabelInput from '@/components/ui/FloatingLabelInput';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Bu sayfa sadece şifre sıfırlama linkinden gelindiğinde çalışır.
    // Supabase, linkteki token'ı otomatik olarak session'a kaydeder.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Artık yeni şifreyi ayarlayabiliriz.
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error('Şifre güncellenirken bir hata oluştu: ' + error.message);
    } else {
      toast.success('Şifreniz başarıyla güncellendi! Lütfen tekrar giriş yapın.');
      router.push('/auth');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Yeni Şifre Belirle
        </h2>
        <form className="space-y-8" onSubmit={handleResetPassword}>
          <FloatingLabelInput
            id="password"
            name="password"
            type="password"
            label="Yeni Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-300"
          >
            {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  );
}