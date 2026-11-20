// Makes the PNG icons in static/ from Walka's mark. They are in git: run
// this again (node scripts/icons.mjs) only if the mark changes.
//
//   favicon-32.png         32   the tab's icon, for a browser that does not take the SVG
//   apple-touch-icon.png   180  the icon on an iPhone's home screen
//   icon-192.png, icon-512.png  the icons of the installed web app
//   icon-maskable-512.png  the same with room around it, for Android's shapes

import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const out = (name) => fileURLToPath(new URL(`../static/${name}`, import.meta.url));

// The mark is the one in Walka's own favicon: a blue tile, a white stride, the belt.
const mark = (size, { scale = 1, radius = 8 } = {}) => {
	const inner = 32 * scale;
	const offset = (32 - inner) / 2;
	return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="${radius}" fill="#256abf"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="M8.2 15.6 12.4 8l3.6 5.6L19.6 9l4.2 6.6" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="6" y="20" width="20" height="4.6" rx="2.3" fill="#ffffff" fill-opacity="0.55"/>
  </g>
</svg>`);
};

await sharp(mark(32)).png().toFile(out('favicon-32.png'));
await sharp(mark(180, { radius: 0 })).png().toFile(out('apple-touch-icon.png'));
await sharp(mark(192)).png().toFile(out('icon-192.png'));
await sharp(mark(512)).png().toFile(out('icon-512.png'));
await sharp(mark(512, { radius: 0, scale: 0.72 })).png().toFile(out('icon-maskable-512.png'));
console.log('icons: written to static/');
