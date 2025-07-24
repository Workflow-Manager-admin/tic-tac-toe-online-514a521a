import React, { useState, useEffect } from "react";
import "./App.css";

/* --- Theme Color Palette Constants --- */
const COLORS = {
  accent: "#f44336",
  primary: "#1976d2",
  secondary: "#ffffff",
};

/* --- Tic Tac Toe Game Logic Helpers --- */
const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // cols
  [0, 4, 8],
  [2, 4, 6], // diags
];

// PUBLIC_INTERFACE
function calculateWinner(squares) {
  /** Checks the board for a winner and returns 'X', 'O', or null.  */
  for (let [a, b, c] of WIN_LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[b] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

// PUBLIC_INTERFACE
function getEmptySquares(squares) {
  /** Returns array of indexes for empty squares */
  return squares
    .map((sq, idx) => (sq === null ? idx : null))
    .filter((v) => v !== null);
}

// PUBLIC_INTERFACE
function getAIMove(squares, aiSymbol, playerSymbol) {
  /**
   * Simple AI for Tic Tac Toe:
   * 1. Win if possible
   * 2. Block if player is about to win
   * 3. Take center, corner, or side
   */
  const empty = getEmptySquares(squares);

  // Try to win
  for (let i of empty) {
    const board = [...squares];
    board[i] = aiSymbol;
    if (calculateWinner(board) === aiSymbol) return i;
  }

  // Block player win
  for (let i of empty) {
    const board = [...squares];
    board[i] = playerSymbol;
    if (calculateWinner(board) === playerSymbol) return i;
  }

  // Take center
  if (empty.includes(4)) return 4;

  // Take any corner
  const corners = empty.filter((i) => [0, 2, 6, 8].includes(i));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  // Take any side
  return empty[Math.floor(Math.random() * empty.length)];
}

/* --- Square Component --- */
function Square({ value, onClick, highlight }) {
  return (
    <button
      className="ttt-square"
      style={{
        color:
          value === "X"
            ? COLORS.primary
            : value === "O"
            ? COLORS.accent
            : COLORS.primary,
        backgroundColor: highlight ? "#f7fafd" : COLORS.secondary,
        borderColor: highlight
          ? COLORS.accent
          : "rgba(25, 118, 210, 0.14)",
        fontWeight: highlight ? "bold" : "normal",
      }}
      onClick={onClick}
      aria-label={value ? `Cell: ${value}` : "Cell: empty"}
    >
      {value}
    </button>
  );
}

/* --- Game Board --- */
function Board({ squares, onSquareClick, winLine }) {
  return (
    <div className="ttt-board">
      {squares.map((square, i) => (
        <Square
          key={i}
          value={square}
          onClick={() => onSquareClick(i)}
          highlight={winLine && winLine.includes(i)}
        />
      ))}
    </div>
  );
}

/* --- Control Panel: Mode Select, Score, Status, Restart --- */
function Controls({
  mode,
  setMode,
  scores,
  status,
  onRestart,
  xStartsNext,
  disableMode,
}) {
  return (
    <div className="ttt-controls">
      <div className="ttt-score-panel">
        <span
          className="ttt-score"
          title="Player X"
          style={{ color: COLORS.primary, fontWeight: "bold" }}
        >
          X: {scores.X}
        </span>
        <span
          className="ttt-score"
          title="Draws"
          style={{ color: "#888" }}
        >
          Draws: {scores.D}
        </span>
        <span
          className="ttt-score"
          title="Player O"
          style={{ color: COLORS.accent, fontWeight: "bold" }}
        >
          O: {scores.O}
        </span>
      </div>
      <div className="ttt-mode-panel">
        <label>
          <input
            type="radio"
            name="mode"
            value="pvp"
            checked={mode === "pvp"}
            onChange={() => setMode("pvp")}
            disabled={disableMode}
          />{" "}
          PvP
        </label>
        <label style={{ marginLeft: 16 }}>
          <input
            type="radio"
            name="mode"
            value="ai"
            checked={mode === "ai"}
            onChange={() => setMode("ai")}
            disabled={disableMode}
          />{" "}
          PvAI
        </label>
      </div>
      <div
        className="ttt-status"
        style={{
          color:
            status === "Draw"
              ? "#888"
              : status.startsWith("Winner")
              ? COLORS.accent
              : COLORS.primary,
        }}
        aria-live="polite"
      >
        {status}
      </div>
      <button
        className="ttt-btn"
        onClick={onRestart}
        aria-label="Restart game"
      >
        Restart
      </button>
      {/* Show who starts next when ongoing */}
      {xStartsNext !== undefined && (
        <div className="ttt-next-indicator">
          Next game: <span style={{ color: COLORS.primary, fontWeight: xStartsNext ? "bold" : "normal" }}>X</span>
          {" / "}
          <span style={{ color: COLORS.accent, fontWeight: !xStartsNext ? "bold" : "normal" }}>O</span>{" "}
          starts
        </div>
      )}
    </div>
  );
}

/* --- Main App --- */
// PUBLIC_INTERFACE
function App() {
  /**
   * PUBLIC INTERFACE.
   * Minimalistic, responsive, light-themed Tic Tac Toe game (React).
   * Features: PvP, PvAI, score tracker, win/draw detection, restart, color palette.
   */
  // ---- State ----
  const [mode, setMode] = useState("pvp"); // "pvp" or "ai"
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winLine, setWinLine] = useState(null); // Winning line indices if any
  const [scores, setScores] = useState({ X: 0, O: 0, D: 0 }); // Draws as "D"
  const [firstPlayerX, setFirstPlayerX] = useState(true); // Who starts next game

  // Compute winner and possible status
  const winner = calculateWinner(squares);
  const isDraw = !winner && squares.every(Boolean);
  const status = winner
    ? `Winner: ${winner}`
    : isDraw
    ? "Draw"
    : `Turn: ${xIsNext ? "X" : "O"}${mode === "ai" && !xIsNext ? " (AI)" : ""}`;

  // Effect: Detect and set game-ending state
  useEffect(() => {
    let foundWinLine = null;
    for (let line of WIN_LINES) {
      const [a, b, c] = line;
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[b] === squares[c]
      ) {
        foundWinLine = line;
        break;
      }
    }
    setWinLine(foundWinLine);
    if (winner || isDraw) setGameOver(true);
  }, [squares, winner, isDraw]);

  // Effect: Handle AI Move (PvAI mode, O's turn, not over)
  useEffect(() => {
    if (mode === "ai" && !xIsNext && !winner && !isDraw) {
      const aiMove = getAIMove(squares, "O", "X");
      // Add slight delay for realism
      const timer = setTimeout(() => {
        handleMove(aiMove);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [mode, xIsNext, squares, winner, isDraw]);

  // PUBLIC_INTERFACE
  function handleMove(idx) {
    /** Handles user (or AI) move. */
    if (squares[idx] || winner || isDraw || (mode === "ai" && !xIsNext))
      return; // Ignore if filled, over, or not your turn in AI mode
    const nextSquares = squares.slice();
    nextSquares[idx] = xIsNext ? "X" : "O";
    setSquares(nextSquares);
    setXIsNext((x) => !x);
  }

  // Effect: On game end, update scores
  useEffect(() => {
    if (!gameOver) return;
    if (winner) {
      setScores((s) => ({
        ...s,
        [winner]: s[winner] + 1,
      }));
    } else if (isDraw) {
      setScores((s) => ({
        ...s,
        D: s.D + 1,
      }));
    }
    // Who starts next? Alternate
    setTimeout(() => {
      setFirstPlayerX((prev) => !prev);
    }, 500);
    // eslint-disable-next-line
  }, [gameOver]); // Only run once per game end

  // PUBLIC_INTERFACE
  function handleRestart() {
    /** Resets board. Alternates who starts next (X then O) */
    setSquares(Array(9).fill(null));
    setWinLine(null);
    setGameOver(false);
    setXIsNext(firstPlayerX);
  }

  // PUBLIC_INTERFACE
  function handleSetMode(newMode) {
    // Changing mode restarts game and resets scores for new session
    setMode(newMode);
    setScores({ X: 0, O: 0, D: 0 });
    setFirstPlayerX(true);
    setSquares(Array(9).fill(null));
    setGameOver(false);
    setWinLine(null);
    setXIsNext(true);
  }

  // --- Main Layout (Minimal, Centered) ---
  return (
    <div
      className="App"
      style={{
        minHeight: "100vh",
        background: COLORS.secondary,
        color: COLORS.primary,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily:
          "'Segoe UI', Arial, Helvetica, sans-serif",
        padding: 0,
      }}
      data-theme="light"
    >
      <div className="ttt-container">
        <h1
          className="ttt-title"
          style={{
            color: COLORS.primary,
            letterSpacing: "3px",
            marginBottom: 14,
            fontWeight: 700,
          }}
        >
          Tic&nbsp;Tac&nbsp;Toe
        </h1>
        <Controls
          mode={mode}
          setMode={handleSetMode}
          scores={scores}
          status={status}
          onRestart={handleRestart}
          xStartsNext={firstPlayerX}
          disableMode={squares.some(Boolean) && !gameOver}
        />
        <div className="ttt-centerbox">
          <Board
            squares={squares}
            onSquareClick={handleMove}
            winLine={winLine}
          />
        </div>
        <footer className="ttt-footer">
          <span style={{ fontSize: 12, color: "#bbb" }}>
            Minimalistic React project &middot; v1.0 &middot; 
            <span style={{ marginLeft: 4, color: COLORS.primary }}>
              KAVIA demo
            </span>
          </span>
        </footer>
      </div>
    </div>
  );
}

export default App;
