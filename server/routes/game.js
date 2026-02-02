const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { calculateCheckout } = require('../utils/checkout');

// Create a new game
router.post('/create', (req, res) => {
  const { gameType, startingScore, legs, playerNames } = req.body;
  const db = getDb();

  db.serialize(() => {
    db.run(
      `INSERT INTO games (game_type, starting_score, legs, status) 
       VALUES (?, ?, ?, 'active')`,
      [gameType, startingScore, legs],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const gameId = this.lastID;
        const players = [];

        // Insert players
        const stmt = db.prepare(
          `INSERT INTO players (game_id, name, current_score, is_active) 
           VALUES (?, ?, ?, ?)`
        );

        playerNames.forEach((name, index) => {
          stmt.run([gameId, name, startingScore, index === 0 ? 1 : 0], function(err) {
            if (!err) {
              players.push({ id: this.lastID, name, current_score: startingScore, is_active: index === 0 });
            }
          });
        });

        stmt.finalize((err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Initialize game state
          db.run(
            `INSERT INTO game_state (game_id, current_player_id, current_leg, darts_remaining)
             VALUES (?, ?, 1, 3)`,
            [gameId, players[0].id],
            (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              res.json({
                gameId,
                players,
                gameType,
                startingScore,
                legs,
                currentLeg: 1
              });
            }
          );
        });
      }
    );
  });
});

// Get game state
router.get('/:gameId', (req, res) => {
  const { gameId } = req.params;
  const db = getDb();

  db.serialize(() => {
    // Get game info
    db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Get players
      db.all('SELECT * FROM players WHERE game_id = ? ORDER BY id', [gameId], (err, players) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Get game state
        db.get('SELECT * FROM game_state WHERE game_id = ?', [gameId], (err, gameState) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Get recent turns for current leg
          db.all(
            `SELECT * FROM turns 
             WHERE game_id = ? AND leg_number = ? 
             ORDER BY turn_number DESC, id DESC 
             LIMIT 20`,
            [gameId, game.current_leg],
            (err, turns) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              // Calculate checkout suggestions for each player
              const playersWithCheckout = players.map(player => {
                const checkout = calculateCheckout(player.current_score);
                return { ...player, checkout };
              });

              res.json({
                game,
                players: playersWithCheckout,
                gameState,
                recentTurns: turns
              });
            }
          );
        });
      });
    });
  });
});

