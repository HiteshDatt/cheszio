import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import { SocketProvider } from './contexts/SocketContext';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="app-content">
        <Router>
          <SocketProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/game/:roomId" element={<Game />} />
            </Routes>
          </SocketProvider>
        </Router>
      </div>
    </div>
  );
}

export default App;
