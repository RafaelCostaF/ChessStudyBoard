import React, { useEffect, useRef, useState } from "react";
import "./MoveHistory.css";


type MoveHistoryProps = {
  moveHistory: string[];
};

const MoveHistory: React.FC<MoveHistoryProps> = ({ moveHistory }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const chunkMoves = (moves: string[]): string[][] => {
    const chunks: string[][] = [];
    for (let i = 0; i < moves.length; i += 2) {
      chunks.push([moves[i], moves[i + 1]]);
    }
    return chunks;
  };

  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moveHistory, isAutoScroll]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 5;
    setIsAutoScroll(isAtBottom);
  };

  return (
    <div className="sidebar">
      <h3>Move History</h3>
      <div
        className="move-scroll-area"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <ol className="move-list">
          {chunkMoves(moveHistory).map((pair, idx) => (
            <li key={idx}>
              <strong>{idx + 1}.</strong> {pair[0] || ""} {pair[1] || ""}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default MoveHistory;
