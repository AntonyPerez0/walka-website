import { SITE_URL } from '$app/env/public';
import { PAGE_PATHS } from '#lib/pages.ts';

export const prerender = true;

// The list of pages, for search engines. It needs full addresses, so it is
// only filled when the build knows the site's address (see src/env.ts).
export function GET() {
	const urls = SITE_URL ? PAGE_PATHS.map((path) => `\t<url><loc>${SITE_URL}/${path}</loc></url>`) : [];
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
	return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
