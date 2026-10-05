# Fast Guess

A real-time multiplayer guessing game for up to three players.

## Build 1

This first build establishes the multiplayer lobby:

- Create a game and receive a four-character game ID.
- Join by game ID.
- Shareable game URL is displayed.
- Up to three players can occupy a game.
- Server owns the game state.

## Run locally

```bash
npm install
npm run dev
```

The server listens on port 3000.

The next build will add robust reconnect/leave handling and then the actual clue/answer race.
