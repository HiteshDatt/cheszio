import React, { useState } from 'react';
import '../styles/DiceDisplay.css';

const DiceDisplay = ({ 
  diceResults, 
  canRollDice, 
  onRollDice, 
  playerColor,
  opponentRolled,
  gameMode,
  onRequestReroll,
  pendingRerollRequest,
  rerollRequestSent,
  rerollResponseReceived,
  incomingRerollRequest,
  onRespondToReroll,
  opponentDiceResults
}) => {
  const [rerollReason, setRerollReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  
  // Only show for dice-chess mode
  if (gameMode !== 'dice-chess') {
    return null;
  }

  // Function to convert piece type to proper display name
  const getPieceDisplayName = (pieceType) => {
    return pieceType.charAt(0).toUpperCase() + pieceType.slice(1);
  };

  // Get image path for each piece type
  const getPieceImage = (pieceType, color = playerColor) => {
    return `/pieces/${color}_${pieceType}.svg`;
  };
  
  // Handle re-roll request submission
  const handleRerollRequest = () => {
    // Use a default message if no reason is provided
    const reason = rerollReason.trim() || "No legal moves available";
    onRequestReroll(reason);
    setShowReasonInput(false);
    setRerollReason("");
  };
  
  // Toggle reason input visibility
  const toggleReasonInput = () => {
    setShowReasonInput(!showReasonInput);
    if (!showReasonInput) {
      setRerollReason("");
    }
  };

  // Direct reroll request without reason
  const handleDirectRerollRequest = () => {
    onRequestReroll("No legal moves available");
  };
  
  // Handle response to incoming re-roll request
  const handleRerollResponse = (approved) => {
    onRespondToReroll(approved);
  };

  return (
    <div className="dice-display">
      <h3>Dice Chess</h3>
      
      {/* Incoming re-roll request */}
      {incomingRerollRequest && (
        <div className="reroll-request incoming-request">
          <p><strong>{incomingRerollRequest.playerName}</strong> is requesting to re-roll their dice.</p>
          <p>Reason: "{incomingRerollRequest.reason}"</p>
          <div className="request-actions">
            <button className="approve-button" onClick={() => handleRerollResponse(true)}>
              Allow Re-roll
            </button>
            <button className="deny-button" onClick={() => handleRerollResponse(false)}>
              Deny
            </button>
          </div>
        </div>
      )}
      
      {/* Re-roll request response received */}
      {rerollResponseReceived && (
        <div className={`reroll-response ${rerollResponseReceived.approved ? 'approved' : 'denied'}`}>
          <p>
            {rerollResponseReceived.approved 
              ? `${rerollResponseReceived.responderName} approved your re-roll request.` 
              : `${rerollResponseReceived.responderName} denied your re-roll request.`}
          </p>
          {rerollResponseReceived.approved && (
            <button className="roll-button" onClick={onRollDice}>
              Roll Again
            </button>
          )}
        </div>
      )}
      
      {/* Pending re-roll request */}
      {rerollRequestSent && (
        <div className="reroll-request-sent">
          <p>Re-roll request sent. Waiting for opponent's response...</p>
        </div>
      )}
      
      {/* Opponent's dice results */}
      {opponentDiceResults && opponentDiceResults.length > 0 && (
        <div className="opponent-dice-results">
          <p>Opponent can move one of these pieces:</p>
          <div className="dice-pieces">
            {opponentDiceResults.map((piece, index) => (
              <div key={index} className="dice-piece opponent-piece">
                <div 
                  className="piece-image opponent-piece-image"
                  style={{ backgroundImage: `url(${getPieceImage(piece, playerColor === 'white' ? 'black' : 'white')})` }}
                ></div>
                <div className="piece-name">{getPieceDisplayName(piece)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {opponentRolled && !diceResults.length && !opponentDiceResults && (
        <div className="opponent-rolled">
          Opponent rolled their dice!
        </div>
      )}
      
      {diceResults && diceResults.length > 0 ? (
        <div className="dice-results">
          <p>You can move one of these pieces:</p>
          <div className="dice-pieces">
            {diceResults.map((piece, index) => (
              <div key={index} className="dice-piece">
                <div 
                  className="piece-image" 
                  style={{ backgroundImage: `url(${getPieceImage(piece)})` }}
                ></div>
                <div className="piece-name">{getPieceDisplayName(piece)}</div>
              </div>
            ))}
          </div>
          
          {/* Re-roll request options */}
          {!rerollRequestSent && !rerollResponseReceived && (
            <div className="reroll-options">
              <button 
                className="request-reroll-button"
                onClick={handleDirectRerollRequest}
              >
                Request Re-roll
              </button>
              <button 
                className="request-reroll-with-reason-button"
                onClick={toggleReasonInput}
              >
                Add Reason
              </button>
            </div>
          )}
          
          {/* Re-roll reason input */}
          {showReasonInput && (
            <div className="reroll-reason-container">
              <p>Why do you need to re-roll? (Optional)</p>
              <textarea
                value={rerollReason}
                onChange={(e) => setRerollReason(e.target.value)}
                placeholder="Explain why you need a re-roll (e.g., no legal moves available)"
                className="reroll-reason-input"
              />
              <div className="reason-actions">
                <button 
                  className="submit-reason-button"
                  onClick={handleRerollRequest}
                >
                  Submit Request
                </button>
                <button 
                  className="cancel-reason-button"
                  onClick={toggleReasonInput}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="dice-instructions">
          {canRollDice ? (
            <p>Roll the dice to determine which pieces you can move</p>
          ) : (
            <p>Wait for your turn to roll the dice</p>
          )}
        </div>
      )}
      
      {canRollDice && !rerollRequestSent && !rerollResponseReceived && (
        <button 
          className="roll-button"
          onClick={onRollDice}
        >
          Roll Dice
        </button>
      )}
    </div>
  );
};

export default DiceDisplay; 