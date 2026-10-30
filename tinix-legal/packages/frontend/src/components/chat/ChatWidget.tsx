'use client';
import { useState } from 'react';
import ChatWindow from './ChatWindow';
import { MessageCircle, X } from 'lucide-react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[380px] h-[600px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col z-50 border border-gray-200">
          <div className="bg-gradient-to-r from-[#0B1D51] to-blue-800 p-4 text-white flex justify-between items-center shadow-md">
            <h3 className="font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5"/> AI Pháp Lý
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <ChatWindow />
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/30 hover:scale-105 transition-all z-50"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
}
