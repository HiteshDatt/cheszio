import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

const Home = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gameMode, setGameMode] = useState('standard');

  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  // Handle create room
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameMode }),
      });

      const data = await response.json();
      
      if (data.roomId) {
        // Navigate to the game room
        navigate(`/game/${data.roomId}`, { 
          state: { playerName, isCreator: true, gameMode: data.gameMode }
        });
      } else {
        setError('Failed to create room');
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle join room form submit
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3001/api/check-room/${roomId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.exists && !data.full) {
        // Room exists and is not full, navigate to it
        navigate(`/game/${roomId}`, { 
          state: { playerName, isCreator: false, gameMode: data.gameMode }
        });
      } else if (data.full) {
        setError('This room is full');
      } else {
        setError('Room not found');
      }
    } catch (err) {
      console.error('Error checking room:', err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Chess Game</h1>
      
      <div className="card form-container">
        <div className="form-group">
          <label htmlFor="playerName">Your Name</label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            disabled={loading}
          />
        </div>

        {!showJoinForm && (
          <div className="form-group">
            <label>Game Mode</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="gameMode"
                  value="standard"
                  checked={gameMode === 'standard'}
                  onChange={() => setGameMode('standard')}
                  disabled={loading}
                />
                Standard Chess
              </label>
              <label>
                <input
                  type="radio"
                  name="gameMode"
                  value="dice-chess"
                  checked={gameMode === 'dice-chess'}
                  onChange={() => setGameMode('dice-chess')}
                  disabled={loading}
                />
                Dice Chess
              </label>
            </div>
          </div>
        )}

        {!connected && (
          <div className="error">
            Not connected to server. Please check your connection.
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {!showJoinForm ? (
          <>
            <div className="button-container center">
              <button 
                onClick={handleCreateRoom} 
                disabled={loading || !connected}
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
              <button 
                onClick={() => setShowJoinForm(true)}
                disabled={loading || !connected}
              >
                Join Room
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleJoinRoom}>
            <div className="form-group">
              <label htmlFor="roomId">Room ID</label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                disabled={loading}
              />
            </div>
            <div className="button-container center">
              <button 
                type="submit" 
                disabled={loading || !connected}
              >
                {loading ? 'Joining...' : 'Join'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowJoinForm(false)}
                disabled={loading}
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Home; 