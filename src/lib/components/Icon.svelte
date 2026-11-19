<script lang="ts" module>
	// The site's icons. All of them are drawn for Walka: simple lines on a
	// 24-unit grid, in the manner of the dashboard's own.
	const ICONS = {
		download: '<path d="M12 4v11m0 0-4.2-4.2M12 15l4.2-4.2"/><path d="M5 19.5h14"/>',
		arrow: '<path d="M5 12h14m0 0-5-5m5 5-5 5"/>',
		external: '<path d="M9 6H6.5A1.5 1.5 0 0 0 5 7.5v10A1.5 1.5 0 0 0 6.5 19h10a1.5 1.5 0 0 0 1.500-1.500V15"/><path d="M13 5h6v6m0-6-8.5 8.5"/>',
		sun: '<circle cx="12" cy="12" r="3.6"/><path d="M12 3v2.2M12 18.800V21M3 12h2.2M18.800 12H21M5.600 5.600l1.600 1.600M16.800 16.800l1.600 1.600M5.600 18.400l1.600-1.600M16.800 7.200l1.600-1.600"/>',
		moon: '<path d="M19.500 14.200A7.800 7.800 0 0 1 9.800 4.500a7.800 7.800 0 1 0 9.700 9.700z"/>',
		menu: '<path d="M4.500 7.500h15M4.500 12h15M4.500 16.500h15"/>',
		close: '<path d="m6.500 6.500 11 11m0-11-11 11"/>',
		check: '<path d="m5.500 12.500 4.200 4.200 8.800-9.400"/>',
		chevron: '<path d="m8 10 4 4 4-4"/>',
		// the six things you get
		stride: '<path d="M6.500 16.500 10 9l3.200 4.800L16 10.500l2.500 4"/><path d="M4.500 19.500h15"/>',
		stop: '<path d="M8.700 3.500h6.600l4.700 4.700v6.600l-4.700 4.700H8.700L4 14.800V8.200z"/><rect x="9.500" y="9.500" width="5" height="5" rx="0.800"/>',
		count: '<path d="M6 19v-5m6 5V6m6 13v-8"/><path d="M3.500 21h17"/>',
		road: '<path d="M7 20c0-4 10-4 10-8s-10-3-10-7"/><circle cx="7" cy="4.500" r="1.400"/><path d="m17 17.500 2 2.500-2 2.500-2-2.500z" transform="translate(0 -3)"/>',
		picture: '<path d="M7.500 4h9L20 7.500v9L16.500 20h-9L4 16.500v-9z"/><path d="m12 8.500 1.100 2.400 2.400 1.100-2.400 1.100L12 15.500l-1.100-2.400-2.400-1.100 2.400-1.100z"/>',
		home: '<rect x="3.500" y="5" width="17" height="11.500" rx="1.800"/><path d="M8.500 20h7M12 16.500V20"/><path d="M10 11.800v-1.300a2 2 0 0 1 4 0v1.300"/><rect x="9.300" y="11.300" width="5.400" height="3.200" rx="0.700"/>',
		// around the downloads
		window: '<rect x="3.500" y="4.500" width="17" height="15" rx="2"/><path d="M3.500 9h17"/><path d="M6.500 6.800h.01M9 6.800h.01"/>',
		laptop: '<rect x="5" y="5" width="14" height="10" rx="1.600"/><path d="M2.500 18.500h19"/>',
		addon: '<path d="M12 3.500 19.500 8v8L12 20.500 4.500 16V8z"/><path d="M4.800 8.200 12 12.500l7.200-4.300M12 12.500v8"/>',
		shield: '<path d="M12 3.500 19 6v5.500c0 4.300-2.900 7.400-7 9-4.100-1.600-7-4.700-7-9V6z"/><path d="m9 12 2.200 2.200L15.200 10"/>',
		info: '<circle cx="12" cy="12" r="8.500"/><path d="M12 11v5.200"/><path d="M12 7.700h.01"/>',
		warning: '<path d="M12 4 21 19.500H3z"/><path d="M12 10v4.500"/><path d="M12 17h.01"/>',
		bluetooth: '<path d="m7.500 8 9 8-4.500 4V4l4.500 4-9 8"/>',
		eye: '<path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z"/><circle cx="12" cy="12" r="2.800"/>',
		heart: '<path d="M12 19.500s-7-4.200-7-9.300A3.900 3.900 0 0 1 12 8a3.900 3.900 0 0 1 7 2.200c0 5.100-7 9.300-7 9.300z"/>',
		key: '<rect x="3.500" y="6.500" width="17" height="11" rx="2"/><path d="M7 10h.01M10.300 10h.01M13.700 10h.01M17 10h.01M7.500 14h9"/>'
	} as const;

	export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
	let { name, size = 24, stroke = 1.75 }: { name: IconName; size?: number; stroke?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	focusable="false"
>
	{@html ICONS[name]}
</svg>
