"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AiOutlineInfoCircle } from "react-icons/ai";

const InfoPopup: React.FC = () => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  return (
    <div className="relative flex items-center justify-center">
      <button
        onClick={() => setIsPopupVisible(!isPopupVisible)}
        className="text-black text-2xl hover:bg-blue-600 p-2 rounded-full shadow-md focus:outline-none"
        aria-label="Info"
      >
        <AiOutlineInfoCircle />
      </button>

      {isPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="relative bg-white rounded-lg shadow-lg max-w-[90%] max-h-[90%] overflow-hidden p-4">
            {/* Close Button */}
            <button
              onClick={() => setIsPopupVisible(false)}
              className="absolute top-3 right-3 text-red-500 hover:text-red-600 text-2xl focus:outline-none"
              aria-label="Close"
            >
              &times;
            </button>

            {/* Content Container */}
            <div className="w-full flex flex-col items-center">
              <div className="text-center p-6">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
                  Welcome to Rock, Paper, Scissors on the Blockchain!
                </h1>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Due to the nature of the blockchain, players must commit their moves before revealing them.
                </p>
              </div>

              <div className="text-center p-3">
                <Image
                  src="/image.png"
                  alt="Tutorial"
                  layout="intrinsic"
                  width={1000}
                  height={600}
                  className="rounded-lg"
                />
                <p className="text-lg text-gray-700 leading-relaxed">
                  A project for the Encode Club EVM certification.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoPopup;
