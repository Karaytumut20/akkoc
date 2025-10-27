"use client";

import React from "react";
import Image from "next/image";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 flex flex-col items-center">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Image
          src="/assets/Shipping.png"
          alt="Shipping Logo"
          width={100}
          height={100}
          className="object-contain"
        />
      </div>

      {/* Başlık */}
      <h1 className="text-2xl font-bold text-[#BE531C] mb-10 text-center">
        Terms of Service
      </h1>

      <div className="max-w-3xl w-full text-left space-y-10">
        {/* ================= SHIPPING POLICY ================= */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Shipping Policy
          </h2>

          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Service Area:</span> We currently ship within the United States.
          </p>

          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Processing Time:</span> Orders are processed within 1–3 business days after payment is confirmed. Custom or bulk orders may take longer; you’ll be notified by email if there is any delay.
          </p>

          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Shipping Rates:</span> Shipping costs are calculated at checkout based on the total weight and destination of your order.
          </p>

          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Estimated Delivery Time:</span>
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-2">
            <li>Standard Shipping: 3–7 business days</li>
            <li>Expedited Shipping: 1–3 business days</li>
          </ul>

          <p className="text-gray-700 italic mb-2">
            Please note: We are not responsible for shipping delays caused by the carrier, weather, or incorrect addresses provided by the customer.
          </p>

          <p className="text-gray-700">
            <span className="font-semibold">Tracking Information:</span> Once your order has shipped, you will receive an email with tracking details.
          </p>
        </section>

        {/* ================= RETURN & REFUND POLICY ================= */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Return & Refund Policy
          </h2>

          <p className="text-gray-700 mb-4">
            We want you to love your purchase! If you are not satisfied with your order, you may request a return within{" "}
            <span className="font-semibold italic">14 days of receiving it.</span>
          </p>

          <p className="text-gray-900 font-semibold mb-1">Return Conditions:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Items must be unused, undamaged, and in their original packaging.</li>
            <li>You are responsible for return shipping costs unless the item arrived damaged or defective.</li>
          </ul>

          <p className="text-gray-700 mb-4">
            To start a return, contact us at{" "}
            <a
              href="mailto:nestcomecontact@gmail.com"
              className="text-[#BE531C] underline"
            >
              nestcomecontact@gmail.com
            </a>{" "}
            with your order number.
          </p>

          <p className="text-gray-900 font-semibold mb-1">Non-returnable items:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Used or washed items</li>
            <li>Clearance or final sale items</li>
            <li>Customized products</li>
          </ul>

          <p className="text-gray-900 font-semibold mb-1">Refunds:</p>
          <p className="text-gray-700 mb-4">
            Approved refunds will be issued to your original payment method within 5–7 business days after your return is received and inspected.
          </p>

          <p className="text-gray-900 font-semibold mb-1">Damaged or Broken Items:</p>
          <p className="text-gray-700">
            If your order arrives damaged, please contact us within 48 hours of delivery with photos. We will send a replacement or issue a full refund.
          </p>
        </section>
      </div>

      {/* ================= BUTTON ================= */}
      <div className="mt-12">
        <button
          onClick={() => window.location.href = "/"}
          className="px-8 py-3 rounded-full bg-[#BE531C] text-white text-sm font-semibold hover:bg-[#9e4518] transition-all duration-300 shadow-md"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
