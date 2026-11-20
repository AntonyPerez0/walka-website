<script lang="ts" module>
	// The browser's own question "add this to the home screen?" (Chrome on
	// Android has one). It may come before the diary is on the screen, so it
	// is caught here, as soon as the page's code is loaded, and kept until
	// the person presses the button.
	type InstallQuestion = Event & { prompt(): Promise<unknown> };

	const CLOSED = 'walka-food-home-screen';

	function wasClosed(): boolean {
		try {
			return localStorage.getItem(CLOSED) === 'closed';
		} catch {
			return false;
		}
	}

	let question = $state.raw<InstallQuestion | null>(null);

	if (typeof window !== 'undefined') {
		window.addEventListener('beforeinstallprompt', (event) => {
			if (wasClosed()) return; // closed for good: the browser does what it does by itself
			event.preventDefault(); // not now, by itself: when the person presses the button
			question = event as InstallQuestion;
		});
		window.addEventListener('appinstalled', () => (question = null));
	}
</script>

<script lang="ts">
	// How to put the diary on the phone's home screen, said once and small.
	// Where the browser has its own question for that, a button asks it; on
	// an iPhone, which has none, the words say where to tap. Closed, it
	// stays closed on this device. A diary that is already opened from the
	// home screen says nothing.
	let iphone = $state(false);
	let closed = $state(true);

	$effect(() => {
		const standing = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
		closed = standing || wasClosed();
		// an iPhone or an iPad (which calls itself a Mac, but has a touch screen)
		const says = navigator.userAgent;
		iphone = /iphone|ipad|ipod/i.test(says) || (/macintosh/i.test(says) && navigator.maxTouchPoints > 1);
	});

	function close() {
		closed = true;
		question = null;
		try {
			localStorage.setItem(CLOSED, 'closed');
		} catch {
			// closed for now
		}
	}

	async function install() {
		const asked = question;
		await asked?.prompt().catch(() => {});
		close();
	}
</script>

{#if !closed && (question || iphone)}
	<aside class="hint" aria-label="The diary on your home screen">
		<div>
			<p class="title">The diary on your home screen</p>
			{#if question}
				<p>It opens like an app of its own, and without a connection too.</p>
			{:else}
				<p>Tap Share, then "Add to Home Screen". It opens like an app of its own, and without a connection too.</p>
			{/if}
		</div>
		<div class="panel-foot">
			{#if question}<button class="plain-button" type="button" onclick={install}>Add to home screen</button>{/if}
			<button class="link-button" type="button" onclick={close}>{question ? 'Not now' : 'Close'}</button>
		</div>
	</aside>
{/if}

<style>
	.hint {
		display: grid;
		gap: 0.75rem;
		padding: 1rem 1.1rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.55;
	}

	.title {
		color: var(--ink);
		font-weight: 600;
	}

	.link-button {
		min-height: 2.75rem;
	}
</style>
