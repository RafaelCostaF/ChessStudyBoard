import React from "react";
import { SquareCoords, MoveSquare } from "./types.ts";
import { getPieceFilename } from "./utils.ts";

type BoardProps = {
  board: any[][];
  selected: SquareCoords | null;
  legalMoves: MoveSquare[];
  lastMove: { from: string; to: string } | null;
  onSquareClick: (row: number, col: number) => void;
  styleName: string;
  isLastMoveSquare: (row: number, col: number) => boolean;
};

const files = "abcdefgh".split("");
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

const Board: React.FC<BoardProps> = ({
  board,
  selected,
  legalMoves,
  lastMove,
  onSquareClick,
  styleName,
  isLastMoveSquare,
}) => {
  return (
    <>
      <div className="board-with-labels">
        {/* Left side ranks */}
        <div className="rank-labels">
          {ranks.map((rank) => (
            <div key={rank} className="rank-label">
              {rank}
            </div>
          ))}
        </div>

        {/* Board grid */}
        <div className="board">
          {board.map((row, rowIndex) =>
            row.map((square, colIndex) => {
              const isBlack = (rowIndex + colIndex) % 2 === 1;
              const isSelected = selected?.row === rowIndex && selected?.col === colIndex;
              const currentSquare = toSquare(rowIndex, colIndex);
              const isLegalMove = legalMoves.includes(currentSquare);
              const isLast = isLastMoveSquare(rowIndex, colIndex);
              const piece = square ? `${square.color}${square.type}` : "";

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`square ${isBlack ? "black" : "white"} 
                    ${isSelected ? "selected" : ""}
                    ${isLegalMove ? "legal" : ""}
                    ${isLast ? "last-move" : ""}`}
                  onClick={() => onSquareClick(rowIndex, colIndex)}
                >
                  {piece && (
                    <img
                      src={`/pieces/${styleName}/${getPieceFilename(styleName, piece)}.svg`}
                      alt={piece}
                      className="piece"
                      draggable={false}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom files */}
      <div className="file-labels">
        {files.map((file) => (
          <div key={file} className="file-label">
            {file}
          </div>
        ))}
      </div>
    </>
  );
};

function toSquare(row: number, col: number): string {
  const files = "abcdefgh";
  return files[col] + (8 - row);
}

export default Board;
