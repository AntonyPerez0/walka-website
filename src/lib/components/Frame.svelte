<script lang="ts">
	// The frame of the Share picture, around what matters: a gold line with
	// its corners cut at 45 degrees, and a finer line inside it.
	//
	// Use it sparingly - a hero picture, the download panel. It is drawn with
	// four stacked shapes (line, fill, fine line, fill); nothing is an image.
	//
	//   <Frame>...</Frame>
	//   <Frame cut="clamp(14px, 2.4vw, 26px)" pad="clamp(1rem, 4vw, 3rem)" glow>...</Frame>
	//
	// Inside the frame, var(--frame-cut-inner) is the cut that a picture
	// lying against the inner line needs to follow the corners.
	import type { Snippet } from 'svelte';

	let {
		children,
		cut = 'clamp(14px, 2.2vw, 22px)',
		pad = '0px',
		glow = false,
		quiet = false,
		class: className = ''
	}: {
		children: Snippet;
		/** The size of the cut corners: any CSS length. */
		cut?: string;
		/** Space between the inner line and what is inside. */
		pad?: string;
		/** A soft light behind the frame. */
		glow?: boolean;
		/** One fine line only, for something less important. */
		quiet?: boolean;
		class?: string;
	} = $props();
</script>

<div class={['frame', className]} class:quiet style:--cut={cut} style:--pad={pad}>
	{#if glow}<span class="light" aria-hidden="true"></span>{/if}
	<div class="frame-inner">
		{@render children()}
	</div>
</div>

<style>
	.frame {
		--t: 2px; /* the outer line */
		--gap: 5px; /* between the two lines */
		--fill: var(--surface);
		position: relative;
		isolation: isolate;
	}

	.frame.quiet {
		--t: 1px;
	}

	/* A corner cut by --c, on a shape that lies --d inside the frame: the
	   cut shrinks by 0.586 of the distance, which keeps the line as thick on
	   the slant as on the straight. */
	.frame::before,
	.frame::after,
	.frame-inner::before,
	.frame-inner::after {
		--c: calc(var(--cut) - 0.586 * var(--d));
		content: '';
		position: absolute;
		inset: var(--d);
		z-index: -1;
		clip-path: polygon(
			var(--c) 0,
			calc(100% - var(--c)) 0,
			100% var(--c),
			100% calc(100% - var(--c)),
			calc(100% - var(--c)) 100%,
			var(--c) 100%,
			0 calc(100% - var(--c)),
			0 var(--c)
		);
	}

	/* From the back to the front: line, fill, fine line, fill. */
	.frame::before {
		--d: 0px;
		z-index: -4;
		background: var(--metal);
	}

	.frame::after {
		--d: var(--t);
		z-index: -3;
		background: var(--fill);
	}

	.frame-inner::before {
		--d: calc(var(--t) + var(--gap));
		z-index: -2;
		background: var(--gold-soft);
	}

	.frame-inner::after {
		--d: calc(var(--t) + var(--gap) + 1px);
		z-index: -1;
		background: var(--fill);
	}

	.frame.quiet::before {
		background: var(--gold-soft);
	}

	.frame.quiet .frame-inner::before,
	.frame.quiet .frame-inner::after {
		display: none;
	}

	.frame-inner {
		/* (No `position` here: its two shapes are placed against .frame.) */
		--frame-cut-inner: calc(var(--cut) - 0.586 * (var(--t) + var(--gap) + 1px));
		padding: calc(var(--t) + var(--gap) + 1px + var(--pad));
	}

	.frame.quiet .frame-inner {
		--frame-cut-inner: calc(var(--cut) - 0.586 * var(--t));
		padding: calc(var(--t) + var(--pad));
	}

	/* The light behind it: the shadow of a box that lies just inside the
	   frame, so that only its soft edge shows around it. (A shadow of a box
	   is cheap for a browser to draw; a filter on the whole frame is not.) */
	.light {
		position: absolute;
		inset: 3% 2% 1%;
		z-index: -5;
		border-radius: var(--cut);
		box-shadow:
			0 34px 70px var(--shadow),
			0 0 90px 6px var(--shadow-glow);
	}
</style>
