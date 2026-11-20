<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import Features from '#lib/components/home/Features.svelte';
	import GetWalka from '#lib/components/home/GetWalka.svelte';
	import Hero from '#lib/components/home/Hero.svelte';
	import HowBrief from '#lib/components/home/HowBrief.svelte';
	import OnlyListens from '#lib/components/home/OnlyListens.svelte';
	import PrivacyPromise from '#lib/components/home/PrivacyPromise.svelte';
	import ShareShowcase from '#lib/components/home/ShareShowcase.svelte';
</script>

<Seo
	home
	title="Walka - walk on your walking pad while you play"
	description="Walk on your walking pad while you play World of Warcraft. Walka counts your steps, miles and calories. Free. Experimental, and at your own risk."
/>

<Hero />
<Features />
<HowBrief />
<ShareShowcase />
<OnlyListens />
<PrivacyPromise />
<GetWalka />
