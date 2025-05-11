# Real-time Chess Game

A full-stack web application that allows users to play chess in real-time with others. This project features a React frontend and Node.js/Express backend with Socket.IO for real-time communication.

## Project Structure

The project is divided into two main parts:

- **Server**: Backend with Node.js, Express, and Socket.IO
- **Client**: Frontend with React, React Router, and Socket.IO Client

## Features

- Create and join game rooms via unique room IDs
- Real-time gameplay with instant move updates
- Chess move validation and game state tracking
- Visual indication of valid moves and current turn
- Support for all standard chess rules (using chess.js)
- Simple, responsive UI

## Tech Stack

### Backend
- Node.js with Express
- Socket.IO for real-time communication
- UUID for generating unique room IDs

### Frontend
- React (with Vite)
- React Router for navigation
- Socket.IO Client for WebSocket connections
- chess.js for game logic

## Getting Started

### Prerequisites

- Node.js (v14 or later recommended)
- npm (v7 or later recommended)

### Installation and Setup

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd chess-app
   ```

2. Install server dependencies
   ```bash
   cd server
   npm install
   ```

3. Install client dependencies
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. Start the server
   ```bash
   cd server
   npm run dev
   ```

2. In a new terminal, start the client
   ```bash
   cd client
   npm run dev
   ```

3. Access the application at `http://localhost:5173`

## How to Play

1. Enter your name on the landing page
2. Create a new room or join an existing one using a room ID
3. Share the room ID with your opponent if you created a room
4. Play chess in real-time once both players have joined

## Future Enhancements

- User authentication
- Game history and replay functionality
- Chat feature during gameplay
- Matchmaking for random opponents
- Timed matches
- ELO rating system 