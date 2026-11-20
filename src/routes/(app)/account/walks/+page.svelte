<script lang="ts">
	// The walks of an account: totals, adding walks from Walka's files or by
	// hand, and the list. Everything is in Walks.svelte, which <Gate> shows
	// once somebody is signed in and has taken the first step.
	import Gate from '#lib/components/account/Gate.svelte';
	import Walks from '#lib/components/account/walks/Walks.svelte';
	import Seo from '#lib/components/Seo.svelte';
</script>

<Seo title="Your walks" description="The walks kept in your Walka account." />

<Gate>
	<Walks />
</Gate>
