import React from "react";

interface UndoControlsProps {
  onUndoLastMove: () => void;
  onUndoAllMoves: () => void;
  canUndo: boolean;
}

const UndoControls: React.FC<UndoControlsProps> = ({ onUndoLastMove, onUndoAllMoves, canUndo }) => {
  return (
    <div className="undo-buttons">
      <button onClick={onUndoLastMove} disabled={!canUndo}>
        Undo Last Move
      </button>
      <button onClick={onUndoAllMoves} disabled={!canUndo}>
        Undo All Moves
      </button>
    </div>
  );
};

export default UndoControls;
