"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient"; // Supabase client import'u

const NewsLetter = () => {
  const [email, setEmail] = useState(""); // Kullanıcının girdiği e-posta
  const [showModal, setShowModal] = useState(false);

  // === 5 dakikada bir popup kontrolü ===
  useEffect(() => {
    const lastSeen = localStorage.getItem("popupLastSeen");
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (!lastSeen || now - parseInt(lastSeen) >= fiveMinutes) {
      setShowModal(true);
      localStorage.setItem("popupLastSeen", now.toString());
    }
  }, []);

  const handleSubscribe = async () => {
    if (!email) return;

    const { error } = await supabase.from("subscribers").insert([{ email }]);
    if (error) {
      alert("Bir hata oluştu!");
      console.error(error);
    } else {
      alert("Bültene abone oldunuz!");
      sendEmailToSubscriber(email);
    }
  };

  const sendEmailToSubscriber = async (email) => {
    const response = await fetch("/api/sendEmail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (data.success) {
      alert("E-posta gönderildi!");
    } else {
      alert("E-posta gönderme hatası!");
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      {showModal && (
        <div
          onClick={closeModal}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white/80 backdrop-blur-lg p-10 rounded-2xl shadow-2xl max-w-md w-full relative animate-fade-in transition-all duration-300"
          >
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl"
            >
              ✕
            </button>
            <h1 className="text-3xl font-semibold text-gray-900 mb-4 text-center">
              Subscribe now & get 20% off
            </h1>
            <div className="flex items-center justify-between mb-2">
              <input
                className="border border-gray-300 rounded-md h-12 w-full px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200"
                type="text"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                onClick={handleSubscribe}
                className="px-6 py-3 text-white bg-gradient-to-r from-orange-500 to-yellow-500 rounded-md ml-3 hover:scale-105 transition-all duration-300"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alt kısım: sayfada da sabit form */}
      <div className="flex flex-col items-center justify-center text-center space-y-2 pt-8 pb-14">
        <h1 className="md:text-4xl text-2xl font-medium text-gray-800">
          Subscribe now & get 20% off
        </h1>
        <div className="flex items-center justify-between max-w-2xl w-full md:h-14 h-12">
          <input
            className="border border-gray-500/30 rounded-md h-full border-r-0 outline-none w-full rounded-r-none px-3 text-gray-500"
            type="text"
            placeholder="Enter your email id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={handleSubscribe}
            className="md:px-12 px-8 h-full text-white bg-gradient-to-r from-orange-500 to-yellow-500 rounded-md rounded-l-none hover:scale-105 transition-all duration-300"
          >
            Subscribe
          </button>
        </div>
      </div>
    </>
  );
};

export default NewsLetter;
