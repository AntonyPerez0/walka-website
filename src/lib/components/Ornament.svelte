<script lang="ts">
	// The rule of the Share picture: a small cut gem between two fine lines,
	// each with a diamond stud. Decoration only - hidden from screen readers.
	let { width = '18rem' }: { width?: string } = $props();
</script>

<div class="ornament" style:--w={width} aria-hidden="true">
	<span class="line"></span>
	<svg width="26" height="26" viewBox="0 0 26 26" focusable="false">
		<path class="spark" d="M13 0 14.200 11.800 26 13 14.200 14.200 13 26 11.800 14.200 0 13 11.800 11.800z" />
		<path class="gem-a" d="M13 6.500 17.500 13 13 19.500 8.500 13z" />
		<path class="gem-b" d="M13 6.500 17.500 13 13 13z" />
		<path class="gem-c" d="M13 13 17.500 13 13 19.500z" />
	</svg>
	<span class="line"></span>
</div>

<style>
	.ornament {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		width: min(var(--w), 100%);
		margin-inline: auto;
	}

	.line {
		position: relative;
		flex: 1;
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--gold-soft));
	}

	.line:last-child {
		background: linear-gradient(270deg, transparent, var(--gold-soft));
	}

	/* the stud on each line */
	.line::after {
		content: '';
		position: absolute;
		top: 50%;
		right: 22%;
		width: 5px;
		height: 5px;
		background: var(--gold);
		transform: translate(50%, -50%) rotate(45deg);
	}

	.line:last-child::after {
		right: auto;
		left: 22%;
		transform: translate(-50%, -50%) rotate(45deg);
	}

	svg {
		flex: none;
	}

	.spark {
		fill: var(--gold);
		opacity: 0.55;
	}

	.gem-a {
		fill: var(--gem);
	}

	.gem-b {
		fill: #ffffff;
		opacity: 0.55;
	}

	.gem-c {
		fill: #000000;
		opacity: 0.18;
	}
</style>
