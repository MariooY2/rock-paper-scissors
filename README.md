# Rock Paper Scissors Game 🎮

![Logo](packages/nextjs/public/images/logo-rps.png)

## Description
This is the final project for the Encode Club EVM certification. Players commit their moves on the blockchain using the commit-reveal pattern, ensuring fairness and transparency.

## Setup Instructions

### Prerequisites
- Node.js
- yarn
- Metamask

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/EncodeClub-EVMBootcamp-G7/Final-Project.git
    cd Final-Project
    ```

2. Install dependencies:
    ```sh
    yarn install
    ```

3. Start the frontend:
    ```sh
    yarn start
    ```

4. Open your browser and navigate to `http://localhost:3000` to play the game.

## Game Preview
<img src="packages/nextjs/public/screenshots/1.png" alt="Game Screenshot" width="600" />

## How it Works
Players first commit their moves (rock, paper, or scissors) on the blockchain by hashing their move with a secret. Once both players have committed, they reveal their moves. The game logic then determines the winner based on the revealed moves.

![Workflow](packages/nextjs/public/screenshots/4.png)
![Workflow](packages/nextjs/public/screenshots/5.png)
![Workflow](packages/nextjs/public/screenshots/2.png)
![Workflow](packages/nextjs/public/screenshots/3.png)


## License
This project is licensed under the MIT License.



