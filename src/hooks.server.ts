import type { Handle } from '@sveltejs/kit/hooks';

// Runs while the pages are being made. The two fonts that the first screen
// is set in are fetched early, so the text does not change face after it
// has appeared. (Latin only: the other alphabets load when a page uses them.)
const EARLY_FONTS = /-latin-(wght|opsz|standard|[0-9]+)-normal\.woff2$/;

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, {
		preload: (file) => {
			if (file.type === 'font') return EARLY_FONTS.test(file.path) || EARLY_FONTS.test(file.filename);
			return file.type === 'js' || file.type === 'css';
		}
	});
