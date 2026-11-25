<script lang="ts">
	// The pages of an account, as tabs along the top of each.
	import { resolve } from '$app/paths';

	let { current }: { current: 'account' | 'walks' | 'stats' | 'food' } = $props();
</script>

<nav class="tabs" aria-label="Your account">
	<a href={resolve('account/')} aria-current={current === 'account' ? 'page' : undefined}>Account</a>
	<a href={resolve('account/walks/')} aria-current={current === 'walks' ? 'page' : undefined}>Walks</a>
	<a href={resolve('account/stats/')} aria-current={current === 'stats' ? 'page' : undefined}>Stats</a>
	<a href={resolve('food/')} aria-current={current === 'food' ? 'page' : undefined}>Food</a>
</nav>
