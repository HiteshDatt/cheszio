import { useState, useEffect } from 'react';
import '../styles/GameInfo.css';

const GameInfo = ({ 
  roomId, 
  playerColor, 
  players, 
  isPlayerTurn, 
  gameState,
  gameOver,
  waitingForOpponent
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
  
  return (
    <div className="game-info card">
      <div className="room-info">
        <h3>Room ID: {roomId}</h3>
        <button onClick={copyRoomId} className="copy-button">
          Copy
        </button>
        {clipboardMessage && (
          <div className="clipboard-message">{clipboardMessage}</div>
        )}
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
      
      <div className="status-message">
        {getStatusMessage()}
      </div>
    </div>
  );
};

export default GameInfo; 