// Submit a turn (score entry)
router.post('/:gameId/turn', (req, res) => {
  const { gameId } = req.params;
  const { playerId, dart1, dart2, dart3 } = req.body;
  const db = getDb();

  db.serialize(() => {
    // Get current game state
    db.get('SELECT * FROM game_state WHERE game_id = ?', [gameId], (err, gameState) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!gameState || gameState.current_player_id !== playerId) {
        return res.status(400).json({ error: 'Not this player\'s turn' });
      }

      // Get player and game info
      db.get('SELECT * FROM players WHERE id = ?', [playerId], (err, player) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Calculate scores
          const scores = [dart1, dart2, dart3].filter(d => d !== null && d !== undefined);
          const totalScore = scores.reduce((sum, score) => sum + (score || 0), 0);
          const dartsThrown = scores.length;
          const newScore = player.current_score - totalScore;
          const isBust = newScore < 0 || (newScore === 0 && dartsThrown < 3);

          // Insert turn
          db.run(
            `INSERT INTO turns (game_id, player_id, leg_number, turn_number, dart1, dart2, dart3, score, darts_thrown, is_bust)
             VALUES (?, ?, ?, 
               (SELECT COALESCE(MAX(turn_number), 0) + 1 FROM turns WHERE game_id = ? AND leg_number = ?),
               ?, ?, ?, ?, ?, ?)`,
            [gameId, playerId, game.current_leg, gameId, game.current_leg, dart1, dart2, dart3, totalScore, dartsThrown, isBust ? 1 : 0],
            function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              if (!isBust) {
                // Update player score
                db.run(
                  'UPDATE players SET current_score = ? WHERE id = ?',
                  [newScore, playerId],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: err.message });
                    }

                    // Check if player won the leg
                    if (newScore === 0) {
                      // Player won the leg
                      db.run(
                        'UPDATE players SET legs_won = legs_won + 1 WHERE id = ?',
                        [playerId],
                        (err) => {
                          if (err) {
                            return res.status(500).json({ error: err.message });
                          }

                          // Check if game is over
                          db.get('SELECT legs_won FROM players WHERE id = ?', [playerId], (err, updatedPlayer) => {
                            if (err) {
                              return res.status(500).json({ error: err.message });
                            }

                            if (updatedPlayer.legs_won >= game.legs) {
                              // Game won
                              db.run('UPDATE games SET status = ? WHERE id = ?', ['completed', gameId], () => {
                                res.json({ 
                                  turnId: this.lastID,
                                  newScore: 0,
                                  legWon: true,
                                  gameWon: true,
                                  winner: player.name
                                });
                              });
                            } else {
                              // Start new leg
                              const newLeg = game.current_leg + 1;
                              db.run('UPDATE games SET current_leg = ? WHERE id = ?', [newLeg, gameId], () => {
                                // Reset all player scores
                                db.run('UPDATE players SET current_score = ? WHERE game_id = ?', [game.starting_score, gameId], () => {
                                  // Set first player as active for new leg
                                  db.all('SELECT id FROM players WHERE game_id = ? ORDER BY id LIMIT 1', [gameId], (err, firstPlayer) => {
                                    db.run('UPDATE players SET is_active = 0 WHERE game_id = ?', [gameId], () => {
                                      db.run('UPDATE players SET is_active = 1 WHERE id = ?', [firstPlayer[0].id], () => {
                                        db.run(
                                          'UPDATE game_state SET current_player_id = ?, current_leg = ?, darts_remaining = 3 WHERE game_id = ?',
                                          [firstPlayer[0].id, newLeg, gameId],
                                          () => {
                                            res.json({ 
                                              turnId: this.lastID,
                                              newScore: 0,
                                              legWon: true,
                                              gameWon: false,
                                              newLeg
                                            });
                                          }
                                        );
                                      });
                                    });
                                  });
                                });
                              });
                            }
                          });
                        }
                      );
                    } else {
                      // Move to next player
                      moveToNextPlayer(db, gameId, gameState, (err) => {
                        if (err) {
                          return res.status(500).json({ error: err.message });
                        }
                        res.json({ 
                          turnId: this.lastID,
                          newScore,
                          legWon: false,
                          gameWon: false
                        });
                      });
                    }
                  }
                );
              } else {
                // Bust - move to next player
                moveToNextPlayer(db, gameId, gameState, (err) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                  res.json({ 
                    turnId: this.lastID,
                    newScore: player.current_score,
                    legWon: false,
                    gameWon: false,
                    isBust: true
                  });
                });
              }
            }
          );
        });
      });
    });
  });
});

// Move to next player
function moveToNextPlayer(db, gameId, gameState, callback) {
  // Get all players
  db.all('SELECT id FROM players WHERE game_id = ? ORDER BY id', [gameId], (err, players) => {
    if (err) {
      return callback(err);
    }

    const currentIndex = players.findIndex(p => p.id === gameState.current_player_id);
    const nextIndex = (currentIndex + 1) % players.length;
    const nextPlayerId = players[nextIndex].id;

    // Update active player
    db.run('UPDATE players SET is_active = 0 WHERE game_id = ?', [gameId], (err) => {
      if (err) {
        return callback(err);
      }

      db.run('UPDATE players SET is_active = 1 WHERE id = ?', [nextPlayerId], (err) => {
        if (err) {
          return callback(err);
        }

        // Reset darts and update game state
        db.run(
          'UPDATE game_state SET current_player_id = ?, darts_remaining = 3 WHERE game_id = ?',
          [nextPlayerId, gameId],
          callback
        );
      });
    });
  });
}

// Update darts remaining (when user throws a dart)
router.post('/:gameId/dart', (req, res) => {
  const { gameId } = req.params;
  const { playerId } = req.body;
  const db = getDb();

  db.get('SELECT * FROM game_state WHERE game_id = ?', [gameId], (err, gameState) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (gameState.current_player_id !== playerId) {
      return res.status(400).json({ error: 'Not this player\'s turn' });
    }

    const newDartsRemaining = Math.max(0, gameState.darts_remaining - 1);
    
    db.run(
      'UPDATE game_state SET darts_remaining = ? WHERE game_id = ?',
      [newDartsRemaining, gameId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ dartsRemaining: newDartsRemaining });
      }
    );
  });
});

// Get all active games
router.get('/', (req, res) => {
  const db = getDb();
  
  db.all(
    `SELECT g.*, COUNT(DISTINCT p.id) as player_count 
     FROM games g 
     LEFT JOIN players p ON g.id = p.game_id 
     WHERE g.status = 'active' 
     GROUP BY g.id 
     ORDER BY g.created_at DESC`,
    (err, games) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(games);
    }
  );
});

module.exports = router;

