'use client';

import { useState, useCallback, useEffect } from 'react'; // useEffect'i ekleyin
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import logo from '@/assets/logos.png';
import { supabase } from '@/lib/supabaseClient';
import { PolicyModal } from '@/components/PolicyModal';

// FloatingLabelInput bileşeni aynı kalıyor...
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

// ForgotPasswordModal bileşeni aynı kalıyor...
const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast.success('📧 Password reset email sent! Check your inbox.');
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#FFFFFF] rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#be531c] hover:text-[#a64919] text-2xl font-bold"
        >
          &times;
        </button>
        <div className="flex items-center gap-3 mb-4">
          <Image src={logo} alt="Logo" width={40} height={40} />
          <h3 className="text-2xl font-semibold text-[#be531c]">Forgot Password</h3>
        </div>
        
        <form className="space-y-6" onSubmit={handleResetPassword}>
          <p className="text-sm text-gray-700">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <FloatingLabelInput
            id="resetEmail"
            name="email"
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-white bg-[#be531c] rounded-lg font-semibold shadow-md hover:bg-[#a64919] focus:outline-none focus:ring-4 focus:ring-[#be531c] focus:ring-opacity-50 disabled:bg-[#be531c]/50 transition"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm text-gray-600 rounded-lg hover:text-gray-900 transition"
          >
            Cancel
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
  
  // Modals state
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [modalContentType, setModalContentType] = useState(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Oturum durumunu kontrol etmek için useEffect ekleyin
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };
    
    checkUser();

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Policy Modal handlers
  const openPolicyModal = useCallback((type) => {
    setModalContentType(type);
    setIsPolicyModalOpen(true);
  }, []);

  const closePolicyModal = useCallback(() => {
    setIsPolicyModalOpen(false);
    setModalContentType(null);
  }, []);
  
  // Forgot Password Modal handlers
  const openForgotModal = useCallback(() => {
    setIsForgotModalOpen(true);
  }, []);

  const closeForgotModal = useCallback(() => {
    setIsForgotModalOpen(false);
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
        // --- LOGIN LOGIC ---
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
          // Router push'u kaldırdık çünkü useEffect otomatik yönlendirecek
        }

      } else {
        // --- SIGN UP LOGIC ---
        const { error } = await supabase.auth.signUp({
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
        setTermsAccepted(false);
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
      
      {/* Policy Modal */}
      {isPolicyModalOpen && (
        <PolicyModal 
          isOpen={isPolicyModalOpen} 
          onClose={closePolicyModal} 
          type={modalContentType} 
        />
      )}
      
      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={closeForgotModal} 
      />

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

            {isLogin ? (
              <div className="flex justify-end text-sm">
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="font-semibold text-[#be531c] hover:text-[#a64919] transition"
                >
                  Forgot Password?
                </button>
              </div>
            ) : (
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
                    onClick={() => openPolicyModal('privacy')}
                    className="text-[#be531c] font-semibold hover:underline"
                  >
                    Privacy Policy
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => openPolicyModal('terms')}
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