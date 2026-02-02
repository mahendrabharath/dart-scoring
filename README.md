# 🎯 Dart Scoreboard (Next.js)

A smart, easy-to-use dart scoreboard built as a **frontend-only** Next.js app. All data is stored locally in the browser (LocalStorage), so it survives accidental refreshes or tab closes and deploys easily to Vercel.

## Features

- **Frontend-only**: No backend, no database, Vercel-friendly
- **Persistent Storage**: Game state stored in LocalStorage
- **Multiple Game Types**: 501, 301, 101, 1001
- **Flexible Legs**: 1, 3, 5, 7, 9
- **2-4 Players**
- **Turn Tracking**: Clear active player highlight
- **Dart Counting**: Darts thrown and remaining per turn
- **Checkout Suggestions**: 1–3 dart checkout recommendations or smart leaves
- **Clean UI**: Simple, focused, and fast

## Project Location

The Next.js app lives in:

```
/Users/bharath/Area/Projects/Dart Scoreboard/nextjs
```

## Development

```bash
cd "/Users/bharath/Area/Projects/Dart Scoreboard/nextjs"
npm run dev
```

Then open `http://localhost:3000`.

## Deployment

Deploy directly on Vercel:

- Root directory: `nextjs`
- Build command: `npm run build`
- Output: `.next`

## Notes

The previous backend/React prototype remains in the repo but is not used by the Next.js app.
