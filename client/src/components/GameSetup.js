import React, { useState } from 'react';
import './GameSetup.css';

function GameSetup({ onCreateGame }) {
  const [gameType, setGameType] = useState('501');
  const [legs, setLegs] = useState(1);
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2']);
  const [numPlayers, setNumPlayers] = useState(2);

  const handleNumPlayersChange = (e) => {
    const newNum = parseInt(e.target.value);
    setNumPlayers(newNum);
    const newNames = [...playerNames];
    while (newNames.length < newNum) {
      newNames.push(`Player ${newNames.length + 1}`);
    }
    while (newNames.length > newNum) {
      newNames.pop();
    }
    setPlayerNames(newNames);
  };

  const handlePlayerNameChange = (index, value) => {
    const newNames = [...playerNames];
    newNames[index] = value;
    setPlayerNames(newNames);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateGame({
      gameType: `${gameType} Game`,
      startingScore: parseInt(gameType),
      legs: parseInt(legs),
      playerNames: playerNames.filter(name => name.trim() !== '')
    });
  };

  return (
    <div className="game-setup">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Starting Score</label>
          <select value={gameType} onChange={(e) => setGameType(e.target.value)}>
            <option value="501">501</option>
            <option value="301">301</option>
            <option value="101">101</option>
            <option value="1001">1001</option>
          </select>
        </div>

        <div className="form-group">
          <label>Number of Legs</label>
          <select value={legs} onChange={(e) => setLegs(e.target.value)}>
            <option value="1">1 Leg</option>
            <option value="3">3 Legs</option>
            <option value="5">5 Legs</option>
            <option value="7">7 Legs</option>
            <option value="9">9 Legs</option>
          </select>
        </div>

        <div className="form-group">
          <label>Number of Players</label>
          <select value={numPlayers} onChange={handleNumPlayersChange}>
            <option value="2">2 Players</option>
            <option value="3">3 Players</option>
            <option value="4">4 Players</option>
          </select>
        </div>

        <div className="form-group">
          <label>Player Names</label>
          {playerNames.map((name, index) => (
            <input
              key={index}
              type="text"
              value={name}
              onChange={(e) => handlePlayerNameChange(index, e.target.value)}
              placeholder={`Player ${index + 1}`}
              required
            />
          ))}
        </div>

        <button type="submit" className="start-button">Start Game</button>
      </form>
    </div>
  );
}

export default GameSetup;

