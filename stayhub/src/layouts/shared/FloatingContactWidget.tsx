import React from "react";
import { MessageCircle, Phone } from "lucide-react";

export const FloatingContactWidget = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Facebook */}
      <a
        href="#"
        target="_blank"
        rel="noreferrer"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-110 hover:shadow-xl"
        title="Facebook"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      </a>
      
      {/* Zalo */}
      <a
        href="#"
        target="_blank"
        rel="noreferrer"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-transform hover:scale-110 hover:shadow-xl"
        title="Zalo"
      >
        <MessageCircle size={24} />
      </a>
      
      {/* Phone */}
      <a
        href="#"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform hover:scale-110 hover:shadow-xl"
        title="Hotline"
      >
        <Phone size={22} className="fill-white" />
      </a>
    </div>
  );
};
