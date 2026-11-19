<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import Features from '#lib/components/home/Features.svelte';
	import GetWalka from '#lib/components/home/GetWalka.svelte';
	import Hero from '#lib/components/home/Hero.svelte';
	import HowBrief from '#lib/components/home/HowBrief.svelte';
	import PrivacyPromise from '#lib/components/home/PrivacyPromise.svelte';
	import ShareShowcase from '#lib/components/home/ShareShowcase.svelte';
	import Stopping from '#lib/components/home/Stopping.svelte';
</script>

<Seo
	home
	title="Walka - walk on your walking pad while you play"
	description="Walka links an under-desk walking pad to World of Warcraft. The belt follows your character: faster when it runs, slower when it stands still. Free."
/>

<Hero />
<Features />
<HowBrief />
<ShareShowcase />
<Stopping />
<PrivacyPromise />
<GetWalka />
