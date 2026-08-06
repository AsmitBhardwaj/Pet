// sprite-data.js — SPRITE pixel grids per species/shape + fixed interaction
// anchors. Framework-agnostic data only (no DOM/Electron/Next).

// The sitting-dog base shape. This is the silhouette + feature layout; colors
// come entirely from the palette. 32x36 grid.
export const BASE_DOG = [
  '................................',
  '..............OOOO..............',
  '............OOGGGGOO............',
  '...OO......OGGGGGGGGO......OO...',
  '..ODDO....OGGGGGGGGGGO....ODDO..',
  '.ODDDDO..OGGGGGGGGGGGGO..ODDDDO.',
  '.ODDDDDO.OGGGGGGGGGGGGO.ODDDDDO.',
  '.ODDDDDDOGGGGGGGGGGGGGGODDDDDDO.',
  '.ODDDDDGGGGGGGGGGGGGGGGGGDDDDDO.',
  '.ODDDDGGGGGGGGGGGGGGGGGGGGDDDDO.',
  '.ODDDGGGGWWWGGGGGGGGWWWGGGDDDO..',
  '..ODDGGGGWKWGGGGGGGGWKWGGGDDO...',
  '..ODDGGGGWWWGGGGGGGGWWWGGGDDO...',
  '..OGGGGGGGGGGGGGGGGGGGGGGGGGO...',
  '..OGGGGGGGGGGGLLLLGGGGGGGGGGO...',
  '...OGGGGGGGGGLLLLLLGGGGGGGGO....',
  '...OGGGGGGGGGLLNNLLGGGGGGGGO....',
  '...OGGGGGGGGGGLNNLGGGGGGGGGO....',
  '....OGGGGGGGGGLLLLGGGGGGGGO.....',
  '....OGGGGGGGGGGPPPPGGGGGGGO.....',
  '.....OGGGGGGGGGGGGGGGGGGGO......',
  '.....OLLGGGGGGGGGGGGGGGLLO......',
  '....OLLLLLGGGGGGGGGGGLLLLLO.....',
  '...OLLLLLLLLLLLLLLLLLLLLLLLO....',
  '..ODLLLLLLLLLLLLLLLLLLLLLLLDO...',
  '..ODDLLLLLLLLLLLLLLLLLLLLLLDDO..',
  '.ODDDLLLLLLLLLLLLLLLLLLLLLDDDO..',
  '.ODDDDDLLLLLLLLLLLLLLLLLLDDDDO..',
  '.ODDDDDDLLLLLLLLLLLLLLLLDDDDDO..',
  '.ODDDDDDGGGGGGGGGGGGGGGGDDDDDO..',
  '.ODDDDDGGGGGGGGGGGGGGGGGGDDDDO..',
  '..ODDDOGGGGGGGGGGGGGGGGGGODDDO..',
  '...OOO.OGGGGGGGGGGGGGGGGO.OOO...',
  '.......OGGGOGGGGGGGGOGGGO.......',
  '.......OOOOO......OOOOOO........',
  '................................',
];

export const GRID_W = 32;
export const GRID_H = 36;

// Fixed interaction anchors (must survive any recolor).
export const ANCHORS = {
  eyes: [
    { x: 9, y: 10 },
    { x: 19, y: 10 },
  ],
  mouth: { x: 15, y: 19 },
};

// Which palette letters are "coat" (get tinted by typing-heat in the app).
export const TINTABLE = ['G', 'L', 'D'];

export function baseGridFor(species) {
  // Only the dog base exists today; cat/other come later.
  return BASE_DOG;
}
