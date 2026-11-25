<script lang="ts">
	// The stats of an account's walks: totals by day, week and month, records
	// and habits. Everything is in Stats.svelte, which <Gate> shows once
	// somebody is signed in and has taken the first step.
	import Gate from '#lib/components/account/Gate.svelte';
	import Stats from '#lib/components/account/stats/Stats.svelte';
	import Seo from '#lib/components/Seo.svelte';
</script>

<Seo title="Your stats" description="Everything your Walka account holds about your walking, added up: totals, charts, records and habits." />

<Gate>
	<Stats />
</Gate>
