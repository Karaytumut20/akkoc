'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import logo from '@/assets/logos.png';
import { supabase } from '@/lib/supabaseClient';

// === INPUT ===
const FloatingLabelInput = ({ id, name, type, label, value, onChange, required, autoComplete }) => (
  <div className="relative">
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      autoComplete={autoComplete}
      className="w-full px-3 pt-4 pb-2 text-gray-900 border border-teal-500 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 peer bg-[#FFFFFF]"
      placeholder=" "
    />
    <label
      htmlFor={id}
      className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-[#FFFFF0] px-2 peer-focus:px-2 peer-focus:text-teal-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
    >
      {label}
    </label>
  </div>
);

// === POLICY MODAL ===
const PolicyModal = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;
  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';

  const content = isPrivacy ? (
    <div className="space-y-4 text-gray-700">
      <p><strong>1.</strong> We collect your personal information only for providing services.</p>
      <p><strong>2.</strong> We protect your data with security measures.</p>
      <p><strong>3.</strong> We do not share your data with third parties without consent.</p>
    </div>
  ) : (
    <div className="space-y-4 text-gray-700">
      <p><strong>1.</strong> By using our services, you agree to these terms.</p>
      <p><strong>2.</strong> You must keep your account secure.</p>
      <p><strong>3.</strong> Violations may lead to suspension.</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#FFFFFF] rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-teal-600 hover:text-teal-800 text-2xl font-bold"
        >
          ×
        </button>
        <div className="flex items-center gap-3 mb-4">
          <Image src={logo} alt="Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold text-teal-700">{title}</h3>
        </div>
        <div className="max-h-[60vh] overflow-y-auto text-sm leading-relaxed">
          {content}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

// === AUTH PAGE ===
export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContentType, setModalContentType] = useState(null);

  const openModal = useCallback((type) => {
    setModalContentType(type);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalContentType(null);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ⚠️ Şifre kontrolü (6 karakterden azsa uyar)
    if (password.length < 6) {
      toast.error('⚠️ Password must be at least 6 characters long.');
      return;
    }

    if (!isLogin && !termsAccepted) {
      toast.error('You must accept the Terms and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            toast.error('⚠️ Please verify your email address before logging in.');
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data?.user) {
          toast.success('✅ Login successful!');
          router.push('/');
        }

      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone: phone },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        toast.success('📩 Check your email and verify your account.');
        setIsLogin(true);
        setFullName('');
        setPhone('');
        setPassword('');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      {isModalOpen && (
        <PolicyModal isOpen={isModalOpen} onClose={closeModal} type={modalContentType} />
      )}

      <div className="flex items-center justify-center min-h-screen bg-[#FFFFF0] p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl relative">
          <div className="flex justify-center mb-4">
            <Image src={logo} alt="Logo" width={80} height={80} />
          </div>

          <h2 className="text-3xl font-extrabold text-center text-teal-700">
            {isLogin ? 'Sign In' : 'Register Now'}
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <FloatingLabelInput
                  id="fullName"
                  name="fullName"
                  type="text"
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
                <FloatingLabelInput
                  id="phone"
                  name="phone"
                  type="tel"
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />
              </>
            )}
            <FloatingLabelInput
              id="email"
              name="email"
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <FloatingLabelInput
              id="password"
              name="password"
              type="password"
              label="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />

            {!isLogin && (
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="termsAccepted"
                    name="termsAccepted"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-600"
                  />
                </div>
                <div className="ml-3 text-sm text-gray-700">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => openModal('privacy')}
                    className="text-teal-600 hover:underline"
                  >
                    Privacy Policy
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => openModal('terms')}
                    className="text-teal-600 hover:underline"
                  >
                    Terms of Service
                  </button>.
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white bg-teal-600 rounded-lg font-semibold shadow-md hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50 disabled:bg-teal-400 transition"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setFullName('');
                setPhone('');
                setEmail('');
                setPassword('');
                setTermsAccepted(false);
              }}
              className="ml-1 font-bold text-teal-600 hover:text-teal-500 transition"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
