import React from "react";
import { getPieceFilename } from "./utils.ts";

type StyleSelectorProps = {
  availableStyles: string[];
  currentStyle: string;
  onSelect: (style: string) => void;
  onClose: () => void;
};

const StyleSelector: React.FC<StyleSelectorProps> = ({
  availableStyles,
  currentStyle,
  onSelect,
  onClose,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Select Piece Style</div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="style-grid">
          {availableStyles.map((style) => (
            <div
              key={style}
              className={`style-option ${style === currentStyle ? "selected" : ""}`}
              onClick={() => onSelect(style)}
            >
              <div className="preview-row">
                {["wp", "bp", "wq", "bq"].map((piece) => (
                  <img
                    key={piece}
                    src={`/pieces/${style}/${getPieceFilename(style, piece)}.svg`}
                    alt={piece}
                    className="preview-piece"
                    draggable={false}
                  />
                ))}
              </div>
              <div className="style-name">{style}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StyleSelector;
