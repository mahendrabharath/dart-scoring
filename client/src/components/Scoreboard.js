import React from 'react';
import './Scoreboard.css';

function Scoreboard({ players, currentPlayerId, gameState }) {
  return (
    <div className="scoreboard">
      {players.map((player, index) => {
        const isCurrentPlayer = player.id === currentPlayerId;
        const checkout = player.checkout;

        return (
          <div
            key={player.id}
            className={`player-card ${isCurrentPlayer ? 'active' : ''}`}
          >
            <div className="player-header">
              <h2>{player.name}</h2>
              {isCurrentPlayer && (
                <span className="turn-indicator">🎯 Your Turn</span>
              )}
            </div>

            <div className="score-display">
              <div className="score-value">{player.current_score}</div>
              <div className="legs-won">
                Legs: {player.legs_won}
              </div>
            </div>

            {isCurrentPlayer && gameState && (
              <div className="dart-info">
                <div className="darts-remaining">
                  Darts Remaining: <strong>{gameState.darts_remaining}</strong>
                </div>
                <div className="darts-thrown">
                  Darts Thrown: <strong>{3 - gameState.darts_remaining}</strong>
                </div>
              </div>
            )}

            {checkout && checkout.method && (
              <div className="checkout-suggestion">
                <div className="checkout-label">Checkout:</div>
                <div className="checkout-method">{checkout.method}</div>
                {checkout.darts && (
                  <div className="checkout-darts">
                    ({checkout.darts} dart{checkout.darts > 1 ? 's' : ''})
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Scoreboard;

