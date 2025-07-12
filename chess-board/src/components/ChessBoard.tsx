import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import game from "../game/Chess.ts";
import Board from "./Board.tsx";
import MoveHistory from "./MoveHistory.tsx";
import StyleSelectorControl from "./StyleSelectorControl.tsx";
import UndoControls from "./UndoControls.tsx";
import GameOverModal from "./GameOverModal.tsx";
import { toSquare } from "./utils.ts";
import { SquareCoords } from "./types.ts";
import "./ChessBoard.css";

const ChessBoard: React.FC = () => {
  const [board, setBoard] = useState(game.board());
  const [selected, setSelected] = useState<SquareCoords | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [styleName, setStyleName] = useState("cburnett");
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);
  const [listening, setListening] = useState(true);

  useEffect(() => {
    fetch("/pieces/index.json")
      .then((res) => res.json())
      .then((styles: string[]) => {
        setAvailableStyles(styles);
        const saved = Cookies.get("pieceStyle");
        setStyleName(saved && styles.includes(saved) ? saved : "cburnett");
      })
      .catch(console.error);
  }, []);

  const startListening = () => setListening(true);
  const stopListening = () => setListening(false);

  const handleStyleSelect = (style: string) => {
    setStyleName(style);
    Cookies.set("pieceStyle", style, { expires: 365 });
    setShowStyleSelector(false);
  };

  const handleRestart = () => {
    game.reset();
    setBoard(game.board());
    setMoveHistory([]);
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setGameOverMessage(null);
  };

  const handleSquareClick = (row: number, col: number) => {
    const square = toSquare(row, col);
    const piece = game.get(square);

    if (selected) {
      const from = toSquare(selected.row, selected.col);

      if (legalMoves.includes(square)) {
        const move = game.move({ from, to: square, promotion: "q" });
        if (move) {
          setBoard(game.board());
          setLastMove({ from: move.from, to: move.to });
          setMoveHistory((prev) => [...prev, move.san]);

          if (game.isCheckmate()) {
            const winner = game.turn() === "w" ? "Black" : "White";
            setGameOverMessage(`Checkmate! ${winner} wins.`);
          } else if (game.isStalemate()) {
            setGameOverMessage("Stalemate! It's a draw.");
          } else if (game.isInsufficientMaterial()) {
            setGameOverMessage("Draw!");
          }
        }
      }
      setSelected(null);
      setLegalMoves([]);
    } else if (piece && piece.color === game.turn()) {
      setSelected({ row, col });
      const moves = game.moves({ square, verbose: true }).map((m: any) => m.to);
      setLegalMoves(moves);
    }
  };

  const isLastMoveSquare = (row: number, col: number): boolean => {
    if (!lastMove) return false;
    const sq = toSquare(row, col);
    return sq === lastMove.from || sq === lastMove.to;
  };

  const attemptMove = (sanOrFrom: string, to?: string) => {
    let move;

    if (to) {
      move = game.move({ from: sanOrFrom, to, promotion: "q" });
    } else {
      move = game.move(sanOrFrom);
    }

    if (move) {
      setBoard(game.board());
      setLastMove({ from: move.from, to: move.to });
      setMoveHistory((prev) => [...prev, move.san]);

      if (game.isCheckmate()) {
        const winner = game.turn() === "w" ? "Black" : "White";
        setGameOverMessage(`Checkmate! ${winner} wins.`);
      } else if (game.isStalemate()) {
        setGameOverMessage("Stalemate! It's a draw.");
      } else if (game.isInsufficientMaterial()) {
        setGameOverMessage("Draw!");
      }
    } else {
      alert(`Illegal move: ${to ? `${sanOrFrom} to ${to}` : sanOrFrom}`);
    }
    setSelected(null);
    setLegalMoves([]);
  };

  const undoLastMove = () => {
    if (moveHistory.length > 0) {
      game.undo();
      setBoard(game.board());
      setMoveHistory((prev) => prev.slice(0, -1));
      setSelected(null);
      setLegalMoves([]);
      setLastMove(null);
      setGameOverMessage(null);
    }
  };

  const undoAllMoves = () => {
    while (game.undo()) {}
    setBoard(game.board());
    setMoveHistory([]);
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setGameOverMessage(null);
  };

  return (
    <div className="chess-container">
      {gameOverMessage && (
        <GameOverModal
          message={gameOverMessage}
          onClose={() => setGameOverMessage(null)}
          onRestart={handleRestart}
        />
      )}

      <div className="board-column">
        <StyleSelectorControl
          styleName={styleName}
          availableStyles={availableStyles}
          onStyleSelect={handleStyleSelect}
          showStyleSelector={showStyleSelector}
          onShowStyleSelector={() => setShowStyleSelector(true)}
          onCloseStyleSelector={() => setShowStyleSelector(false)}
        />

        <Board
          board={board}
          selected={selected}
          legalMoves={legalMoves}
          lastMove={lastMove}
          onSquareClick={handleSquareClick}
          styleName={styleName}
          isLastMoveSquare={isLastMoveSquare}
        />

        <UndoControls
          onUndoLastMove={undoLastMove}
          onUndoAllMoves={undoAllMoves}
          canUndo={moveHistory.length > 0}
        />
      </div>

      <div className="history-column">
        <MoveHistory moveHistory={moveHistory} />
      </div>
    </div>
  );
};

export default ChessBoard;
