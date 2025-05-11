import { useState, useEffect } from 'react';
import '../styles/GameInfo.css';

const GameInfo = ({ 
  roomId, 
  playerColor, 
  players, 
  isPlayerTurn, 
  gameState,
  gameOver,
  waitingForOpponent,
  gameMode = 'standard'
}) => {
  const [clipboardMessage, setClipboardMessage] = useState('');
  const [timer, setTimer] = useState(null);

  // Clear clipboard message after a time period
  useEffect(() => {
    if (clipboardMessage) {
      const timeout = setTimeout(() => {
        setClipboardMessage('');
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [clipboardMessage]);
  
  // Copy room ID to clipboard
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
      .then(() => {
        setClipboardMessage('Room ID copied to clipboard!');
      })
      .catch(() => {
        setClipboardMessage('Failed to copy room ID');
      });
  };
  
  // Get player names
  const getPlayerName = (color) => {
    if (!players || players.length === 0) return 'Unknown';
    
    const player = players.find(p => p.color === color);
    return player ? player.name : 'Unknown';
  };
  
  // Get game status message
  const getStatusMessage = () => {
    if (waitingForOpponent) {
      return 'Waiting for opponent to join...';
    }
    
    if (gameOver) {
      if (gameState === 'checkmate') {
        const winner = isPlayerTurn ? 'Opponent' : 'You';
        return `Checkmate! ${winner} won the game.`;
      } else if (gameState === 'draw') {
        return 'Game ended in a draw.';
      } else if (gameState === 'stalemate') {
        return 'Game ended in stalemate.';
      } else {
        return 'Game over.';
      }
    }
    
    return isPlayerTurn ? 'Your turn' : "Opponent's turn";
  };
  
  // Get formatted game mode
  const getGameModeDisplay = () => {
    if (gameMode === 'standard') {
      return 'Standard Chess';
    } else if (gameMode === 'dice-chess') {
      return 'Dice Chess';
    }
    return gameMode;
  };
  
  // Get status class based on game state
  const getStatusClass = () => {
    if (waitingForOpponent) {
      return 'status-waiting';
    }
    
    if (gameOver) {
      return 'status-game-over';
    }
    
    return isPlayerTurn ? 'status-your-turn' : 'status-opponent-turn';
  };
  
  return (
    <div className="game-info card">
      <div className="game-info-header">
        <h3>Chess Game</h3>
      </div>
      
      <div className="room-info">
        <h3>Room Code</h3>
        <div className="room-id">{roomId}</div>
        <button onClick={copyRoomId} className="copy-button">
          Copy
        </button>
        {clipboardMessage && (
          <div className="clipboard-message">{clipboardMessage}</div>
        )}
      </div>
      
      <div className="game-mode-info">
        <span>Mode:</span>
        <span className="game-mode-badge">{getGameModeDisplay()}</span>
      </div>
      
      <div className="players-info">
        <div className={`player ${playerColor === 'white' ? 'current-player' : ''}`}>
          <div className="player-color white"></div>
          <span>{getPlayerName('white')}</span>
        </div>
        <div className={`player ${playerColor === 'black' ? 'current-player' : ''}`}>
          <div className="player-color black"></div>
          <span>{getPlayerName('black')}</span>
        </div>
      </div>
      
      <div className={`status-message ${getStatusClass()}`}>
        {getStatusMessage()}
      </div>
    </div>
  );
};

export default GameInfo; 