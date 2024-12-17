"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ContractData from "../public/Game.json";
import DeployStage from "./_Components/DeployStage";
import { isAddress, parseEther } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { usePublicClient } from "wagmi";

const RockPaperScissorsGame: React.FC = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [rivalAddress, setRivalAddress] = useState("");
  const [gameAddresses, setGameAddresses] = useState<string[]>([]);

  const [betAmount, setBetAmount] = useState("");
  const [inputAddress, setInputAddress] = useState<string>("");
  const Router = useRouter();
  const client = usePublicClient();
  const isAddressValid = isAddress(inputAddress);

  useEffect(() => {
    const savedAddresses = JSON.parse(localStorage.getItem("gameAddresses") || "[]");
    setGameAddresses(savedAddresses);
  }, []);

  const deployContract = async () => {
    if (!walletClient || !address) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      const { abi, bytecode } = ContractData;
      const deploymentResult = await walletClient.deployContract({
        abi,
        account: address,
        args: [address, rivalAddress, parseEther(betAmount)],
        bytecode: bytecode as `0x${string}`,
      });
      const receipt = await client?.waitForTransactionReceipt({ hash: deploymentResult });
      const contractAdd = receipt?.contractAddress;
      if (contractAdd) {
        alert(`Contract deployed at: ${contractAdd}`);
        const updatedAddresses = [...gameAddresses, contractAdd];
        setGameAddresses(updatedAddresses);
        localStorage.setItem("gameAddresses", JSON.stringify(updatedAddresses));

        Router.push(`/Game/${contractAdd}`);
      }
    } catch (error) {
      console.error("Error deploying contract:", error);
      alert("Failed to deploy contract.");
    }
  };

  const handleNavigate = () => {
    if (inputAddress.trim() === "") {
      alert("Please enter a valid address!");
      return;
    }
    Router.push(`/Game/${inputAddress}`);
  };

  return (
    <div>
      <div className="flex justify-around lg:flex-nowrap flex-wrap">
        <DeployStage
          rivalAddress={rivalAddress}
          setRivalAddress={setRivalAddress}
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          onDeploy={deployContract}
        />
        <div className="flex items-center justify-center">
          <h3 className="p-6 lg:text-4xl text-2xl">OR</h3>
        </div>

        <div className="w-[400px] h-55 p-6 bg-white rounded-lg shadow-md flex flex-col justify-center gap-1" >
          
          <h4 className="text-l font-bold text-black">Already have a game started?</h4>
          <div className="w-70">
            <input
              type="text"
              value={inputAddress}
              onChange={e => setInputAddress(e.target.value)}
              placeholder="Enter Deployed Game Address"
              className="mt-2 w-full p-2 border rounded text-black mb-4"
            />
            {!isAddressValid && inputAddress && <p className="text-red-500">Invalid Contract address</p>}
          </div>

          <button
            onClick={handleNavigate}
            className={`w-full p-3 rounded ${isAddressValid ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400"}`}
            disabled={!isAddressValid}
          >
            Go to Game
          </button>
        </div>
      </div>

      {/* Display the list of game addresses */}
      <div className="mt-10">
        <h3 className="text-lg font-bold text-center text-black mb-4">Deployed Game Addresses:</h3>
        {gameAddresses.length > 0 ? (
          <ul className="list-disc list-inside">
            {gameAddresses.map((address, index) => (
              <li key={index} className="text-black text-center">
                {address}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No deployed game addresses yet.</p>
        )}
      </div>
    </div>
  );
};

export default RockPaperScissorsGame;
