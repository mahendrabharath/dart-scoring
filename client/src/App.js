import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import GameSetup from './components/GameSetup';
import Scoreboard from './components/Scoreboard';
import ScoreInput from './components/ScoreInput';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [gameId, setGameId] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load game from localStorage on mount
  useEffect(() => {
    const savedGameId = localStorage.getItem('dartGameId');
    if (savedGameId) {
      loadGame(savedGameId);
    }
  }, []);

  const loadGame = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/game/${id}`);
      setGameData(response.data);
      setGameId(id);
      localStorage.setItem('dartGameId', id);
    } catch (err) {
      setError('Failed to load game');
      console.error(err);
      localStorage.removeItem('dartGameId');
    } finally {
      setLoading(false);
    }
  };

  const createGame = async (gameConfig) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/game/create`, gameConfig);
      setGameData(response.data);
      setGameId(response.data.gameId);
      localStorage.setItem('dartGameId', response.data.gameId);
    } catch (err) {
      setError('Failed to create game');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshGame = async () => {
    if (gameId) {
      await loadGame(gameId);
    }
  };

  const handleScoreSubmit = async (playerId, dart1, dart2, dart3) => {
    try {
      await axios.post(`${API_BASE}/game/${gameId}/turn`, {
        playerId,
        dart1,
        dart2,
        dart3
      });
      await refreshGame();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit score');
      console.error(err);
    }
  };

  const handleDartThrown = async (playerId) => {
    try {
      await axios.post(`${API_BASE}/game/${gameId}/dart`, { playerId });
      await refreshGame();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !gameData) {
    return (
      <div className="app-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="app-container">
        <div className="app-header">
          <h1>🎯 Dart Scoreboard</h1>
          <p className="subtitle">Smart scoring for dart games</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <GameSetup onCreateGame={createGame} />
      </div>
    );
  }

  const currentPlayer = gameData.players.find(p => p.is_active === 1);
  const gameState = gameData.gameState;

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>🎯 Dart Scoreboard</h1>
        <div className="game-info">
          <span>{gameData.game.game_type} - {gameData.game.starting_score}</span>
          <span>Leg {gameData.game.current_leg} of {gameData.game.legs}</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {gameData.game.status === 'completed' && (
        <div className="game-won">
          <h2>Game Won!</h2>
          <p>Congratulations to the winner!</p>
          <button onClick={() => {
            setGameData(null);
            setGameId(null);
            localStorage.removeItem('dartGameId');
          }}>New Game</button>
        </div>
      )}

      <Scoreboard 
        players={gameData.players} 
        currentPlayerId={currentPlayer?.id}
        gameState={gameState}
      />

      {gameData.game.status === 'active' && currentPlayer && (
        <ScoreInput
          player={currentPlayer}
          gameState={gameState}
          onScoreSubmit={handleScoreSubmit}
          onDartThrown={handleDartThrown}
        />
      )}

      <div className="refresh-button">
        <button onClick={refreshGame}>Refresh</button>
      </div>
    </div>
  );
}

export default App;

