import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { Chess } from 'chess.js';
import ChessBoard from '../components/ChessBoard';
import GameInfo from '../components/GameInfo';
import DiceDisplay from '../components/DiceDisplay';

const Game = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  // Get player name from location state
  const playerName = location.state?.playerName || 'Guest';
  const isCreator = location.state?.isCreator || false;
  const gameMode = location.state?.gameMode || 'standard';

  // Game state
  const [players, setPlayers] = useState([]);
  const [playerColor, setPlayerColor] = useState(null);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [position, setPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');
  
  // Dice chess state
  const [diceResults, setDiceResults] = useState([]);
  const [opponentDiceResults, setOpponentDiceResults] = useState(null);
  const [opponentRolled, setOpponentRolled] = useState(false);
  
  // Re-roll request state
  const [rerollRequestSent, setRerollRequestSent] = useState(false);
  const [incomingRerollRequest, setIncomingRerollRequest] = useState(null);
  const [rerollResponseReceived, setRerollResponseReceived] = useState(null);

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
    
    // Dice chess events
    socket.on('dice-result', handleDiceResult);
    socket.on('opponent-rolled-dice', handleOpponentRolledDice);
    socket.on('dice-error', handleDiceError);
    
    // Re-roll request events
    socket.on('reroll-requested', handleRerollRequested);
    socket.on('reroll-request-sent', handleRerollRequestSent);
    socket.on('reroll-response', handleRerollResponse);

    // Clean up event listeners on unmount
    return () => {
      socket.off('room-joined');
      socket.off('player-joined');
      socket.off('game-start');
      socket.off('opponent-move');
      socket.off('player-left');
      socket.off('game-ended');
      socket.off('room-error');
      socket.off('dice-result');
      socket.off('opponent-rolled-dice');
      socket.off('dice-error');
      socket.off('reroll-requested');
      socket.off('reroll-request-sent');
      socket.off('reroll-response');
    };
  }, [socket, connected, roomId, playerName]);

  // Handle successful room join
  const handleRoomJoined = (data) => {
    setPlayerColor(data.color);
    setPlayers(data.players);
    // Store game mode received from server
    // data.gameMode may be undefined if this is an existing room,
    // so fallback to the gameMode from location state
    if (data.gameMode) {
      // This is just for consistency, as we're already using location.state.gameMode
    }
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
    // Reset dice state
    setDiceResults([]);
    setOpponentDiceResults(null);
    setOpponentRolled(false);
    // Reset re-roll state
    setRerollRequestSent(false);
    setIncomingRerollRequest(null);
    setRerollResponseReceived(null);
  };

  // Handle dice roll result
  const handleDiceResult = ({ diceResults }) => {
    setDiceResults(diceResults);
    // Also make these results available to the opponent
    socket.emit('opponent-dice-results', { roomId, diceResults });
    // Clear re-roll request state when new dice are rolled
    setRerollRequestSent(false);
    setRerollResponseReceived(null);
  };

  // Handle opponent rolling dice
  const handleOpponentRolledDice = ({ color, diceResults }) => {
    setOpponentRolled(true);
    // Store opponent's dice results if provided
    if (diceResults) {
      setOpponentDiceResults(diceResults);
    }
  };

  // Handle dice error
  const handleDiceError = ({ message }) => {
    setError(message);
    // Clear error after 3 seconds
    setTimeout(() => setError(''), 3000);
  };
  
  // Handle incoming re-roll request
  const handleRerollRequested = (data) => {
    setIncomingRerollRequest(data);
  };
  
  // Handle confirmation that re-roll request was sent
  const handleRerollRequestSent = () => {
    setRerollRequestSent(true);
  };
  
  // Handle response to re-roll request
  const handleRerollResponse = (data) => {
    setRerollResponseReceived(data);
    setRerollRequestSent(false);
    
    // If approved, dice will be cleared on the server and we'll need to re-roll
    if (data.approved) {
      setDiceResults([]);
    }
    
    // Clear the response after 5 seconds if it was denied
    if (!data.approved) {
      setTimeout(() => {
        setRerollResponseReceived(null);
      }, 5000);
    }
  };

  // Handle opponent moves
  const handleOpponentMove = ({ move, newFen }) => {
    setPosition(newFen);
    
    // Update turn
    const chess = new Chess(newFen);
    setCurrentTurn(chess.turn() === 'w' ? 'white' : 'black');
    
    // Reset dice-related state for the next turn
    setDiceResults([]);
    setOpponentDiceResults(null);
    setOpponentRolled(false);
    
    // Reset re-roll state
    setRerollRequestSent(false);
    setIncomingRerollRequest(null);
    setRerollResponseReceived(null);
    
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

  // Handle dice roll
  const handleRollDice = () => {
    if (!socket || !gameStarted || gameOver || !isPlayerTurn) return;
    
    socket.emit('roll-dice', { roomId });
  };
  
  // Handle re-roll request
  const handleRequestReroll = (reason) => {
    if (!socket || !gameStarted || gameOver || !isPlayerTurn || diceResults.length === 0) return;
    
    socket.emit('request-reroll', { roomId, reason });
  };
  
  // Handle response to re-roll request
  const handleRespondToReroll = (approved) => {
    if (!socket || !gameStarted || gameOver || !incomingRerollRequest) return;
    
    socket.emit('respond-to-reroll', { roomId, approved });
    setIncomingRerollRequest(null);
  };

  // Handle the player making a move
  const handleMove = (move, newFen) => {
    if (!socket || !gameStarted || gameOver) return;
    
    // In dice chess mode, validate move against dice results
    if (gameMode === 'dice-chess' && diceResults.length > 0) {
      // Move validation will be done on the server
    }
    
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
    
    // Reset dice state
    setDiceResults([]);
    setOpponentDiceResults(null);
    
    // Reset re-roll state
    setRerollRequestSent(false);
    setIncomingRerollRequest(null);
    setRerollResponseReceived(null);
    
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

  // Determine if player can roll dice
  const canRollDice = gameMode === 'dice-chess' && 
                      isPlayerTurn && 
                      !gameOver && 
                      gameStarted && 
                      diceResults.length === 0 && 
                      !rerollRequestSent && 
                      !(rerollResponseReceived && !rerollResponseReceived.approved);

  // Add socket event handlers for opponent dice results
  useEffect(() => {
    if (!socket) return;
    
    // Listen for opponent dice results
    socket.on('opponent-dice-results', ({ diceResults }) => {
      setOpponentDiceResults(diceResults);
    });
    
    return () => {
      socket.off('opponent-dice-results');
    };
  }, [socket]);

  return (
    <div className="page-container">
      {error && <div className="error">{error}</div>}
      
      <div className="game-info-container">
        <GameInfo
          roomId={roomId}
          playerColor={playerColor}
          players={players}
          isPlayerTurn={isPlayerTurn}
          gameState={gameState}
          gameOver={gameOver}
          waitingForOpponent={waitingForOpponent}
          gameMode={gameMode}
        />
        
        {gameMode === 'dice-chess' && (
          <DiceDisplay
            diceResults={diceResults}
            canRollDice={canRollDice}
            onRollDice={handleRollDice}
            playerColor={playerColor}
            opponentRolled={opponentRolled}
            gameMode={gameMode}
            onRequestReroll={handleRequestReroll}
            rerollRequestSent={rerollRequestSent}
            rerollResponseReceived={rerollResponseReceived}
            incomingRerollRequest={incomingRerollRequest}
            onRespondToReroll={handleRespondToReroll}
            opponentDiceResults={opponentDiceResults}
          />
        )}
      </div>
      
      <div className="chess-game-container">
        {playerColor && (
          <ChessBoard
            position={position}
            onMove={handleMove}
            playerColor={playerColor}
            isPlayerTurn={isPlayerTurn && (gameMode !== 'dice-chess' || diceResults.length > 0)}
            gameOver={gameOver}
            diceResults={diceResults}
            gameMode={gameMode}
          />
        )}
      </div>
    </div>
  );
};

export default Game; 