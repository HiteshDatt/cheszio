const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store active games and rooms
const rooms = {};
const games = {};

// API endpoint to create a new room
app.post('/api/create-room', (req, res) => {
  const roomId = uuidv4().substring(0, 8); // Generate shorter room ID for ease of use
  rooms[roomId] = { players: [], gameState: null };
  
  res.json({ roomId });
});

// API endpoint to check if a room exists
app.get('/api/check-room/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  if (!rooms[roomId]) {
    return res.status(404).json({ exists: false, message: 'Room not found' });
  }
  
  if (rooms[roomId].players.length >= 2) {
    return res.status(400).json({ exists: true, full: true, message: 'Room is full' });
  }
  
  res.json({ exists: true, full: false });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room event
  socket.on('join-room', ({ roomId, playerName }) => {
    console.log(`Player ${playerName} joining room ${roomId}`);

    // Check if player is already in the room
    const existingPlayerIndex = rooms[roomId].players.findIndex(player => player.id === socket.id);

    const isAnExistingPlayer = existingPlayerIndex !== -1;
    
    // Check if the room exists
    if (!rooms[roomId] && !isAnExistingPlayer) {
      socket.emit('room-error', { message: 'Room does not exist' });
      return;
    }
    
    // Check if room is full
    if (rooms[roomId].players.length >= 2 && !isAnExistingPlayer) {
      socket.emit('room-error', { message: 'Room is full' });
      return;
    }
    
    
    if (isAnExistingPlayer) {
      console.log(`Player ${playerName} (${socket.id}) already in room ${roomId}`);
      // Player already in room, update their info if needed (e.g. name)
      rooms[roomId].players[existingPlayerIndex].name = playerName;
      
      // Re-emit the room-joined event with current data
      socket.emit('room-joined', { 
        roomId, 
        color: rooms[roomId].players[existingPlayerIndex].color, 
        players: rooms[roomId].players
      });
      return;
    }
    
    // Assign player color (white for first player, black for second)
    const playerColor = rooms[roomId].players.length === 0 ? 'white' : 'black';
    
    // Add player to the room
    const player = {
      id: socket.id,
      name: playerName,
      color: playerColor
    };
    
    rooms[roomId].players.push(player);
    
    // Join the socket room
    socket.join(roomId);
    
    // Notify the player they joined successfully
    socket.emit('room-joined', { 
      roomId, 
      color: playerColor, 
      players: rooms[roomId].players
    });
    
    // If this is the second player, initialize the game
    if (rooms[roomId].players.length === 2) {
      // Initialize the game with starting position in FEN notation
      const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      rooms[roomId].gameState = initialFen;
      
      // Notify all players in the room that the game is starting
      io.to(roomId).emit('game-start', {
        fen: initialFen,
        players: rooms[roomId].players
      });
    } else {
      // Notify the room that a player is waiting
      socket.to(roomId).emit('player-joined', { player });
    }
  });

  // Handle chess moves
  socket.on('move', ({ roomId, move, newFen }) => {
    console.log(`Move in room ${roomId}:`, move);
    
    if (!rooms[roomId]) {
      socket.emit('move-error', { message: 'Room does not exist' });
      return;
    }
    
    // Update game state
    rooms[roomId].gameState = newFen;
    
    // Broadcast the move to the other player
    socket.to(roomId).emit('opponent-move', { move, newFen });
  });

  // Handle game end events
  socket.on('game-over', ({ roomId, result }) => {
    if (rooms[roomId]) {
      io.to(roomId).emit('game-ended', { result });
    }
  });

  // Handle player disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find all rooms the player was in
    for (const roomId in rooms) {
      const playerIndex = rooms[roomId].players.findIndex(player => player.id === socket.id);
      
      if (playerIndex !== -1) {
        // Remove the player
        rooms[roomId].players.splice(playerIndex, 1);
        
        // Notify others in the room
        io.to(roomId).emit('player-left', { 
          playerId: socket.id,
          remaining: rooms[roomId].players
        });
        
        // If room is empty, clean it up
        if (rooms[roomId].players.length === 0) {
          delete rooms[roomId];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 