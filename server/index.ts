import express from "express";
import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "node:crypto";

type Player = { id: string; name: string; socket: WebSocket };
type PublicPlayer = { id: string; name: string };
type Game = { gameId: string; hostId: string; players: Map<string, Player> };

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const games = new Map<string, Game>();

const publicState = (game: Game) => ({
  gameId: game.gameId,
  hostId: game.hostId,
  players: [...game.players.values()].map(({ id, name }) => ({ id, name }))
});

function send(ws: WebSocket, payload: object) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function broadcast(game: Game) {
  const payload = { type: "game", state: publicState(game) };
  for (const player of game.players.values()) send(player.socket, payload);
}

function newGameId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  do {
    id = Array.from({ length: 4 }, () => chars[crypto.randomInt(chars.length)]).join("");
  } while (games.has(id));
  return id;
}

wss.on("connection", (socket) => {
  socket.on("message", raw => {
    try {
      const message = JSON.parse(raw.toString());
      const name = typeof message.name === "string" ? message.name.trim().slice(0, 20) : "Player";

      if (message.type === "create_game") {
        const gameId = newGameId();
        const playerId = crypto.randomUUID();
        const game: Game = { gameId, hostId: playerId, players: new Map() };
        game.players.set(playerId, { id: playerId, name: name || "Player", socket });
        games.set(gameId, game);
        broadcast(game);
        return;
      }

      if (message.type === "join_game") {
        const gameId = typeof message.gameId === "string" ? message.gameId.toUpperCase() : "";
        const game = games.get(gameId);
        if (!game) return send(socket, { type: "error", message: "Game not found." });
        if (game.players.size >= 3) return send(socket, { type: "error", message: "That game is full." });

        const playerId = crypto.randomUUID();
        game.players.set(playerId, { id: playerId, name: name || "Player", socket });
        broadcast(game);
        return;
      }

      send(socket, { type: "error", message: "Unknown message." });
    } catch {
      send(socket, { type: "error", message: "Invalid message." });
    }
  });
});

server.listen(3000, () => console.log("Fast Guess server listening on http://localhost:3000"));
