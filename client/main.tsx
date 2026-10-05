import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Player = { id: string; name: string };
type GameState = { gameId: string; hostId: string; players: Player[] };

const wsProtocol = location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${wsProtocol}://${location.host}`);

function App() {
  const [gameId, setGameId] = React.useState("");
  const [name, setName] = React.useState("");
  const [state, setState] = React.useState<GameState | null>(null);
  const [message, setMessage] = React.useState("Connecting…");

  React.useEffect(() => {
    ws.onopen = () => setMessage("Connected");
    ws.onclose = () => setMessage("Disconnected");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "game") {
        setState(data.state);
        setGameId(data.state.gameId);
        setMessage("Connected");
      }
      if (data.type === "error") setMessage(data.message);
    };
  }, []);

  const send = (payload: object) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(payload));

  const createGame = () => send({ type: "create_game", name: name.trim() || "Player" });
  const joinGame = () => send({ type: "join_game", gameId: gameId.trim().toUpperCase(), name: name.trim() || "Player" });

  if (!state) {
    return <main className="shell">
      <section className="card">
        <p className="eyebrow">REAL-TIME MULTIPLAYER</p>
        <h1>Fast Guess</h1>
        <p className="sub">Race your friends to the answer.</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" maxLength={20} />
        <div className="row">
          <button onClick={createGame}>Create Game</button>
          <span>or</span>
          <input value={gameId} onChange={e => setGameId(e.target.value)} placeholder="GAME ID" maxLength={4} />
          <button className="secondary" onClick={joinGame}>Join</button>
        </div>
        <small>{message}</small>
      </section>
    </main>;
  }

  return <main className="shell">
    <section className="card">
      <p className="eyebrow">GAME {state.gameId}</p>
      <h1>Waiting room</h1>
      <p className="sub">Share this URL with your players:</p>
      <code>{location.origin}/?game={state.gameId}</code>
      <h2>{state.players.length}/3 players</h2>
      <ul>{state.players.map(player => <li key={player.id}>{player.name}{player.id === state.hostId ? " — Host" : ""}</li>)}</ul>
      <small>{message}</small>
    </section>
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);
