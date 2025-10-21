'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import logo from '@/assets/logo.svg';
import { supabase } from '@/lib/supabaseClient';

// === AUTH CONTEXT ===
const useAppContext = () => ({
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },
  signUp: async (email, password, fullName, phone) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });
    if (error) throw error;
    return data;
  },
});

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
      <p><strong>1. Information Collected:</strong> We collect personal information you provide during registration.</p>
      <p><strong>2. Use of Information:</strong> This information is used to provide services to you.</p>
      <p><strong>3. Data Security:</strong> We protect your information with security measures.</p>
      <p><strong>4. Sharing:</strong> No third-party sharing without consent.</p>
    </div>
  ) : (
    <div className="space-y-4 text-gray-700">
      <p><strong>1. Acceptance:</strong> By using our services, you agree to all terms.</p>
      <p><strong>2. Obligations:</strong> You agree to respect intellectual property and other users.</p>
      <p><strong>3. Account Security:</strong> You are responsible for your account.</p>
      <p><strong>4. Termination:</strong> Violation may lead to account suspension.</p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
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
  const { signIn, signUp } = useAppContext();
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
    if (!isLogin && !termsAccepted) {
      alert('Please accept Terms and Privacy Policy.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const data = await signIn(email, password);
        if (data?.user) {
          router.push('/'); // ✅ giriş başarılı → anasayfaya yönlendir
        }
      } else {
        const data = await signUp(email, password, fullName, phone);
        if (data?.user) {
          router.push('/'); // ✅ kayıt başarılı → anasayfaya yönlendir
        } else {
          alert('Check your email to confirm your account.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isModalOpen && (
        <PolicyModal isOpen={isModalOpen} onClose={closeModal} type={modalContentType} />
      )}

      <div className="flex items-center justify-center min-h-screen bg-[#FFFFF0] p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl relative">
          {/* Logo */}
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
