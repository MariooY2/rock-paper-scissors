"use client";

import React from "react";
import { isAddress } from "viem";
import InfoPopup from "./InfoOverlay";
import Image from "next/image";

interface DeployStageProps {
  rivalAddress: string;
  setRivalAddress: (address: string) => void;
  betAmount: string;
  setBetAmount: (amount: string) => void;
  onDeploy: () => Promise<void>;
}

const DeployStage: React.FC<DeployStageProps> = ({
  rivalAddress,
  setRivalAddress,
  betAmount,
  setBetAmount,
  onDeploy,
}) => {
  const isRivalAddressValid = isAddress(rivalAddress);


  
  return (
    <div className="mt-4 flex items-center justify-center text-white">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="my-5">
      <div className="flex items-center justify-end">
      <InfoPopup />
          </div>
          <Image src="/images/logo-rps.png" width={600} height={600} alt="Rock Paper Scissors" className="mx-auto" />
        </div>
     

        <input
          type="text"
          placeholder="Enter Rival's Wallet Address"
          value={rivalAddress}
          onChange={(e) => setRivalAddress(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        {!isRivalAddressValid && rivalAddress && (
          <p className="text-red-500 mb-2">Invalid Ethereum address</p>
        )}

        <input
          type="number"
          placeholder="Enter Bet Amount (ETH)"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          step="0.01"
        />

        {/* Deploy Button */}
        <button
          onClick={onDeploy}
          className={`w-full p-5 rounded ${
            isRivalAddressValid ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400"
          }`}
          disabled={!isRivalAddressValid}
        >
        Start New Game        
        </button>
      </div>
    </div>
  );
};

export default DeployStage;
