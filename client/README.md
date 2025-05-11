# Chess Game Client

This is the frontend application for a real-time chess game. It allows players to create and join rooms to play chess with others in real-time.

## Features

- Create and join game rooms
- Real-time gameplay using WebSockets (Socket.IO)
- Beautiful chess board with move validation
- Game state management
- Visual indicators for valid moves, turn status, etc.
- Responsive design

## Technologies

- React
- React Router DOM for navigation
- Socket.IO Client for real-time communication
- chess.js for chess logic and validation

## Installation

```bash
npm install
```

## Running the Client

For development:

```bash
npm run dev
```

The client runs on port 5173 by default when using Vite.

## Building for Production

```bash
npm run build
```

This will create optimized production files in the `dist` directory.

## How to Play

1. Enter your name on the landing page
2. Choose to create a new room or join an existing one with a room ID
3. If creating a room, share the generated room ID with your opponent
4. Wait for your opponent to join or join an existing room
5. Play chess with your opponent in real-time

## Note

Make sure the server is running before starting the client, as the client depends on the server for room creation and WebSocket communication.
