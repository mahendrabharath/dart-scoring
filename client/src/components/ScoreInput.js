import React, { useState, useEffect } from 'react';
import './ScoreInput.css';

function ScoreInput({ player, gameState, onScoreSubmit, onDartThrown }) {
  const [dart1, setDart1] = useState(null);
  const [dart2, setDart2] = useState(null);
  const [dart3, setDart3] = useState(null);
  const [dartsThrown, setDartsThrown] = useState(0);

  useEffect(() => {
    // Reset when player changes or turn ends
    setDart1(null);
    setDart2(null);
    setDart3(null);
    setDartsThrown(0);
  }, [player.id, gameState?.darts_remaining]);

  const handleScoreClick = (score) => {
    if (dartsThrown >= 3) return;

    const dartNum = dartsThrown + 1;
    if (dartNum === 1) {
      setDart1(score);
    } else if (dartNum === 2) {
      setDart2(score);
    } else if (dartNum === 3) {
      setDart3(score);
    }

    setDartsThrown(dartNum);
    onDartThrown(player.id);
  };

  const handleSubmit = () => {
    if (dartsThrown === 0) return;
    
    onScoreSubmit(player.id, dart1, dart2, dart3);
    setDart1(null);
    setDart2(null);
    setDart3(null);
    setDartsThrown(0);
  };

  const handleClear = () => {
    setDart1(null);
    setDart2(null);
    setDart3(null);
    setDartsThrown(0);
  };

  const handleMiss = () => {
    handleScoreClick(0);
  };

  const formatDartScore = (score) => {
    if (score === null || score === undefined) return '—';
    if (score === 0) return 'Miss';
    if (score === 25) return 'Bull';
    if (score === 50) return 'DBull';
    if (score > 20 && score <= 60 && score % 3 === 0) {
      return `T${score / 3}`;
    }
    if (score > 0 && score <= 40 && score % 2 === 0) {
      return `D${score / 2}`;
    }
    return score;
  };

  const totalScore = (dart1 || 0) + (dart2 || 0) + (dart3 || 0);
  const remainingDarts = 3 - dartsThrown;

  return (
    <div className="score-input">
      <div className="input-header">
        <h3>{player.name}'s Turn</h3>
        <div className="dart-display">
          <div className={`dart ${dart1 !== null ? 'filled' : ''}`}>
            {formatDartScore(dart1)}
          </div>
          <div className={`dart ${dart2 !== null ? 'filled' : ''}`}>
            {formatDartScore(dart2)}
          </div>
          <div className={`dart ${dart3 !== null ? 'filled' : ''}`}>
            {formatDartScore(dart3)}
          </div>
        </div>
        <div className="total-score">Total: {totalScore}</div>
      </div>

      <div className="score-grid">
        <div className="score-grid-header">Select score</div>
        <div className="score-grid-table">
          {(() => {
            const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
            const quickSuggestions = [
              { label: 'T20', value: 60 },
              { label: 'T19', value: 57 },
              { label: 'D20', value: 40 },
              { label: 'DBull', value: 50 },
            ];
            const items = [
              ...numbers.map((value) => ({ kind: 'number', value })),
              { kind: 'number', value: 25 },
              ...quickSuggestions.map((item) => ({ ...item, kind: 'quick' })),
            ];
            return items.map((item, index) => {
              const isBull = item.kind === 'number' && item.value === 25;
              const isExpanded = item.kind === 'number' && expandedScore === item.value;
              const columnIndex = (index % 5) + 1;
              const overlayAlign = columnIndex <= 2 ? 'overlay-left' : columnIndex === 3 ? 'overlay-center' : 'overlay-right';
              return (
                <div key={`row-${item.kind}-${item.value}-${index}`} className="score-grid-row compact">
                  <button
                    type="button"
                    className={`score-grid-circle ${isBull ? 'bull' : ''} ${item.kind === 'quick' ? 'quick' : ''}`}
                    onClick={() => {
                      if (item.kind === 'quick') {
                        handleScoreClick(item.value);
                        return;
                      }
                      setExpandedScore(isExpanded ? null : item.value);
                    }}
                    disabled={dartsThrown >= 3}
                  >
                    {item.kind === 'quick' ? item.label : item.value}
                  </button>
                  {isExpanded && (
                    <div className={`score-grid-segmented ${overlayAlign}`}>
                      {isBull ? (
                        <>
                          <button
                            type="button"
                            className="score-segment bull"
                            onClick={() => {
                              handleScoreClick(25);
                              setExpandedScore(null);
                            }}
                            disabled={dartsThrown >= 3}
                          >
                            25 Single
                          </button>
                          <button
                            type="button"
                            className="score-segment double-bull"
                            onClick={() => {
                              handleScoreClick(50);
                              setExpandedScore(null);
                            }}
                            disabled={dartsThrown >= 3}
                          >
                            25 Double
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="score-segment single"
                            onClick={() => {
                              handleScoreClick(item.value);
                              setExpandedScore(null);
                            }}
                            disabled={dartsThrown >= 3}
                          >
                            {item.value} Single
                          </button>
                          <button
                            type="button"
                            className="score-segment double"
                            onClick={() => {
                              handleScoreClick(item.value * 2);
                              setExpandedScore(null);
                            }}
                            disabled={dartsThrown >= 3}
                          >
                            {item.value} Double
                          </button>
                          <button
                            type="button"
                            className="score-segment triple"
                            onClick={() => {
                              handleScoreClick(item.value * 3);
                              setExpandedScore(null);
                            }}
                            disabled={dartsThrown >= 3}
                          >
                            {item.value} Triple
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      <div className="score-miss-row">
        <button onClick={handleMiss} disabled={dartsThrown >= 3} className="score-btn miss">
          Miss (0)
        </button>
      </div>

      <div className="input-actions">
        <button onClick={handleClear} className="clear-btn">
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={dartsThrown === 0}
          className="submit-btn"
        >
          Submit Turn
        </button>
      </div>

      {remainingDarts > 0 && (
        <div className="remaining-darts">
          {remainingDarts} dart{remainingDarts > 1 ? 's' : ''} remaining
        </div>
      )}
    </div>
  );
}

export default ScoreInput;

