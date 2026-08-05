// Decorative pixel-art Dodo for the landing hero.
// This is a placeholder illustration — the real sprite-rendering module
// (ported from the Electron app) lands in a later phase.

const MAP = [
  "................",
  "...ee......ee...",
  "..egg......gge..",
  "..eggggggggggee.",
  "...gggggggggg...",
  "...ggkggggkgg...",
  "...gggggggggg...",
  "...ggwwkkwwgg...",
  "...ggwwppwwgg...",
  "....gggggggg....",
  "....gggggggg....",
  "....gwggggwg....",
  "....ww....ww....",
  "................",
];

const COLORS = {
  ".": "transparent",
  e: "#b06b18", // ears / darker gold
  g: "#e8a33d", // body gold
  k: "#2a2016", // eyes / nose
  w: "#fff4e4", // muzzle / paws
  p: "#e8738f", // tongue
};

export default function PixelDodo({ className = "" }) {
  const cols = MAP[0].length;
  const rows = MAP.length;
  return (
    <div
      role="img"
      aria-label="Pixel-art golden retriever"
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        aspectRatio: `${cols} / ${rows}`,
        imageRendering: "pixelated",
      }}
    >
      {MAP.flatMap((line, y) =>
        line.split("").map((ch, x) => (
          <div
            key={`${x}-${y}`}
            style={{ background: COLORS[ch] ?? "transparent" }}
          />
        ))
      )}
    </div>
  );
}
