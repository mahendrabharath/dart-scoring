import { useState } from "react";

export default function GameSetup({ onCreateGame }) {
  const [mode, setMode] = useState("x01");
  const [startingScore, setStartingScore] = useState("501");
  const [legs, setLegs] = useState("1");
  const [playerNames, setPlayerNames] = useState(["Player 1", "Player 2"]);
  const [numPlayers, setNumPlayers] = useState("2");
  const [inputMode, setInputMode] = useState("board");
  const [mascotEnabled, setMascotEnabled] = useState(true);

  const handleNumPlayersChange = (event) => {
    const newNum = Number(event.target.value);
    setNumPlayers(event.target.value);
    const updated = [...playerNames];
    while (updated.length < newNum) {
      updated.push(`Player ${updated.length + 1}`);
    }
    while (updated.length > newNum) {
      updated.pop();
    }
    setPlayerNames(updated);
  };

  const handlePlayerNameChange = (index, value) => {
    const updated = [...playerNames];
    updated[index] = value;
    setPlayerNames(updated);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedNames = playerNames.map((name) => name.trim()).filter(Boolean);
    onCreateGame({
      mode,
      startingScore: mode === "free" ? 0 : Number(startingScore),
      legs: mode === "free" ? 1 : Number(legs),
      inputMode,
      mascotEnabled,
      playerNames: trimmedNames,
    });
  };

  return (
    <div className="game-setup">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            <span className="label-icon">🎮</span>
            Game Mode
          </label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="x01">X01 (501/301/101/1001)</option>
            <option value="free">Free Play (no checkout)</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <span className="label-icon">🧮</span>
            Score Input
          </label>
          <select value={inputMode} onChange={(e) => setInputMode(e.target.value)}>
            <option value="board">Dartboard</option>
            <option value="grid">Grid (S/D/T)</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <span className="label-icon">🧿</span>
            Mascot
          </label>
          <select value={mascotEnabled ? "on" : "off"} onChange={(e) => setMascotEnabled(e.target.value === "on")}>
            <option value="on">Show mascot</option>
            <option value="off">Hide mascot</option>
          </select>
        </div>

        {mode === "x01" && (
          <>
        <div className="form-group">
          <label>
            <span className="label-icon">🎯</span>
            Starting Score
          </label>
          <select value={startingScore} onChange={(e) => setStartingScore(e.target.value)}>
            <option value="501">501</option>
            <option value="301">301</option>
            <option value="101">101</option>
            <option value="1001">1001</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <span className="label-icon">🏁</span>
            Number of Legs
          </label>
          <select value={legs} onChange={(e) => setLegs(e.target.value)}>
            <option value="1">1 Leg</option>
            <option value="3">3 Legs</option>
            <option value="5">5 Legs</option>
            <option value="7">7 Legs</option>
            <option value="9">9 Legs</option>
          </select>
        </div>
          </>
        )}

        <div className="form-group">
          <label>
            <span className="label-icon">👥</span>
            Number of Players
          </label>
          <select value={numPlayers} onChange={handleNumPlayersChange}>
            <option value="2">2 Players</option>
            <option value="3">3 Players</option>
            <option value="4">4 Players</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <span className="label-icon">🧑‍🤝‍🧑</span>
            Player Names
          </label>
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
