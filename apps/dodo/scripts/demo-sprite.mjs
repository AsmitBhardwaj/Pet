// Demo: turn a few example "traits" (what the vision step will output) into
// sprites, validate them, and print the derived palettes.
//   node apps/dodo/scripts/demo-sprite.mjs   (or: npm run demo:sprite)
import { buildSprite, validateSprite } from 'sprite-core';

// Each of these is the kind of tiny JSON a vision model would extract from a
// pet photo. Note how little is needed — shade/light/outline are derived.
const examples = [
  { name: 'Goldie (golden retriever)', species: 'dog', baseCoat: '#e0a860', nose: '#2a1a10', eye: '#5a3a1a' },
  { name: 'Shadow (black lab)',        species: 'dog', baseCoat: '#2f2a27', nose: '#111111', eye: '#0d0d0d' },
  { name: 'Rusty (red setter)',        species: 'dog', baseCoat: '#a34a22', nose: '#241009', eye: '#3a1c0c' },
];

for (const traits of examples) {
  const sprite = buildSprite(traits);
  const { ok, errors } = validateSprite(sprite);
  const p = sprite.palette;
  console.log(`\n=== ${traits.name} ===`);
  console.log(`  valid: ${ok ? 'YES' : 'NO ' + JSON.stringify(errors)}`);
  console.log(`  coat  G=${p.G}  D(shade)=${p.D}  L(light)=${p.L}`);
  console.log(`  outline O=${p.O}   nose N=${p.N}   eye K=${p.K}`);
  console.log(`  grid ${sprite.grid.length} rows x ${sprite.grid[0].length} cols, anchors intact.`);
}

// Prove the base shape is unchanged across pets (so anchors always line up).
const a = buildSprite(examples[0]).grid.join('\n');
const b = buildSprite(examples[1]).grid.join('\n');
console.log(`\nbase shape identical across pets: ${a === b ? 'YES (anchors safe)' : 'NO'}`);
