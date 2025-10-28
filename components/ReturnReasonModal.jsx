// components/ReturnReasonModal.jsx
'use client';

import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import Image from 'next/image';
import { getSafeImageUrl } from '@/lib/utils';

// List of return reasons (can be expanded)
const RETURN_REASONS = [
  "Received wrong product",
  "Product is damaged or defective",
  "Does not match the description",
  "No longer needed",
  "Ordered wrong size/dimension",
  "Found a better price",
  "Other",
];

const ReturnReasonModal = ({ isOpen, onClose, orderItem, onSubmitReturn }) => {
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [otherReasonText, setOtherReasonText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !orderItem) return null;

  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    setSelectedReasons((prev) =>
      checked ? [...prev, value] : prev.filter((reason) => reason !== value)
    );
    if (value === 'Other' && !checked) {
      setOtherReasonText('');
    }
  };

  const handleSubmit = async () => {
    if (selectedReasons.length === 0) {
      alert('Please select at least one reason for return.');
      return;
    }
    if (selectedReasons.includes('Other') && !otherReasonText.trim()) {
      alert("Please describe your 'Other' reason.");
      return;
    }

    setLoading(true);

    // Combine selected reasons
    let finalReason = selectedReasons.filter((r) => r !== 'Other').join(', ');
    if (selectedReasons.includes('Other') && otherReasonText.trim()) {
      finalReason += (finalReason ? '; ' : '') + `Other: ${otherReasonText.trim()}`;
    }

    await onSubmitReturn(finalReason);

    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition p-1"
          aria-label="Close"
        >
          <FiX size={24} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Return Reason</h2>

        {/* Returned Product Info */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg border">
          <Image
            src={getSafeImageUrl(orderItem.products.image_urls)}
            alt={orderItem.products.name}
            width={48}
            height={48}
            className="rounded-md object-cover w-12 h-12"
          />
          <div>
            <p className="font-medium text-gray-700">{orderItem.products.name}</p>
            <p className="text-xs text-gray-500">Quantity: {orderItem.quantity}</p>
          </div>
        </div>

        {/* Return Reasons Checkboxes */}
        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
          {RETURN_REASONS.map((reason) => (
            <label
              key={reason}
              className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-100"
            >
              <input
                type="checkbox"
                value={reason}
                checked={selectedReasons.includes(reason)}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-gray-700">{reason}</span>
            </label>
          ))}
        </div>

        {/* 'Other' Textarea */}
        {selectedReasons.includes('Other') && (
          <div className="mb-6">
            <label
              htmlFor="otherReason"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Please describe your "Other" reason:
            </label>
            <textarea
              id="otherReason"
              value={otherReasonText}
              onChange={(e) => setOtherReasonText(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-orange-500 focus:border-orange-500 transition resize-none"
              placeholder="Write your return reason here..."
              maxLength={250}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              selectedReasons.length === 0 ||
              (selectedReasons.includes('Other') && !otherReasonText.trim())
            }
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Return Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnReasonModal;
