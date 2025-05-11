import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { Chess } from 'chess.js';
import ChessBoard from '../components/ChessBoard';
import GameInfo from '../components/GameInfo';

const Game = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  // Get player name from location state
  const playerName = location.state?.playerName || 'Guest';
  const isCreator = location.state?.isCreator || false;

  // Game state
  const [players, setPlayers] = useState([]);
  const [playerColor, setPlayerColor] = useState(null);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [position, setPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');

  // Connect to the room when the component mounts
  useEffect(() => {
    if (!socket || !connected) return;

    // Join the room
    socket.emit('join-room', { roomId, playerName });

    // Set up event listeners
    socket.on('room-joined', handleRoomJoined);
    socket.on('player-joined', handlePlayerJoined);
    socket.on('game-start', handleGameStart);
    socket.on('opponent-move', handleOpponentMove);
    socket.on('player-left', handlePlayerLeft);
    socket.on('game-ended', handleGameEnded);
    socket.on('room-error', handleRoomError);

    // Clean up event listeners on unmount
    return () => {
      socket.off('room-joined');
      socket.off('player-joined');
      socket.off('game-start');
      socket.off('opponent-move');
      socket.off('player-left');
      socket.off('game-ended');
      socket.off('room-error');
    };
  }, [socket, connected, roomId, playerName]);

  // Handle successful room join
  const handleRoomJoined = (data) => {
    setPlayerColor(data.color);
    setPlayers(data.players);
  };

  // Handle another player joining
  const handlePlayerJoined = ({ player }) => {
    setPlayers(prev => [...prev, player]);
  };

  // Handle game start
  const handleGameStart = (data) => {
    setPosition(data.fen);
    setPlayers(data.players);
    setGameStarted(true);
    setGameOver(false);
    setGameState(null);
    setCurrentTurn('white');
  };

  // Handle opponent moves
  const handleOpponentMove = ({ move, newFen }) => {
    setPosition(newFen);
    
    // Update turn
    const chess = new Chess(newFen);
    setCurrentTurn(chess.turn() === 'w' ? 'white' : 'black');
    
    // Check if the game is over
    checkGameStatus(chess);
  };

  // Handle player leaving
  const handlePlayerLeft = ({ playerId, remaining }) => {
    setPlayers(remaining);
    
    if (gameStarted && remaining.length < 2) {
      setGameOver(true);
      setGameState('opponent_left');
      setError('Your opponent has left the game.');
    }
  };

  // Handle game ended event
  const handleGameEnded = ({ result }) => {
    setGameOver(true);
    setGameState(result);
  };

  // Handle room errors
  const handleRoomError = ({ message }) => {
    setError(message);
    // Redirect to home after error
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  // Handle the player making a move
  const handleMove = (move, newFen) => {
    if (!socket || !gameStarted || gameOver) return;
    
    // Send the move to the server
    socket.emit('move', {
      roomId,
      move,
      newFen
    });
    
    // Update local state
    setPosition(newFen);
    
    // Update turn
    const chess = new Chess(newFen);
    setCurrentTurn(chess.turn() === 'w' ? 'white' : 'black');
    
    // Check if the game is over
    checkGameStatus(chess);
  };

  // Check if the game is over after a move
  const checkGameStatus = (chess) => {
    if (chess.isCheckmate()) {
      setGameOver(true);
      setGameState('checkmate');
      socket.emit('game-over', { roomId, result: 'checkmate' });
    } else if (chess.isDraw()) {
      setGameOver(true);
      setGameState('draw');
      socket.emit('game-over', { roomId, result: 'draw' });
    } else if (chess.isStalemate()) {
      setGameOver(true);
      setGameState('stalemate');
      socket.emit('game-over', { roomId, result: 'stalemate' });
    }
  };

  // Check if it's the player's turn
  const isPlayerTurn = playerColor === currentTurn;

  // Wait for opponent
  const waitingForOpponent = players.length < 2;

  return (
    <div className="page-container">
      {error && <div className="error">{error}</div>}
      
      <GameInfo
        roomId={roomId}
        playerColor={playerColor}
        players={players}
        isPlayerTurn={isPlayerTurn}
        gameState={gameState}
        gameOver={gameOver}
        waitingForOpponent={waitingForOpponent}
      />
      
      <div className="chess-game-container">
        {playerColor && (
          <ChessBoard
            position={position}
            onMove={handleMove}
            playerColor={playerColor}
            isPlayerTurn={isPlayerTurn}
            gameOver={gameOver}
          />
        )}
      </div>
    </div>
  );
};

export default Game; 