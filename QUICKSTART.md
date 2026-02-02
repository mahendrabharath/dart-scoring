# Quick Start (Next.js)

## Start the App

```bash
cd "/Users/bharath/Area/Projects/Dart Scoreboard/nextjs"
npm install
npm run dev
```

Open `http://localhost:3000`.

## How to Use

### Start a Game

1. Choose starting score (501, 301, 101, 1001)
2. Select number of legs (1, 3, 5, 7, 9)
3. Enter player names (2–4 players)
4. Click **Start Game**

### Play

- The active player's card is highlighted with “🎯 Your Turn”
- Click score buttons for each dart (Singles, Doubles, Triples, Bull, DBull, Miss)
- Click **Submit Turn** to advance

### Smart Suggestions

Each player card shows a checkout suggestion:
- Exact 1–3 dart finishes when possible
- Otherwise a recommended leave (setup score)

### Auto Save

The game is saved in LocalStorage. If you refresh or close the tab, your game returns automatically.

## Reset Game

Click **Reset Game** to clear LocalStorage and start over.
