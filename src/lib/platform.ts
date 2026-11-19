// Which download to put first. A guess from what the browser says about the
// computer - never sent anywhere, and every download stays one click away.

export type Platform = 'windows' | 'mac' | 'other';

export function detectPlatform(): Platform {
	if (typeof navigator === 'undefined') return 'other';
	const hinted = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform;
	const text = `${hinted ?? ''} ${navigator.platform ?? ''} ${navigator.userAgent ?? ''}`.toLowerCase();
	// A phone or a tablet runs neither download.
	if (/android|iphone|ipad|ipod/.test(text) || (/mac/.test(text) && navigator.maxTouchPoints > 1)) return 'other';
	if (/win/.test(text)) return 'windows';
	if (/mac/.test(text)) return 'mac';
	return 'other';
}
