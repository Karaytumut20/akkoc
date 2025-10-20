'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import logo from '@/assets/logo.svg'; // 👈 SVG logonu böyle import et

const useAppContext = () => ({
  signIn: async (email, password, role) => console.log('Signing in...', email, role),
  signUp: async (email, password, fullName, phone) => console.log('Signing up...', email, fullName, phone),
});

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
      className="w-full px-3 pt-4 pb-2 text-gray-900 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 peer"
      placeholder=" "
    />
    <label
      htmlFor={id}
      className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-orange-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
    >
      {label}
    </label>
  </div>
);

const PolicyModal = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';

  const content = isPrivacy ? (
    <div className="space-y-4 text-gray-700">
      <p><strong>1. Information Collected:</strong> We collect personal information you provide during registration, including your full name, email address, and phone number.</p>
      <p><strong>2. Use of Information:</strong> This information is used to provide services to you, manage your account, process your orders, and communicate with you about our services.</p>
      <p><strong>3. Data Security:</strong> We implement appropriate security measures to protect your information against unauthorized access, alteration, disclosure, or destruction.</p>
      <p><strong>4. Sharing with Third Parties:</strong> We do not share your personal information with third parties without your consent, except as required by law or necessary to provide the service (e.g., payment processors).</p>
    </div>
  ) : (
    <div className="space-y-4 text-gray-700">
      <p><strong>1. Acceptance:</strong> By using our services, you agree to all the terms and conditions stated herein.</p>
      <p><strong>2. User Obligations:</strong> You agree to use the platform for lawful and appropriate purposes, not to harass other users, and to respect intellectual property rights.</p>
      <p><strong>3. Account Security:</strong> You are solely responsible for maintaining the confidentiality of your account password and for all activities that occur under your account.</p>
      <p><strong>4. Termination:</strong> We reserve the right to immediately terminate or suspend your access to the service without prior notice if you violate any of the terms.</p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-2xl font-bold"
        >
          ×
        </button>
        <div className="flex items-center gap-3 mb-4">
          <Image src={logo} alt="Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="max-h-[60vh] overflow-y-auto text-sm leading-relaxed">
          {content}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AuthPage() {
  const { signIn, signUp } = useAppContext();
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
      console.error('You must accept the Terms of Service and Privacy Policy to register.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password, 'customer');
      } else {
        await signUp(email, password, fullName, phone);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isModalOpen && (
        <PolicyModal isOpen={isModalOpen} onClose={closeModal} type={modalContentType} />
      )}

      <div className="flex items-center justify-center min-h-screen bg-[#FAF9F6] p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl relative">
          {/* 🧡 Logo */}
          <div className="flex justify-center mb-4">
            <Image src={logo} alt="Logo" width={80} height={80} />
          </div>

          <h2 className="text-3xl font-extrabold text-center text-gray-900">
            {isLogin ? 'Sign In' : 'Register Now'}
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <FloatingLabelInput id="fullName" name="fullName" type="text" label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                <FloatingLabelInput id="phone" name="phone" type="tel" label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
              </>
            )}
            <FloatingLabelInput id="email" name="email" type="email" label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <FloatingLabelInput id="password" name="password" type="password" label="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={isLogin ? 'current-password' : 'new-password'} />

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
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                </div>
                <div className="ml-3 text-sm text-gray-700">
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={() => openModal('privacy')}
                    className="text-orange-600 hover:underline"
                  >
                    Privacy Policy
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => openModal('terms')}
                    className="text-orange-600 hover:underline"
                  >
                    Terms of Service
                  </button>.
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white bg-orange-600 rounded-lg font-semibold shadow-md hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-500 focus:ring-opacity-50 disabled:bg-orange-400 transition"
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
              className="ml-1 font-bold text-orange-600 hover:text-orange-500 transition"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
