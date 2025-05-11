# Chess Game Server

This is the backend server for a real-time chess game application. It handles room creation, player connections, and game state synchronization using WebSockets.

## Features

- Room creation and management
- Real-time communication between players using Socket.IO
- Game state tracking with FEN notation
- Player assignment (white/black)
- Handle disconnections and game lifecycle events

## Technologies

- Node.js
- Express
- Socket.IO
- UUID for room ID generation

## Installation

```bash
npm install
```

## Running the Server

For development (with auto-reload):

```bash
npm run dev
```

For production:

```bash
npm start
```

The server runs on port 3001 by default, but you can change it by setting the PORT environment variable.

## API Endpoints

- **POST /api/create-room**: Creates a new game room and returns a unique room ID
- **GET /api/check-room/:roomId**: Checks if a room exists and has space for a player

## WebSocket Events

### Client to Server

- **join-room**: Join a specific room with player name
- **move**: Send a chess move to the opponent
- **game-over**: Notify about game end

### Server to Client

- **room-joined**: Confirmation that player joined a room
- **room-error**: Error when joining a room
- **game-start**: Game initialization with starting position
- **opponent-move**: Receive opponent's move
- **player-joined**: Notification when another player joins
- **player-left**: Notification when a player disconnects
- **game-ended**: Game end notification with result 