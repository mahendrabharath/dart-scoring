import { useState } from "react";

export default function GameSetup({ onCreateGame }) {
  const [mode, setMode] = useState("x01");
  const [startingScore, setStartingScore] = useState("501");
  const [legs, setLegs] = useState("1");
  const [playerNames, setPlayerNames] = useState(["Player 1"]);
  const [numPlayers, setNumPlayers] = useState("1");
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
          <div className="control-segment">
            <button
              type="button"
              className={`segment-btn ${mode === "x01" ? "active" : ""}`}
              onClick={() => setMode("x01")}
            >
              X01
            </button>
            <button
              type="button"
              className={`segment-btn ${mode === "free" ? "active" : ""}`}
              onClick={() => setMode("free")}
            >
              Free Play
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>
            <span className="label-icon">🧮</span>
            Score Input
          </label>
          <div className="control-segment">
            <button
              type="button"
              className={`segment-btn ${inputMode === "board" ? "active" : ""}`}
              onClick={() => setInputMode("board")}
            >
              Dartboard
            </button>
            <button
              type="button"
              className={`segment-btn ${inputMode === "grid" ? "active" : ""}`}
              onClick={() => setInputMode("grid")}
            >
              Grid
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>
            <span className="label-icon">🧿</span>
            Mascot
          </label>
          <div className="control-segment">
            <button
              type="button"
              className={`segment-btn ${mascotEnabled ? "active" : ""}`}
              onClick={() => setMascotEnabled(true)}
            >
              Show
            </button>
            <button
              type="button"
              className={`segment-btn ${!mascotEnabled ? "active" : ""}`}
              onClick={() => setMascotEnabled(false)}
            >
              Hide
            </button>
          </div>
        </div>

        {mode === "x01" && (
          <>
            <div className="form-group">
              <label>
                <span className="label-icon">🎯</span>
                Starting Score
              </label>
              <div className="control-chip-group">
                {["501", "301", "101", "1001"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`chip-btn ${startingScore === value ? "active" : ""}`}
                    onClick={() => setStartingScore(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon">🏁</span>
                Number of Legs
              </label>
              <div className="control-chip-group">
                {["1", "3", "5", "7", "9"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`chip-btn ${legs === value ? "active" : ""}`}
                    onClick={() => setLegs(value)}
                  >
                    {value} Leg{value === "1" ? "" : "s"}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="form-group">
          <label>
            <span className="label-icon">👥</span>
            Number of Players
          </label>
          <div className="control-chip-group">
            {["1", "2", "3", "4"].map((value) => (
              <button
                key={value}
                type="button"
                className={`chip-btn ${numPlayers === value ? "active" : ""}`}
                onClick={() => handleNumPlayersChange({ target: { value } })}
              >
                {value} Player{value === "1" ? "" : "s"}
              </button>
            ))}
          </div>
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
