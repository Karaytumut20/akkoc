"use client";

import React from "react";
import { FiMail, FiInstagram } from "react-icons/fi";

export default function ContactPage() {
  const mailLink = `https://mail.google.com/mail/?view=cm&fs=1&tf=cm&to=nestcomecontact@gmail.com&su=Contact%20Request&body=Hello%2C%20I%20would%20like%20to%20get%20in%20touch%20with%20you.`

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 px-4">
      <div className="max-w-lg w-full bg-white p-10 rounded-2xl shadow-2xl text-center space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Contact</h1>
        <p className="text-gray-600">
          Bize aşağıdaki kanallardan ulaşabilirsiniz 👇
        </p>

        {/* Instagram */}
        <div
          className="flex items-center justify-center gap-3 hover:bg-gray-100 p-3 rounded-xl transition cursor-pointer"
          onClick={() =>
            window.open("https://www.instagram.com/nestcome.kitchen", "_blank")
          }
        >
          <FiInstagram className="text-pink-500 text-2xl" />
          <span className="text-gray-800 text-lg">@nestcome.kitchen</span>
        </div>

        {/* Mail */}
        <div
          className="flex items-center justify-center gap-3 hover:bg-gray-100 p-3 rounded-xl transition cursor-pointer"
          onClick={() => window.open(mailLink, "_blank")}
        >
          <FiMail className="text-blue-500 text-2xl" />
          <span className="text-gray-800 text-lg">
            nestcomecontact@gmail.com
          </span>
        </div>
      </div>
    </div>
  );
}
