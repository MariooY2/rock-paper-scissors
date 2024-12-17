// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Game {
    enum Move { None, Rock, Paper, Scissors }
    enum GameState { WaitingForPlayers, WaitingForReveal, Completed }

    struct Player {
        address payable addr;
        bytes32 commitment;
        Move move;
    }

    Player[2] public players;
    uint256 public betAmount;
    uint256 public revealDeadline;
    GameState public gameState;
    address public surrender;
    modifier onlyPlayer() {
        require(msg.sender == players[0].addr || msg.sender == players[1].addr, "Not a player");
        _;
    }

    constructor(address payable _player1, address payable _player2, uint256 _betAmount) {
        players[0] = Player(_player1, bytes32(0), Move.None);
        players[1] = Player(_player2, bytes32(0), Move.None);
        betAmount = _betAmount;
        gameState = GameState.WaitingForPlayers;
    }

    function generateCommitment(Move move, string memory secret) external pure returns (bytes32) {
    return keccak256(abi.encodePacked(move, secret));
}

    function commitMove(bytes32 commitment) external payable onlyPlayer {
        require(gameState == GameState.WaitingForPlayers, "Not accepting commitments");
        require(msg.value == betAmount, "Incorrect bet amount");

        Player storage player = msg.sender == players[0].addr ? players[0] : players[1];
        require(player.commitment == bytes32(0), "Move already committed");

        player.commitment = commitment;

        // Check if both players have committed
        if (players[0].commitment != bytes32(0) && players[1].commitment != bytes32(0)) {
            gameState = GameState.WaitingForReveal;
            revealDeadline = block.timestamp + 1 days; // 1-day deadline for revealing moves
        }
    }

    function revealMove(Move move, string memory secret) external onlyPlayer {
        require(gameState == GameState.WaitingForReveal, "Not accepting reveals");
        Player storage player = msg.sender == players[0].addr ? players[0] : players[1];
        require(player.move == Move.None, "Move already revealed");
        require(keccak256(abi.encodePacked(move, secret)) == player.commitment, "Invalid move or secret");

        player.move = move;

        // Check if both players have revealed
        if (players[0].move != Move.None && players[1].move != Move.None) {
            determineWinner();
        }
    }

    function determineWinner() internal {
        Move move1 = players[0].move;
        Move move2 = players[1].move;

        // Logic to determine the winner
        if (move1 == move2) {
            // Draw
            players[0].addr.transfer(betAmount);
            players[1].addr.transfer(betAmount);
        } else if (
            (move1 == Move.Rock && move2 == Move.Scissors) ||
            (move1 == Move.Paper && move2 == Move.Rock) ||
            (move1 == Move.Scissors && move2 == Move.Paper)
        ) {
            // Player 1 wins
            players[0].addr.transfer(address(this).balance);
        } else {
            // Player 2 wins
            players[1].addr.transfer(address(this).balance);
        }

        gameState = GameState.Completed;
    }

    function forfeit() external onlyPlayer {
        require(gameState == GameState.WaitingForReveal, "Cannot forfeit now");
        Player storage forfeiter = msg.sender == players[0].addr ? players[0] : players[1];
        Player storage opponent = msg.sender == players[0].addr ? players[1] : players[0];

        require(forfeiter.move == Move.None, "You already revealed");
        opponent.addr.transfer(address(this).balance);
        gameState = GameState.Completed;
        surrender=msg.sender;
    }

    function viewWinner() external view returns (address) {
    require(gameState == GameState.Completed, "Game is not yet completed");
    require(players[0].move != Move.None && players[1].move != Move.None, "Not all players revealed their moves");

    Move move1 = players[0].move;
    Move move2 = players[1].move;

    if (move1 == move2) {
        return address(0); // Draw: return address(0) to indicate no winner
    } else if (
        (move1 == Move.Rock && move2 == Move.Scissors) ||
        (move1 == Move.Paper && move2 == Move.Rock) ||
        (move1 == Move.Scissors && move2 == Move.Paper)
    ) {
        return players[0].addr; // Player 1 wins
    } else {
        return players[1].addr; // Player 2 wins
    }
}
}
