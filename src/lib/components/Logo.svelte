<script lang="ts">
	// Walka's mark, exactly as in Walka's own favicon and dashboard: a blue
	// tile, a white stride, the belt.
	let { size = 32 }: { size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
	<rect width="32" height="32" rx="8" fill="#256abf" />
	<path
		d="M8.2 15.6 12.4 8l3.6 5.6L19.6 9l4.2 6.6"
		fill="none"
		stroke="#ffffff"
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	<rect x="6" y="20" width="20" height="4.6" rx="2.3" fill="#ffffff" fill-opacity="0.55" />
</svg>
