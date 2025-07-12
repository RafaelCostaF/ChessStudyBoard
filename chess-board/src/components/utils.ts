export function getPieceFilename(styleName: string, piece: string): string {
  if (styleName === "mono") {
    const pieceMap: Record<string, string> = {
      wp: "P",
      wr: "R",
      wn: "N",
      wb: "B",
      wq: "Q",
      wk: "K",
      bp: "p",
      br: "r",
      bn: "n",
      bb: "b",
      bq: "q",
      bk: "k",
    };
    return pieceMap[piece] || piece;
  }
  return piece;
}

export function toSquare(row: number, col: number): string {
  const files = "abcdefgh";
  return files[col] + (8 - row);
}
