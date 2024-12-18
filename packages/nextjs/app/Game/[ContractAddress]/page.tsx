"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ContractData from "../../../public/Game.json";
import { encodePacked, formatEther, keccak256 } from "viem";
import { useReadContract, useWriteContract } from "wagmi";
import { useAccount } from "wagmi";
import CommitStage from "~~/app/_Components/CommitStage";
import RevealStage from "~~/app/_Components/RevealStage";

enum Moves {
  Rock = 1,
  Paper = 2,
  Scissors = 3,
}
const moveImages = {
  [Moves.Rock]: "/images/rock.png",
  [Moves.Paper]: "/images/paper.png",
  [Moves.Scissors]: "/images/scissors.png",
} as const satisfies Record<Moves, string>;
type Player = [string, string, number];

function Page({ params }: { params: { ContractAddress: string } }) {
  const ContractAddress = params.ContractAddress;
  const { writeContract } = useWriteContract();
  const [move, setMove] = useState<Moves | null>(null);
  const [secret, setSecret] = useState<string>("");
  const address = useAccount();

  useEffect(() => {
    if (!address || typeof window === "undefined") return; // Ensure the address is available before fetching
    const savedMove = localStorage.getItem(`player_${address.address}_move`);
    const savedSecret = localStorage.getItem(`player_${address.address}_secret`);

    if (savedMove) {
      setMove(JSON.parse(savedMove)); // Set the move variable for the current player
    }
    if (savedSecret) {
      setSecret(savedSecret); // Set the secret variable for the current player
    }
  }, [address]); // React to changes in the player address

  const betAmountQuery = useReadContract({
    abi: ContractData.abi,
    address: ContractAddress,
    functionName: "betAmount",
  });

  const player1Query = useReadContract({
    abi: ContractData.abi,
    address: ContractAddress,
    functionName: "players",
    args: [0],
  });

  const player2Query = useReadContract({
    abi: ContractData.abi,
    address: ContractAddress,
    functionName: "players",
    args: [1],
  });

  const GameQuery = useReadContract({
    abi: ContractData.abi,
    address: ContractAddress,
    functionName: "gameState",
  });
  const ForfeitQuery = useReadContract({
    abi: ContractData.abi,
    address: ContractAddress,
    functionName: "surrender",
  });

  const { data: forfeiter, isLoading: isForfeitLoading } = ForfeitQuery;

  const { data: State, isLoading: isStateLoading, isError: isStateError } = GameQuery;

  const { data: betAmount, isLoading: isBetLoading, isError: isBetError, error: betError } = betAmountQuery;

  const { isLoading: isPlayer1Loading, isError: isPlayer1Error, error: player1Error } = player1Query;
  const player1 = (player1Query.data as Player) || ["", "", 0];
  const { isLoading: isPlayer2Loading, isError: isPlayer2Error, error: player2Error } = player2Query;
  const player2 = (player2Query.data as Player) || ["", "", 0];

  const winnerQuery = useReadContract({
    abi: ContractData.abi,
    address: ContractAddress,
    functionName: "viewWinner",
    query: {
      enabled: player1[2] != 0 && player2[2] != 0,
    },
  });
  const { data: winner, isLoading: isWinnerLoading, isError: isWinnerError, error: winnerError } = winnerQuery;

  const Router = useRouter();
  const commitMove = async (move: Moves, secret: string) => {
    if (!ContractAddress) {
      alert("Contract address not set. Please deploy the contract first.");
      return;
    }
    try {
      setMove(move);
      setSecret(secret);

      localStorage.setItem(`player_${address.address}_move`, JSON.stringify(move));
      localStorage.setItem(`player_${address.address}_secret`, secret);

      console.log(move, secret);
      const encoded = encodePacked(["uint8", "string"], [move, secret]);
      const commitHash = keccak256(encoded);

      writeContract({
        abi: ContractData.abi,
        address: ContractAddress,
        functionName: "commitMove",
        args: [commitHash],
        value: betAmount as bigint,
      });
      //alert("Move committed successfully!");
    } catch (error) {
      console.error("Error committing move:", error);
      alert("Failed to commit move.");
    }
  };

  const surrender = () => {
    try {
      writeContract({
        abi: ContractData.abi,
        address: ContractAddress,
        functionName: "forfeit",
        args: [],
      });
    } catch (error) {
      console.error("Error Surrendering:", error);
      alert("Failed to Surrender.");
    }
  };

  const renderWinnerInfo = (playerMove: Moves | null) => {
    if (forfeiter != "0x0000000000000000000000000000000000000000") {
      return (
        <div className="text-center">
          <p className="text-red-600 text-center">{`${
            forfeiter === player1[0] ? "Player 1" : "Player 2"
          } Forfeited`}</p>
          <button
            onClick={() => Router.push("/")}
            className="px-10 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-5"
          >
            Restart
          </button>
        </div>
      );
    }
    console.log(player1[2], player2[2]);
    if (isWinnerLoading) return <p>Loading winner...</p>;
    if (isWinnerError) return <p>Error fetching winner: {winnerError?.message}</p>;

    // Check if the game resulted in a draw
    if (winner === "0x0000000000000000000000000000000000000000") {
      // Spectator view for draw
      if (
        address.address?.toLowerCase() !== player1[0].toLowerCase() &&
        address.address?.toLowerCase() !== player2[0].toLowerCase()
      ) {
        return (
          <div className="text-center shadow-2xl">
            <p className="text-lg font-bold text-black mt-10 ">🤝 It&apos;s a Draw! Players had the same move.</p>
            <div className="flex justify-center items-center gap-4 mt-4">
              <div>
                <p className="font-medium text-gray-700">Player 1 Move</p>
                <Image
                  src={moveImages[player1[2] as Moves]}
                  alt={Moves[player1[2]]}
                  width={100}
                  height={100}
                  className="wiggle"
                />
                <p>{Moves[player1[2]]}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Player 2 Move</p>
                <Image
                  src={moveImages[player2[2] as Moves]}
                  alt={Moves[player2[2]]}
                  width={100}
                  height={100}
                  className="wiggle"
                />
                <p>{Moves[player2[2]]}</p>
              </div>
            </div>
          </div>
        );
      }

      // Player view for draw
      return (
        <div className="text-center shadow-2xl">
          <p className="text-lg font-bold text-black mt-10">🤝 Its a Draw! Try again.</p>
          <div className="flex justify-center items-center gap-4 mt-4">
            <div>
              <p className="font-medium text-gray-700">Your Move</p>
              <Image
                src={moveImages[player1[0] == address.address ? (player1[2] as Moves) : (player2[2] as Moves)]}
                alt={Moves[player1[0] == address.address ? (player1[2] as Moves) : (player2[2] as Moves)]}
                width={100}
                height={100}
                className="wiggle"
              />
              <p>{Moves[player1[0] == address.address ? (player1[2] as Moves) : (player2[2] as Moves)]}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Opponents Move</p>
              <Image
                src={moveImages[player1[0] == address.address ? (player1[2] as Moves) : (player2[2] as Moves)]}
                alt={Moves[player1[0] == address.address ? (player1[2] as Moves) : (player2[2] as Moves)]}
                width={100}
                height={100}
                className="wiggle"
              />
              <p>{Moves[player1[0] == address.address ? (player1[2] as Moves) : (player2[2] as Moves)]}</p>
            </div>
          </div>
        </div>
      );
    }

    // Determine the winner
    const isPlayer1Winner =
      typeof winner === "string" &&
      typeof player1[0] === "string" &&
      player1[0].toLowerCase().trim() === winner.toLowerCase().trim();

    // Spectator view
    if (
      address.address?.toLowerCase() !== player1[0].toLowerCase() &&
      address.address?.toLowerCase() !== player2[0].toLowerCase()
    ) {
      return (
        <div className="flex justify-center items-start">
          <div className="text-center shadow-2xl rounded-lg w-300 lg:w-1/2 text-black">
            <p className="text-2xl font-bold text-black mt-5">
              {isPlayer1Winner ? "🎉 Player 1 Won! 🎉" : "🎉 Player 2 Won! 🎉"}
            </p>
            <p className={`text-lg ${isPlayer1Winner ? "text-green-500" : "text-red-500"}`}>
              {`The winner won ${betAmount ? formatEther(betAmount as bigint)?.toString() : " "} ETH`}
            </p>
            <div className="flex justify-center items-center gap-8 mt-4">
              <div>
                <p className="font-medium text-gray-700">Player 1 Move</p>
                <Image
                  src={moveImages[player1[2] as Moves]}
                  alt={Moves[player1[2]]}
                  width={100}
                  height={100}
                  className="wiggle"
                />
                <p>{Moves[player1[2]]}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Player 2 Move</p>
                <Image
                  src={moveImages[player2[2] as Moves]}
                  alt={Moves[player2[2]]}
                  width={100}
                  height={100}
                  className="wiggle"
                />
                <p>{Moves[player2[2]]}</p>
              </div>
            </div>

            <button
              onClick={() => Router.push("/")}
              className="px-10 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-5"
            >
              Restart
            </button>
          </div>
        </div>
      );
    }

    // Player view (for both Player 1 and Player 2)
    const isUserWinner =
      typeof winner === "string" &&
      typeof address?.address === "string" &&
      address.address.toLowerCase().trim() === winner.toLowerCase().trim();

    const calculateOpponentMove = (myMove: Moves, won: boolean): Moves => {
      if (won) {
        return myMove === Moves.Rock ? Moves.Scissors : myMove === Moves.Paper ? Moves.Rock : Moves.Paper;
      } else {
        // If the user lost, the opponent had a move that beats the playes move
        return myMove === Moves.Rock ? Moves.Paper : myMove === Moves.Paper ? Moves.Scissors : Moves.Rock;
      }
    };

    const isPlayer1User = address.address?.toLowerCase() === player1[0].toLowerCase();
    const opponentMove = calculateOpponentMove(playerMove!, isUserWinner);

    return (
      <div className="flex justify-center items-start">
        <div className="text-center shadow-2xl rounded-lg w-300 lg:w-1/2 text-black">
          <p className="text-2xl font-bold text-black mt-5">{isUserWinner ? "🎉 You Won! 🎉" : "😢 You Lost! 😢"}</p>
          <p className={`text-lg ${isUserWinner ? "text-green-500" : "text-red-500"}`}>
            {isUserWinner
              ? `Congrats! You won ${betAmount && formatEther(betAmount as bigint)} ETH`
              : `Better luck next time! The winner won ${betAmount && formatEther(betAmount as bigint)} ETH`}
          </p>
          <div className="flex justify-center items-center gap-8 mt-4">
            <div>
              <p className="font-medium text-gray-700">Your Move</p>
              <Image
                src={moveImages[playerMove!]}
                alt={Moves[playerMove!]}
                width={100}
                height={100}
                className="wiggle"
              />
              <p>{Moves[playerMove!]}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Opponents Move</p>
              <Image
                src={moveImages[opponentMove]}
                alt={Moves[opponentMove]}
                width={100}
                height={100}
                className="wiggle"
              />
              <p>{Moves[opponentMove]}</p>
            </div>
          </div>

          <button
            onClick={() => Router.push("/")}
            className="px-10 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-5"
          >
            Restart
          </button>
        </div>
      </div>
    );
  };
  useEffect(() => {
    const interval = setInterval(() => {
      betAmountQuery.refetch?.();
      player1Query.refetch?.();
      player2Query.refetch?.();
      GameQuery.refetch?.();
      ForfeitQuery.refetch?.();
      if (player1[2] != 0 && player2[2] != 0) winnerQuery.refetch?.();
      console.log("Refetching data...");
    }, 7000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  return (
    <div className="min-h-[98vh] p-6 space-y-6 max-w-4xl mx-auto bg-white">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Image src="/images/rps-logo.png" width={400} height={400} alt="Rock Paper Scissors" className="mx-auto" />
      </div>

      {/* Bet Amount */}
      {isBetLoading ? (
        <p>Loading bet amount...</p>
      ) : isBetError ? (
        <p>Error fetching bet amount: {betError.message}</p>
      ) : (
        <div className="text-center flex items-center bg-yellow-400 justify-center gap-2 border-2 border-yellow-400 rounded-lg p-1">
          <p className="text-xl font-bold inline-block text-center text-white-400 shadow-2xl">
            Prize Amount: {betAmount ? formatEther(betAmount as bigint)?.toString() : "0"} ETH
          </p>
          <Image
            src="/images/white-eth2.png" // Replace with the actual path to your Ethereum logo
            alt="Ethereum"
            width={30}
            height={30}
            className="wiggle"
          />
        </div>
      )}

      {/* Player Cards */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
        {/* Player 1 Card */}
        {isPlayer1Loading ? (
          <p>Loading Player 1...</p>
        ) : isPlayer1Error ? (
          <p>Error fetching Player 1: {player1Error.message}</p>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow-2xl space-y-4 w-300 lg:w-1/2">
            {/* Player 1 Header */}
            <div className="flex items-center space-x-4">
              <img src="/images/girl.webp" alt="Player 1" className="w-16 h-16 object-cover rounded-full" />
              <div className="flex items-center space-x-2">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Player 1:</h2>
                  <h3 className="text-lg font-bold text-gray-800">
                    {`${player1[0].slice(0, 6)}...${player1[0].slice(-8)}`}
                  </h3>
                </div>
                {address.address?.toLowerCase() === player1[0].toLowerCase() && (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <h3 className="text-lg font-bold text-green-500">You</h3>
                  </>
                )}
              </div>
            </div>

            {/* Player 1 Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg flex items-center justify-between">
                <span className="font-medium text-gray-600">Move Chosen</span>
                <input
                  type="checkbox"
                  readOnly
                  checked={player1[1] !== "0x0000000000000000000000000000000000000000000000000000000000000000"}
                />
              </div>
              <div className="p-4 border rounded-lg flex items-center justify-between">
                <span className="font-medium text-gray-600">Revealed</span>
                <input type="checkbox" readOnly checked={player1[2] !== 0} />
              </div>
            </div>
          </div>
        )}

        {/* Player 2 Card */}
        {isPlayer2Loading ? (
          <p>Loading Player 2...</p>
        ) : isPlayer2Error ? (
          <p>Error fetching Player 2: {player2Error.message}</p>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow-2xl space-y-4 w-300 lg:w-1/2">
            {/* Player 2 Header */}
            <div className="flex items-center space-x-4">
              <img src="/images/boy.webp" alt="Player 2" className="w-16 h-16 object-cover rounded-full" />
              <div className="flex items-center space-x-2">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Player 2:</h2>
                  <h3 className="text-lg font-bold text-gray-800">
                    {`${player2[0].slice(0, 6)}...${player2[0].slice(-8)}`}
                  </h3>
                </div>
                {address.address?.toLowerCase() === player2[0].toLowerCase() && (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <h3 className="text-lg font-bold text-green-500">You</h3>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg flex items-center justify-between">
                <span className="font-medium text-gray-600">Move Chosen</span>
                <input
                  type="checkbox"
                  readOnly
                  checked={player2[1] !== "0x0000000000000000000000000000000000000000000000000000000000000000"}
                />
              </div>
              <div className="p-4 border rounded-lg flex items-center justify-between">
                <span className="font-medium text-gray-600">Revealed</span>
                <input type="checkbox" readOnly checked={player2[2] !== 0} />
              </div>
            </div>
          </div>
        )}
      </div>

      {isStateLoading ? (
        <>State Loading...</>
      ) : isStateError ? (
        <>State Load Error</>
      ) : (
        <>
          {State == 0 && <CommitStage onCommit={commitMove} player1={player1} player2={player2} />}
          {State == 1 && (
            <RevealStage
              contractAddress={ContractAddress}
              move={move as Moves}
              secret={secret}
              surrender={surrender}
              player1={player1}
              player2={player2}
            />
          )}
          {State == 2 && renderWinnerInfo(move)}
        </>
      )}
    </div>
  );
}

export default Page;
