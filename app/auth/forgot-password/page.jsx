// app/auth/forgot-password/page.jsx

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Supabase client'ı import ediyoruz
import FloatingLabelInput from '@/components/ui/FloatingLabelInput';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Şifre sıfırlama linki e-posta adresinize gönderildi!');
      router.push('/auth');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Şifremi Unuttum
        </h2>
        <p className="text-center text-gray-600">
          Şifrenizi sıfırlamak için kayıtlı e-posta adresinizi girin.
        </p>
        <form className="space-y-8" onSubmit={handlePasswordReset}>
          <FloatingLabelInput
            id="email"
            name="email"
            type="email"
            label="E-posta Adresi"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-300"
          >
            {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
          </button>
        </form>
      </div>
    </div>
  );
}