import React from "react";

interface GameOverModalProps {
  message: string;
  onClose: () => void;
  onRestart: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ message, onClose, onRestart }) => {
  return (
    <div className="game-over-overlay" onClick={onClose}>
      <div className="game-over-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="close-modal-btn"
          onClick={onClose}
          aria-label="Close game over message"
        >
          &times;
        </button>
        <p className="game-over-text">{message}</p>
        <button className="restart-btn" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
