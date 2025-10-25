'use client';

import Image from 'next/image';
import logo from '@/assets/logos.png';

// === POLICY CONTENT ===
export const PolicyContent = ({ type }) => {
  const isPrivacy = type === 'privacy';

  if (isPrivacy) {
    return (
      <div className="space-y-4 text-gray-700 leading-relaxed">
        <p>
          At <strong>Your Company</strong>, we value your trust and are committed to safeguarding
          your personal information. This Privacy Policy explains how we collect, use, store, and
          protect your data when you use our services.
        </p>
        <p><strong>1. Information We Collect:</strong> Personal info like name, email, shipping address, etc.</p>
        <p><strong>2. How We Use:</strong> Process orders, improve experience, secure accounts.</p>
        <p><strong>3. Data Protection:</strong> Secure encrypted storage, strong privacy protocols.</p>
        <p><strong>4. Third-Party Disclosure:</strong> Only with trusted partners for order fulfillment.</p>
        <p><strong>5. Your Rights:</strong> Access, modify or delete your data anytime.</p>
        <p><strong>6. Policy Updates:</strong> Updates will be communicated through our platform.</p>
        <p>By using our platform, you acknowledge that you have read and understood this Privacy Policy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-gray-700 leading-relaxed">
      <p>
        Welcome to <strong>Your Company</strong>. These Terms of Service outline the rules and
        regulations for using our website and services.
      </p>
      <p><strong>1. Account Responsibility:</strong> Keep your credentials secure.</p>
      <p><strong>2. Acceptable Use:</strong> No fraudulent activity or misuse allowed.</p>
      <p><strong>3. Orders & Payments:</strong> All transactions must be valid and authorized.</p>
      <p><strong>4. Intellectual Property:</strong> All content is the property of Your Company.</p>
      <p><strong>5. Limitation of Liability:</strong> We’re not liable for indirect damages.</p>
      <p><strong>6. Changes:</strong> Continued use = acceptance of updates.</p>
      <p><strong>7. Governing Law:</strong> Disputes resolved under local law.</p>
      <p>By using our services, you agree to these Terms of Service.</p>
    </div>
  );
};

// === POLICY MODAL ===
export const PolicyModal = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;
  const title = type === 'privacy' ? 'Privacy Policy' : 'Terms of Service';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFFFF] rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 relative"
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
          <h3 className="text-2xl font-semibold text-[#be531c]">{title}</h3>
        </div>
        <div className="max-h-[70vh] overflow-y-auto text-sm pr-2">
          <PolicyContent type={type} />
        </div>
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
