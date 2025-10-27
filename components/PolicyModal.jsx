'use client';

import Image from 'next/image';
import logo from '@/assets/logos.png';

// === POLICY CONTENT ===
export const PolicyContent = ({ type }) => {
  const isPrivacy = type === 'privacy';

  if (isPrivacy) {
    // Yeni Gizlilik Politikası içeriği
    return (
      <div className="space-y-4 text-gray-700 leading-relaxed">
        <p>
          At <strong>Nestcome</strong>, we respect your privacy and are committed to protecting your personal
          information. This Privacy Policy explains how we collect, use, and protect your data when you visit or make a
          purchase from our website.
        </p>
        <p>
          <strong>Information We Collect:</strong> We may collect the following types of information:
          <ul className="list-disc ml-6 mt-1 space-y-1">
              <li>Personal details such as name, billing and shipping address, email, and phone number.</li>
              <li>Payment information (processed securely through third-party payment gateways).</li>
              <li>Device information (browser type, IP address, cookies, etc.) for analytics and website performance.</li>
          </ul>
        </p>
        <p>
          <strong>How We Use Your Information:</strong> We use your information to:
          <ul className="list-disc ml-6 mt-1 space-y-1">
              <li>Process and fulfill your orders.</li>
              <li>Communicate with you about your purchase or account.</li>
              <li>Improve our website and services.</li>
              <li>Send marketing emails only if you opt-in.</li>
          </ul>
        </p>
        <p>
          <strong>Sharing Your Information:</strong> We do not sell or rent your personal information. We may share it only with trusted service providers (e.g., payment processors, shipping carriers) who help us operate our business.
        </p>
        <p>
          <strong>Data Security:</strong> We use SSL encryption and follow industry standards to protect your personal data from unauthorized access.
        </p>
        <p>
          <strong>Your Rights:</strong> You may request access, correction, or deletion of your personal data by contacting us at <a href="mailto:nestcomecontact@gmail.com" className="text-[#be531c] hover:underline">nestcomecontact@gmail.com</a>.
        </p>
      </div>
    );
  }

  // Yeni Gönderim ve İade Politikası ile birleştirilmiş Hizmet Şartları içeriği
  return (
    <div className="space-y-6 text-gray-700 leading-relaxed">
        {/* Shipping Policy */}
        <div className="border-b pb-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Shipping Policy</h3>
            <p>
                <strong>Service Area:</strong> We currently ship within the United States.
            </p>
            <p>
                <strong>Processing Time:</strong> Orders are processed within 1–3 business days after payment is confirmed. Custom or bulk orders may take longer; you’ll be notified by email if there is any delay.
            </p>
            <p>
                <strong>Shipping Rates:</strong> Shipping costs are calculated at checkout based on the total weight and destination of your order.
            </p>
            <p>
                <strong>Estimated Delivery Time:</strong>
                <ul className="list-disc ml-6 mt-1 space-y-1">
                    <li>Standard Shipping: 3–7 business days</li>
                    <li>Expedited Shipping: 1–3 business days</li>
                </ul>
            </p>
            <p className="text-sm italic">
                Please note: We are not responsible for shipping delays caused by the carrier, weather, or incorrect addresses provided by the customer.
            </p>
            <p>
                <strong>Tracking Information:</strong> Once your order has shipped, you will receive an email with tracking details.
            </p>
        </div>

        {/* Return & Refund Policy */}
        <div className="border-b pb-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Return & Refund Policy</h3>
            <p>
                We want you to love your purchase! If you are not satisfied with your order, you may request a return within <strong>14 days of receiving it</strong>.
            </p>
            <p>
                <strong>Return Conditions:</strong>
                <ul className="list-disc ml-6 mt-1 space-y-1">
                    <li>Items must be unused, undamaged, and in their original packaging.</li>
                    <li>You are responsible for return shipping costs unless the item arrived damaged or defective.</li>
                </ul>
            </p>
            <p>
                To start a return, contact us at <a href="mailto:nestcomecontact@gmail.com" className="text-[#be531c] hover:underline">nestcomecontact@gmail.com</a> with your order number.
            </p>
            <p>
                <strong>Non-returnable items:</strong> Used or washed items, Clearance or final sale items, Customized products.
            </p>
            <p>
                <strong>Refunds:</strong> Approved refunds will be issued to your original payment method within 5–7 business days after your return is received and inspected.
            </p>
            <p>
                <strong>Damaged or Broken Items:</strong> If your order arrives damaged, please contact us within 48 hours of delivery with photos. We will send a replacement or issue a full refund.
            </p>
        </div>

        {/* General Terms of Service (Nestcome için güncellenmiş) */}
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">General Terms of Service</h3>
            <p>
                Welcome to <strong>Nestcome</strong>. These general terms outline the rules for using our website and services. By accessing our platform, you agree to comply with these terms.
            </p>
            <p>
                <strong>1. Account Responsibility:</strong> You are responsible for maintaining the confidentiality of your login credentials and all activities under your account. We reserve the right to suspend or terminate accounts for policy violations.
            </p>
            <p>
                <strong>2. Acceptable Use:</strong> You agree to use our services only for lawful purposes. Fraudulent activities or misuse of our platform will result in immediate termination and possible legal action.
            </p>
            <p>
                <strong>3. Orders & Payments:</strong> All transactions must be valid and authorized. We reserve the right to cancel orders in case of payment issues, pricing errors, or stock unavailability.
            </p>
            <p>
                <strong>4. Intellectual Property:</strong> All text, images, graphics, and software are the property of <strong>Nestcome</strong> and protected under applicable laws. Unauthorized use is strictly prohibited.
            </p>
            <p>
                <strong>5. Limitation of Liability:</strong> We are not liable for any indirect, incidental, or consequential damages resulting from the use of our services to the maximum extent permitted by law.
            </p>
            <p>
                <strong>6. Changes to Terms:</strong> We may update these Terms at any time to reflect new legal requirements or business practices. Continued use of the platform constitutes acceptance of these changes.
            </p>
            <p>
                <strong>7. Governing Law:</strong> These Terms are governed by applicable local laws. Any disputes will be resolved under the exclusive jurisdiction of the competent courts.
            </p>
            <p>
                By creating an account or using our services, you confirm that you have read, understood, and agreed to these Terms of Service.
            </p>
        </div>
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