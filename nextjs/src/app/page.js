"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GameSetup from "../components/GameSetup";
import Scoreboard from "../components/Scoreboard";
import ScoreInput from "../components/ScoreInput";

const STORAGE_KEY = "dartScoreboardState";

const createInitialGame = ({ mode, startingScore, legs, playerNames, inputMode, mascotEnabled }) => ({
  id: `game-${Date.now()}`,
  mode,
  inputMode,
  mascotEnabled,
  startingScore,
  legs,
  currentLeg: 1,
  status: "active",
  winner: null,
  turns: [],
  players: playerNames.map((name, index) => ({
    id: `player-${index + 1}-${Date.now()}`,
    name: name.trim(),
    currentScore: mode === "free" ? 0 : startingScore,
    legsWon: 0,
  })),
  currentPlayerIndex: 0,
  dartsRemaining: 3,
});

export default function Home() {
  const [game, setGame] = useState(null);
  const [error, setError] = useState(null);
  const [activePanel, setActivePanel] = useState("play");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setGame(parsed);
      } catch (err) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (game) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    }
  }, [game]);

  const createGame = (config) => {
    setError(null);
    setGame(createInitialGame(config));
  };

  const resetGame = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setGame(null);
    setError(null);
  };

  const currentPlayer = useMemo(() => {
    if (!game) return null;
    return game.players[game.currentPlayerIndex];
  }, [game]);

  const handleDartsRemainingChange = useCallback((remaining) => {
    setGame((prev) => {
      if (!prev || prev.status !== "active") return prev;
      return { ...prev, dartsRemaining: remaining };
    });
  }, []);

  const handleScoreSubmit = (playerId, darts) => {
    setActivePanel("play");
    setGame((prev) => {
      if (!prev || prev.status !== "active") return prev;
      const players = prev.players.map((player) => ({ ...player }));
      const currentPlayerIndex = prev.currentPlayerIndex;
      const player = players[currentPlayerIndex];

      if (player.id !== playerId) {
        setError("Not this player's turn.");
        return prev;
      }

      const scoredDarts = darts.filter(Boolean);
      const total = scoredDarts.reduce((sum, dart) => sum + dart.value, 0);

      let status = prev.status;
      let winner = prev.winner;
      let currentLeg = prev.currentLeg;
      let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
      let isBust = false;

      if (prev.mode === "free") {
        player.currentScore += total;
      } else {
        const newScore = player.currentScore - total;
        isBust = newScore < 0;

        if (!isBust) {
          player.currentScore = newScore;
        }

        if (!isBust && newScore === 0) {
          player.legsWon += 1;
          if (player.legsWon >= prev.legs) {
            status = "completed";
            winner = player.name;
            nextPlayerIndex = currentPlayerIndex;
          } else {
            currentLeg += 1;
            players.forEach((p) => {
              p.currentScore = prev.startingScore;
            });
            nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
          }
        }
      }

      return {
        ...prev,
        turns: [
          {
            id: `turn-${Date.now()}`,
            playerId: player.id,
            playerName: player.name,
            leg: currentLeg,
            darts: scoredDarts,
            total,
            isBust,
            mode: prev.mode,
            timestamp: Date.now(),
          },
          ...(prev.turns || []),
        ],
        players,
        status,
        winner,
        currentLeg,
        currentPlayerIndex: nextPlayerIndex,
        dartsRemaining: 3,
      };
    });
  };

  if (!game) {
    return (
      <div className="app-container">
        <div className="app-header">
          <h1>🎯 Dart Scoreboard</h1>
          <p className="subtitle">Smart scoring that stays on your device</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <GameSetup onCreateGame={createGame} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>🎯 Dart Scoreboard</h1>
        <div className="game-info">
          {game.mode === "free" ? (
            <span>Free Play</span>
          ) : (
            <>
              <span>{game.startingScore} Game</span>
              <span>
                Leg {game.currentLeg} of {game.legs}
              </span>
            </>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {game.status === "completed" && (
        <div className="game-won">
          <h2>Game Won!</h2>
          <p>{game.winner} takes the match.</p>
          <button onClick={resetGame}>New Game</button>
        </div>
      )}

      <div className="smart-controls">
        <button
          className={`smart-pill ${activePanel === "play" ? "active" : ""}`}
          onClick={() => setActivePanel("play")}
        >
          🎯 Play
        </button>
        <button
          className={`smart-pill ${activePanel === "history" ? "active" : ""}`}
          onClick={() => setActivePanel("history")}
        >
          🕒 History
        </button>
      </div>

      {activePanel === "play" ? (
        <>
          {game.status === "active" && currentPlayer && (
            <div className="section-block">
              <div className="section-title">Next Action</div>
              <ScoreInput
                player={currentPlayer}
                onScoreSubmit={handleScoreSubmit}
                onDartsRemainingChange={handleDartsRemainingChange}
                inputMode={game.inputMode}
                mascotEnabled={game.mascotEnabled}
              />
            </div>
          )}

          <div className="section-block">
            <div className="section-title">Scoreboard</div>
            <Scoreboard
              players={game.players}
              currentPlayerId={currentPlayer?.id}
              dartsRemaining={game.dartsRemaining}
              mode={game.mode}
              turns={game.turns || []}
            />
          </div>

          <div className="section-block">
            <div className="section-title">Recent Turns</div>
            <div className="turn-history">
              <div className="turn-history-header">
                <h3>
                  <span className="label-icon">🕒</span>
                  Recent Turns
                </h3>
                <span>{game.turns ? Math.min(game.turns.length, 12) : 0} shown</span>
              </div>
              <div className="turn-history-list">
                {(game.turns || []).slice(0, 12).map((turn) => (
                  <div key={turn.id} className={`turn-row ${turn.isBust ? "bust" : ""}`}>
                    <div className="turn-player">{turn.playerName}</div>
                    <div className="turn-darts">
                      {turn.darts && turn.darts.length
                        ? turn.darts.map((dart) => dart.label).join(" · ")
                        : "—"}
                    </div>
                    <div className="turn-total">
                      {turn.isBust ? "Bust" : turn.mode === "free" ? `+${turn.total}` : `-${turn.total}`}
                    </div>
                  </div>
                ))}
                {(!game.turns || game.turns.length === 0) && (
                  <div className="turn-empty">No turns yet.</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="section-block">
            <div className="section-title">Recent Turns</div>
            <div className="turn-history">
              <div className="turn-history-header">
                <h3>
                  <span className="label-icon">🕒</span>
                  Recent Turns
                </h3>
                <span>{game.turns ? Math.min(game.turns.length, 12) : 0} shown</span>
              </div>
              <div className="turn-history-list">
                {(game.turns || []).slice(0, 12).map((turn) => (
                  <div key={turn.id} className={`turn-row ${turn.isBust ? "bust" : ""}`}>
                    <div className="turn-player">{turn.playerName}</div>
                    <div className="turn-darts">
                      {turn.darts && turn.darts.length
                        ? turn.darts.map((dart) => dart.label).join(" · ")
                        : "—"}
                    </div>
                    <div className="turn-total">
                      {turn.isBust ? "Bust" : turn.mode === "free" ? `+${turn.total}` : `-${turn.total}`}
                    </div>
                  </div>
                ))}
                {(!game.turns || game.turns.length === 0) && (
                  <div className="turn-empty">No turns yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="section-block">
            <div className="section-title">Scoreboard</div>
            <Scoreboard
              players={game.players}
              currentPlayerId={currentPlayer?.id}
              dartsRemaining={game.dartsRemaining}
              mode={game.mode}
              turns={game.turns || []}
            />
          </div>
        </>
      )}

      <div className="refresh-button">
        <button onClick={resetGame}>Reset Game</button>
      </div>
    </div>
  );
}
