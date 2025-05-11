import { useEffect, useState, useRef } from 'react';
import { Chess } from 'chess.js';
import '../styles/ChessBoard.css';

const ChessBoard = ({
  position,
  onMove,
  playerColor,
  isPlayerTurn,
  gameOver
}) => {
  const [board, setBoard] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const chessRef = useRef(null);
  
  // Initialize chess board
  useEffect(() => {
    chessRef.current = new Chess(position);
    updateBoard();
  }, [position]);
  
  // Update the visual board based on current position
  const updateBoard = () => {
    if (!chessRef.current) return;
    
    const newBoard = [];
    const currentPosition = chessRef.current.board();
    
    // The issue is with how we're transposing the chess.js board to our visual board
    // In chess.js, board[0][0] is a8 (black's back rank, queen rook)
    // and board[7][7] is h1 (white's back rank, king rook)
    
    if (playerColor === 'white') {
      // For white player: simply render the board as-is
      // This puts white pieces (rows 6-7) at the bottom
      for (let row = 0; row < 8; row++) {
        const boardRow = [];
        for (let col = 0; col < 8; col++) {
          const piece = currentPosition[row][col];
          const square = {
            position: getSquareNotation(row, col),
            piece: piece ? `${piece.color}${piece.type}` : null,
            isLight: (row + col) % 2 === 0
          };
          boardRow.push(square);
        }
        newBoard.push(boardRow);
      }
    } else {
      // For black player: flip rows AND columns (rotate 180°)
      // This puts black pieces (rows 0-1) at the bottom
      // Note: we fill the newBoard from top to bottom as seen by the player
      for (let visualRow = 0; visualRow < 8; visualRow++) {
        const boardRow = [];
        for (let visualCol = 0; visualCol < 8; visualCol++) {
          // Convert visual position to chess.js board position
          const chessBoardRow = 7 - visualRow;
          const chessBoardCol = 7 - visualCol;
          
          const piece = currentPosition[chessBoardRow][chessBoardCol];
          const square = {
            position: getSquareNotation(chessBoardRow, chessBoardCol),
            piece: piece ? `${piece.color}${piece.type}` : null,
            isLight: (chessBoardRow + chessBoardCol) % 2 === 0
          };
          boardRow.push(square);
        }
        newBoard.push(boardRow);
      }
    }
    
    setBoard(newBoard);
  };
  
  // Convert row/col to chess notation (e.g. "e4")
  const getSquareNotation = (row, col) => {
    const files = 'abcdefgh';
    const ranks = '87654321';
    return files[col] + ranks[row];
  };
  
  // Handle square click
  const handleSquareClick = (position) => {
    if (gameOver || !isPlayerTurn) return;
    
    // If a piece is already selected
    if (selectedSquare) {
      // Try to make a move
      try {
        const move = chessRef.current.move({
          from: selectedSquare,
          to: position,
          promotion: 'q' // Always promote to queen for simplicity
        });
        
        if (move) {
          // Valid move made, notify parent component
          const fen = chessRef.current.fen();
          onMove(move, fen);
        }
      } catch (e) {
        // Invalid move, do nothing
      }
      
      // Clear selection regardless of move validity
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }
    
    // Otherwise check if the square contains a piece of the player's color
    const piece = chessRef.current.get(position);
    if (piece && piece.color === playerColor.charAt(0)) {
      setSelectedSquare(position);
      
      // Calculate valid moves
      const moves = chessRef.current.moves({
        square: position,
        verbose: true
      }).map(move => move.to);
      
      setValidMoves(moves);
    }
  };
  
  // Get class for a specific square based on state
  const getSquareClass = (square) => {
    let classes = ['square'];
    
    if (square.isLight) {
      classes.push('light-square');
    } else {
      classes.push('dark-square');
    }
    
    if (square.position === selectedSquare) {
      classes.push('selected');
    }
    
    if (validMoves.includes(square.position)) {
      classes.push('valid-move');
    }
    
    return classes.join(' ');
  };
  
  // Get the piece image path
  const getPieceImage = (piece) => {
    if (!piece) return null;
    
    // piece format is 'wp' for white pawn, 'bk' for black king, etc.
    const color = piece.charAt(0) === 'w' ? 'white' : 'black';
    let type;
    
    switch(piece.charAt(1)) {
      case 'p': type = 'pawn'; break;
      case 'n': type = 'knight'; break;
      case 'b': type = 'bishop'; break;
      case 'r': type = 'rook'; break;
      case 'q': type = 'queen'; break;
      case 'k': type = 'king'; break;
      default: return null;
    }
    
    return `/pieces/${color}_${type}.svg`;
  };
  
  return (
    <div className="chess-board">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((square) => (
            <div
              key={square.position}
              className={getSquareClass(square)}
              onClick={() => handleSquareClick(square.position)}
            >
              {square.piece && (
                <div className="piece" style={{ backgroundImage: `url(${getPieceImage(square.piece)})` }} />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ChessBoard; 