import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient"; // Supabase client import'u

const NewsLetter = () => {
  const [email, setEmail] = useState(""); // Kullanıcının girdiği e-posta
  const [showModal, setShowModal] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);

  const handleSubscribe = async () => {
    if (!email) return;

    // Supabase'e e-posta ekleyelim
    const { data, error } = await supabase
      .from("subscribers")
      .insert([{ email }]);

    if (error) {
      alert("Bir hata oluştu!");
      console.error(error);
    } else {
      alert("Bültene abone oldunuz!");
      sendEmailToSubscriber(email); // E-posta gönderme fonksiyonu çağırılıyor
    }
  };

  const sendEmailToSubscriber = async (email) => {
    // Burada EmailJS veya SendGrid gibi bir servise istekte bulunabiliriz
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

  return (
    <>
      {showModal && !hasSeenPopup && (
        <div
          id="modal-overlay"
          className="fixed top-0 left-0 right-0 bottom-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
        >
          <div className="bg-white p-10 rounded-xl shadow-2xl max-w-md w-full relative transform transition-all duration-300 ease-in-out scale-95 hover:scale-100">
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">
              Subscribe now & get 20% off
            </h1>
            <div className="flex items-center justify-between mb-6">
              <input
                className="border border-gray-300 rounded-md h-12 w-full px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                type="text"
                placeholder="Enter your email id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                onClick={handleSubscribe}
                className="px-6 py-3 text-white bg-gradient-to-r from-orange-500 to-yellow-500 rounded-md ml-3 hover:bg-orange-700 transition-all duration-300"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      )}

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
            className="md:px-12 px-8 h-full text-white bg-gradient-to-r from-orange-500 to-yellow-500 rounded-md rounded-l-none"
          >
            Subscribe
          </button>
        </div>
      </div>
    </>
  );
};

export default NewsLetter;
