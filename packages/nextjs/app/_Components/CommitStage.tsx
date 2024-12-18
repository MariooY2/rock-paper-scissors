"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa";
import { useAccount } from "wagmi";

// Enum for moves
enum Moves {
  Rock = 1,
  Paper = 2,
  Scissors = 3,
}

const moveImages = {
  [Moves.Rock]: "/images/rock.png", // Replace with the actual path to your rock image
  [Moves.Paper]: "/images/paper.png", // Replace with the actual path to your paper image
  [Moves.Scissors]: "/images/scissors.png", // Replace with the actual path to your scissors image
};

type Player = [string, string, number];

const CommitStage: React.FC<{
  player1: Player;
  player2: Player;
  onCommit: (move: Moves, secret: string) => void;
}> = ({ onCommit, player1, player2 }) => {
  const [selectedMove, setSelectedMove] = useState<Moves | null>(null);
  const [secret, setSecret] = useState<string>("");

  const generateRandomSecret = () => Math.random().toString(36).substring(2, 15);
  const { address } = useAccount();

  if (address == player1[0] && player1[1] != "0x0000000000000000000000000000000000000000000000000000000000000000")
    return (
      <>
        <h1 className="text-center text-xl text-black mt-5 flex items-center justify-center gap-2">
          <FaSpinner className="animate-spin text-blue-500" />
          Waiting for Player 2
        </h1>
      </>
    );
  if (address == player2[0] && player2[1] != "0x0000000000000000000000000000000000000000000000000000000000000000")
    return (
      <>
        <h1 className="text-center text-xl text-black mt-5 flex items-center justify-center gap-2">
          <FaSpinner className="animate-spin text-blue-500" />
          Waiting for Player 1
        </h1>
      </>
    );
  return (
    <div className="mt-12 max-w-md mx-auto p-6 bg-white rounded-lg shadow-2xl">
      <h2 className="text-2xl font-bold mb-4 text-black">Commit Your Move</h2>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {Object.values(Moves)
          .filter(value => typeof value === "number")
          .map(move => (
            <button
              key={move}
              onClick={() => setSelectedMove(move as Moves)}
              className={`py-2 rounded flex items-center justify-center ${
                selectedMove === move ? "bg-blue-500 " : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Image
                src={moveImages[move as Moves]}
                alt={Moves[move as Moves]}
                width={50}
                height={50}
                className="mb-2"
              />
            </button>
          ))}
      </div>

      <button
        onClick={() => {
          if (selectedMove !== null) {
            const newSecret = generateRandomSecret(); // Generate the secret
            setSecret(newSecret); // Update the state
            onCommit(selectedMove, newSecret);
          }
        }}
        className="w-full bg-blue-500 text-white p-5 rounded hover:bg-blue-600"
        disabled={
          selectedMove === null ||
          (address?.toLowerCase() != player1[0].toLowerCase() && address?.toLowerCase() != player2[0].toLowerCase()) ||
          (address.toLowerCase() === player1[0].toLowerCase() &&
            player1[1] !== "0x0000000000000000000000000000000000000000000000000000000000000000") ||
          (address.toLowerCase() === player2[0].toLowerCase() &&
            player2[1] !== "0x0000000000000000000000000000000000000000000000000000000000000000")
        }
      >
        Choose Move
      </button>
    </div>
  );
};

export default CommitStage;
