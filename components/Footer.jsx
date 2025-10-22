import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const Footer = () => {
  return (
    <footer>
      <div className="flex flex-col md:flex-row items-start justify-center px-6 md:px-16 lg:px-32 gap-10 py-14 border-b border-gray-500/30 text-gray-500">
        {/* Logo ve Açıklama */}
        <div className="w-4/5">
          <Image className="w-28 md:w-32" src={assets.logo} alt="logo" />
          <p className="mt-6 text-sm">
            Nestcome specializes in premium-quality tableware crafted with care and precision.
            mission is to elevate your dining experience with elegant, functional, and sustainable designs.
          </p>
        </div>

        {/* Company Linkleri */}
        <div className="w-1/2 flex items-center justify-start md:justify-center">
          <div>
            <h2 className="font-medium text-gray-900 mb-5">Company</h2>
            <ul className="text-sm space-y-2">
              <li>
                <a className="hover:underline transition" href="#">
                  Home
                </a>
              </li>
              
              <li>
                <a className="hover:underline transition" href="#">
                  Contact us
                </a>
              </li>
              <li>
                <a className="hover:underline transition" href="#">
                  Privacy policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* İletişim Bilgileri */}
        <div className="w-1/2 flex items-start justify-start md:justify-center">
          <div>
            <h2 className="font-medium text-gray-900 mb-5">Get in touch</h2>
            <div className="text-sm space-y-2">
              <p>
                <a
                  href="https://www.instagram.com/nestcome.kitchen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline transition text-[#0D9488]"
                >
                  @nestcome.kitchen
                </a>
              </p>
              <p>
                <a
                  href="mailto:nestcomecontact@gmail.com"
                  className="hover:underline transition text-[#0D9488]"
                >
                  nestcomecontact@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alt Telif */}
      <p className="py-4 text-center text-xs md:text-sm">
        Copyright 2025 © GreatStack.dev All Right Reserved.
      </p>
    </footer>
  );
};

export default Footer;
