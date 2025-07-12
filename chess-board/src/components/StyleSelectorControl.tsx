import React from "react";
import StyleSelector from "./StyleSelector.tsx";
import { getPieceFilename } from "./utils.ts";

interface StyleSelectorControlProps {
  styleName: string;
  availableStyles: string[];
  onStyleSelect: (style: string) => void;
  showStyleSelector: boolean;
  onShowStyleSelector: () => void;
  onCloseStyleSelector: () => void;
}

const StyleSelectorControl: React.FC<StyleSelectorControlProps> = ({
  styleName,
  availableStyles,
  onStyleSelect,
  showStyleSelector,
  onShowStyleSelector,
  onCloseStyleSelector,
}) => {
  return (
    <div className="top-bar">
      <button className="change-style-btn full-width" onClick={onShowStyleSelector}>
        Choose pieces style
        <img
          src={`/pieces/${styleName}/${getPieceFilename(styleName, "wn")}.svg`}
          alt="Knight"
          className="knight-icon"
          draggable={false}
        />
      </button>
      {showStyleSelector && (
        <StyleSelector
          availableStyles={availableStyles}
          currentStyle={styleName}
          onSelect={onStyleSelect}
          onClose={onCloseStyleSelector}
        />
      )}
    </div>
  );
};

export default StyleSelectorControl;
