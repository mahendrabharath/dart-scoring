import { calculateCheckout } from "../lib/checkout";

const formatDarts = (darts) => {
  if (!darts || darts.length === 0) return "—";
  return darts.map((dart) => dart.label).join(" · ");
};

export default function Scoreboard({ players, currentPlayerId, dartsRemaining, mode, turns }) {
  const latestByPlayer = new Map();
  turns.forEach((turn) => {
    if (!latestByPlayer.has(turn.playerId)) {
      latestByPlayer.set(turn.playerId, turn);
    }
  });

  return (
    <div className="scoreboard">
      {players.map((player) => {
        const isCurrentPlayer = player.id === currentPlayerId;
        const checkout = mode === "free" ? null : calculateCheckout(player.currentScore);
        const latestTurn = latestByPlayer.get(player.id);

        return (
          <div
            key={player.id}
            className={`player-card modern ${isCurrentPlayer ? "active" : ""}`}
          >
            <div className="player-header">
              <h2>{player.name}</h2>
              {isCurrentPlayer && (
                <span className="turn-indicator">
                  <span className="turn-dot" />
                  Your Turn
                </span>
              )}
            </div>

            <div className="score-row">
              <div className="score-pill">
                <div className="score-label">
                  <span className="label-icon">🏆</span>
                  Score
                </div>
                <div className="score-value">{player.currentScore}</div>
              </div>
              {mode !== "free" && (
                <div className="score-pill secondary">
                  <div className="score-label">
                    <span className="label-icon">🏁</span>
                    Legs
                  </div>
                  <div className="score-value small">{player.legsWon}</div>
                </div>
              )}
            </div>

            <div className="last-turn">
              <div className="last-turn-label">
                <span className="label-icon">🧾</span>
                Last turn
              </div>
              <div className="last-turn-value">
                {latestTurn ? formatDarts(latestTurn.darts) : "—"}
              </div>
              <div className={`last-turn-total ${latestTurn?.isBust ? "bust" : ""}`}>
                {latestTurn
                  ? latestTurn.isBust
                    ? "Bust"
                    : latestTurn.mode === "free"
                      ? `+${latestTurn.total}`
                      : `-${latestTurn.total}`
                  : ""}
              </div>
            </div>

            <div className={`dart-info ${isCurrentPlayer ? "" : "dart-info-hidden"}`}>
              <div className="darts-remaining">
                Darts Remaining: <strong>{dartsRemaining}</strong>
              </div>
              <div className="darts-thrown">
                Darts Thrown: <strong>{3 - dartsRemaining}</strong>
              </div>
            </div>

            {checkout && player.currentScore <= 170 && (
              <div className="checkout-suggestion">
                <div className="checkout-label">Checkout:</div>
                <div className="checkout-method">{checkout.method}</div>
                {checkout.darts && (
                  <div className="checkout-darts">
                    ({checkout.darts} dart{checkout.darts > 1 ? "s" : ""})
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
