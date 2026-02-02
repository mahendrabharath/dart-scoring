const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'dart_scoreboard.db');

let db = null;

function initDatabase() {
  // Create database file if it doesn't exist
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, '');
  }

  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to SQLite database');
      createTables();
    }
  });
}

function createTables() {
  // Games table
  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_type TEXT NOT NULL,
      starting_score INTEGER NOT NULL,
      legs INTEGER NOT NULL,
      current_leg INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Players table
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      current_score INTEGER NOT NULL,
      legs_won INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `);

  // Turns table (tracks each turn with darts thrown)
  db.run(`
    CREATE TABLE IF NOT EXISTS turns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      leg_number INTEGER NOT NULL,
      turn_number INTEGER NOT NULL,
      dart1 INTEGER,
      dart2 INTEGER,
      dart3 INTEGER,
      score INTEGER DEFAULT 0,
      darts_thrown INTEGER DEFAULT 0,
      is_bust INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )
  `);

  // Current game state
  db.run(`
    CREATE TABLE IF NOT EXISTS game_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL UNIQUE,
      current_player_id INTEGER,
      current_leg INTEGER DEFAULT 1,
      darts_remaining INTEGER DEFAULT 3,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (current_player_id) REFERENCES players(id) ON DELETE CASCADE
    )
  `);
}

function getDb() {
  return db;
}

module.exports = {
  initDatabase,
  getDb
};

