import { SITE_URL } from '$app/env/public';

export const prerender = true;

// Everything on the site may be read by anyone and anything.
export function GET() {
	const lines = ['User-agent: *', 'Allow: /'];
	if (SITE_URL) lines.push('', `Sitemap: ${SITE_URL}/sitemap.xml`);
	return new Response(lines.join('\n') + '\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
