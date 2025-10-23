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
      className="w-full px-3 pt-4 pb-2 text-gray-900 border border-[#be531c] rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-[#be531c] focus:border-[#be531c] peer bg-[#FFFFFF]"
      placeholder=" "
    />
    <label
      htmlFor={id}
      className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] px-2 bg-[#ffffff] rounded-md peer-focus:px-2 peer-focus:text-[#be531c] peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
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
    <div className="space-y-4 text-gray-700 leading-relaxed">
      <p>
        At <strong>Your Company</strong>, we value your trust and are committed to safeguarding
        your personal information. This Privacy Policy explains how we collect, use, store, and
        protect your data when you use our services.
      </p>
      <p>
        <strong>1. Information We Collect:</strong> We collect personal information you provide
        during account registration, checkout, or communication with our support team. This may
        include your name, email address, phone number (optional), shipping address, and payment
        details.
      </p>
      <p>
        <strong>2. How We Use Your Information:</strong> We use your information to process
        transactions, deliver products, improve user experience, send order updates, and ensure
        secure account management.
      </p>
      <p>
        <strong>3. Data Protection:</strong> Your data is stored securely on encrypted servers.
        We implement industry-standard security protocols to protect against unauthorized access,
        disclosure, or misuse.
      </p>
      <p>
        <strong>4. Third-Party Disclosure:</strong> We do not sell or rent your data. Limited
        data may be shared with trusted third parties (e.g., payment gateways, logistics partners)
        solely for order fulfillment.
      </p>
      <p>
        <strong>5. Your Rights:</strong> You have the right to access, modify, or delete your data
        at any time. You can also manage your communication preferences or withdraw consent for
        data processing.
      </p>
      <p>
        <strong>6. Policy Updates:</strong> We may update this policy to reflect legal,
        technological, or business changes. All updates will be announced through our platform.
      </p>
      <p>
        By continuing to use our platform, you acknowledge that you have read and understood this
        Privacy Policy.
      </p>
    </div>
  ) : (
    <div className="space-y-4 text-gray-700 leading-relaxed">
      <p>
        Welcome to <strong>Your Company</strong>. These Terms of Service outline the rules and
        regulations for using our website and services. By accessing our platform, you agree to
        comply with these terms.
      </p>
      <p>
        <strong>1. Account Responsibility:</strong> You are responsible for maintaining the
        confidentiality of your login credentials and all activities under your account.
        We reserve the right to suspend or terminate accounts for policy violations.
      </p>
      <p>
        <strong>2. Acceptable Use:</strong> You agree to use our services only for lawful
        purposes. Fraudulent activities or misuse of our platform will result in immediate
        termination and possible legal action.
      </p>
      <p>
        <strong>3. Orders & Payments:</strong> All transactions must be valid and authorized.
        We reserve the right to cancel orders in case of payment issues, pricing errors, or
        stock unavailability.
      </p>
      <p>
        <strong>4. Intellectual Property:</strong> All text, images, graphics, and software are
        the property of <strong>Your Company</strong> and protected under applicable laws.
        Unauthorized use is strictly prohibited.
      </p>
      <p>
        <strong>5. Limitation of Liability:</strong> We are not liable for any indirect,
        incidental, or consequential damages resulting from the use of our services to the
        maximum extent permitted by law.
      </p>
      <p>
        <strong>6. Changes to Terms:</strong> We may update these Terms at any time to reflect
        new legal requirements or business practices. Continued use of the platform constitutes
        acceptance of these changes.
      </p>
      <p>
        <strong>7. Governing Law:</strong> These Terms are governed by applicable local laws.
        Any disputes will be resolved under the exclusive jurisdiction of the competent courts.
      </p>
      <p>
        By creating an account or using our services, you confirm that you have read, understood,
        and agreed to these Terms of Service.
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#FFFFFF] rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#be531c] hover:text-[#a64919] text-2xl font-bold"
        >
          ×
        </button>
        <div className="flex items-center gap-3 mb-4">
          <Image src={logo} alt="Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold text-[#be531c]">{title}</h3>
        </div>
        <div className="max-h-[70vh] overflow-y-auto text-sm pr-2">{content}</div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#be531c] text-white rounded-lg hover:bg-[#a64919] transition"
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

    if (password.length < 6) {
      toast.error('⚠️ Password must be at least 6 characters long.');
      return;
    }

    if (!isLogin && !termsAccepted) {
      toast.error('Please accept the Terms of Service and Privacy Policy.');
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
            data: { 
              full_name: fullName, 
              phone: phone || null 
            },
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

      <div className="flex items-center justify-center min-h-screen bg-[#ECE4DC] p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl relative">
          <div className="flex justify-center mb-4">
            <Image src={logo} alt="Logo" width={80} height={80} />
          </div>

          <h2 className="text-3xl font-extrabold text-center text-[#be531c]">
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
                  label="Phone Number (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                    className="w-4 h-4 text-[#be531c] border-gray-300 rounded focus:ring-[#be531c]"
                  />
                </div>
                <div className="ml-3 text-sm text-gray-700 leading-snug">
                  By signing up, you agree to our{' '}
                  <button
                    type="button"
                    onClick={() => openModal('privacy')}
                    className="text-[#be531c] font-semibold hover:underline"
                  >
                    Privacy Policy
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => openModal('terms')}
                    className="text-[#be531c] font-semibold hover:underline"
                  >
                    Terms of Service
                  </button>.
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white bg-[#be531c] rounded-lg font-semibold shadow-md hover:bg-[#a64919] focus:outline-none focus:ring-4 focus:ring-[#be531c] focus:ring-opacity-50 disabled:bg-[#be531c]/50 transition"
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
              className="ml-1 font-bold text-[#be531c] hover:text-[#a64919] transition"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
