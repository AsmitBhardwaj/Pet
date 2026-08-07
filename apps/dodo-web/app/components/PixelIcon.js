// Monochrome 1-bit pixel-art glyphs, hand-drawn on an 8x8 grid to match the
// blocky sprite aesthetic. '#' = filled pixel (currentColor), '.' = empty.
// Rendered as crisp SVG rects so they scale without smoothing.

export const ICONS = {
  // "Made from your photo" — camera
  camera: [
    "...##...",
    "..####..",
    "########",
    "#..##..#",
    "#.####.#",
    "#.####.#",
    "#..##..#",
    "########",
  ],
  // "Private by design" — padlock
  lock: [
    "..####..",
    ".#....#.",
    ".#....#.",
    "########",
    "##....##",
    "##.##.##",
    "##..#.##",
    "########",
  ],
  // "Actually alive" — paw print
  paw: [
    ".#....#.",
    "##.##.##",
    "##.##.##",
    "........",
    "..####..",
    ".######.",
    ".######.",
    "..####..",
  ],
  // "Free to start" — coin
  coin: [
    "..####..",
    ".######.",
    "##.##.##",
    "###..###",
    "###..###",
    "##.##.##",
    ".######.",
    "..####..",
  ],
};

export default function PixelIcon({ name, className = "" }) {
  const map = ICONS[name];
  if (!map) return null;
  const rows = map.length;
  const cols = map[0].length;
  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      className={className}
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {map.flatMap((line, y) =>
        line.split("").map((ch, x) =>
          ch === "#" ? (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
          ) : null
        )
      )}
    </svg>
  );
}
