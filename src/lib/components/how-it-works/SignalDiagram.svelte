<script lang="ts">
	// How the signal travels, as a drawing: the flowchart of Walka's README,
	// with its three boxes, its four arrows and their labels word for word.
	// The arrows carry the numbers of the four steps that the page lists
	// under the drawing.
	//
	// It is drawn twice: lying down for a wide column, and standing up for a
	// narrow one (text inside an SVG cannot wrap, so one drawing cannot do
	// both). The column's own width decides which one shows. Colours are the
	// site's tokens, so it is right in both lights.
	import Icon from '#lib/components/Icon.svelte';
	import type { IconName } from '#lib/components/Icon.svelte';

	const ALT =
		'A drawing with three boxes and four numbered arrows. ' +
		'1, from the Walka addon, in the game, to Walka.exe (Walka on a Mac), on your computer: draws a strip of squares; Walka reads it off the screen. ' +
		'2, from Walka.exe to the walking pad: Bluetooth: belt speed. ' +
		'3, from the walking pad to Walka.exe: speed, distance. ' +
		'4, a dotted line from Walka.exe to the addon: a file the game loads at login. ' +
		'No other arrow points at the game.';

	type Box = {
		x: number;
		y: number;
		w: number;
		h: number;
		/** Walka's own two pieces get the gold line; the pad is not Walka's. */
		walka: boolean;
		icon: IconName | 'pad';
		/** Where the icon's top-left corner is. */
		at: [number, number];
		/** Lines of text: [class, x, y, words]. */
		text: [string, number, number, string][];
	};

	type Arrow = {
		n: number;
		/** The line, and the head at its end. */
		d: string;
		head: string;
		dotted?: boolean;
		/** The middle of the numbered stud. */
		stud: [number, number];
		/** The label: where its first line sits, and its lines. */
		label: { x: number; y: number; lines: string[] };
	};

	// A box with its corners cut at 45 degrees, as the site's frames are.
	const cut = (b: Box, c = 12) =>
		[
			[b.x + c, b.y],
			[b.x + b.w - c, b.y],
			[b.x + b.w, b.y + c],
			[b.x + b.w, b.y + b.h - c],
			[b.x + b.w - c, b.y + b.h],
			[b.x + c, b.y + b.h],
			[b.x, b.y + b.h - c],
			[b.x, b.y + c]
		]
			.map((p) => p.join(','))
			.join(' ');

	// ---- lying down: 820 by 284 -------------------------------------------
	// The way out runs over the top, left to right; the way back runs under
	// the boxes, right to left.
	const WIDE_BOXES: Box[] = [
		{
			x: 1, y: 92, w: 198, h: 120, walka: true, icon: 'addon', at: [87, 116],
			text: [['t', 100, 166, 'Walka addon'], ['s', 100, 186, 'in the game']]
		},
		{
			x: 311, y: 92, w: 198, h: 120, walka: true, icon: 'window', at: [397, 107],
			text: [['t', 410, 157, 'Walka.exe'], ['p', 410, 176, '(Walka on a Mac)'], ['s', 410, 194, 'on your computer']]
		},
		{
			x: 621, y: 92, w: 198, h: 120, walka: false, icon: 'pad', at: [707, 125],
			text: [['t', 720, 176, 'Walking pad']]
		}
	];

	const WIDE_ARROWS: Arrow[] = [
		{
			n: 1, d: 'M145 92V72l10-10h200l10 10v13', head: 'M365 92l-5-9h10z', stud: [255, 62],
			label: { x: 255, y: 18, lines: ['draws a strip of squares;', 'Walka reads it off the screen'] }
		},
		{
			n: 2, d: 'M455 92V72l10-10h200l10 10v13', head: 'M675 92l-5-9h10z', stud: [565, 62],
			label: { x: 565, y: 36, lines: ['Bluetooth: belt speed'] }
		},
		{
			n: 3, d: 'M675 212v20l-10 10H465l-10-10v-13', head: 'M455 212l-5 9h10z', stud: [565, 242],
			label: { x: 565, y: 274, lines: ['speed, distance'] }
		},
		{
			n: 4, d: 'M365 212v20l-10 10H155l-10-10v-13', head: 'M145 212l-5 9h10z', dotted: true, stud: [255, 242],
			label: { x: 255, y: 274, lines: ['a file the game loads at login'] }
		}
	];

	// ---- standing up: 350 by 446 --------------------------------------------
	// The way down runs along the left, the way back up along the right.
	const TALL_BOXES: Box[] = [
		{
			x: 1, y: 1, w: 348, h: 76, walka: true, icon: 'addon', at: [22, 26],
			text: [['t', 64, 35, 'Walka addon'], ['s', 64, 55, 'in the game']]
		},
		{
			x: 1, y: 201, w: 348, h: 76, walka: true, icon: 'window', at: [22, 226],
			text: [['t', 64, 235, 'Walka.exe'], ['p', 143, 235, '(Walka on a Mac)'], ['s', 64, 255, 'on your computer']]
		},
		{
			x: 1, y: 369, w: 348, h: 76, walka: false, icon: 'pad', at: [22, 394],
			text: [['t', 64, 412.5, 'Walking pad']]
		}
	];

	const TALL_ARROWS: Arrow[] = [
		{
			n: 1, d: 'M44 77v117', head: 'M44 201l-5-9h10z', stud: [44, 139],
			label: { x: 67, y: 118, lines: ['draws a strip of', 'squares; Walka', 'reads it off the', 'screen'] }
		},
		{
			n: 4, d: 'M214 201V84', head: 'M214 77l-5 9h10z', dotted: true, stud: [214, 139],
			label: { x: 237, y: 135, lines: ['a file the game', 'loads at login'] }
		},
		{
			n: 2, d: 'M44 277v85', head: 'M44 369l-5-9h10z', stud: [44, 323],
			label: { x: 67, y: 319, lines: ['Bluetooth:', 'belt speed'] }
		},
		{
			n: 3, d: 'M214 369v-85', head: 'M214 277l-5 9h10z', stud: [214, 323],
			label: { x: 237, y: 327.5, lines: ['speed, distance'] }
		}
	];

	const LAYOUTS = [
		{ name: 'wide', viewBox: '0 0 820 284', boxes: WIDE_BOXES, arrows: WIDE_ARROWS },
		{ name: 'tall', viewBox: '0 0 350 446', boxes: TALL_BOXES, arrows: TALL_ARROWS }
	];
</script>

<figure class="signal">
	<div class="drawing" role="img" aria-label={ALT}>
		{#each LAYOUTS as layout (layout.name)}
			<svg class={layout.name} viewBox={layout.viewBox} aria-hidden="true" focusable="false">
				{#each layout.arrows as arrow (arrow.n)}
					<path class="flow" class:dotted={arrow.dotted} d={arrow.d} />
					<path class="head" d={arrow.head} />
				{/each}

				{#each layout.boxes as box (box.icon)}
					<polygon class="box" class:walka={box.walka} points={cut(box)} />
					<g class="icon" class:walka={box.walka} transform="translate({box.at[0]} {box.at[1]})">
						{#if box.icon === 'pad'}
							<!-- a walking pad: the belt, and the way it runs -->
							<svg
								width="26"
								height="26"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.75"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<rect x="2.5" y="12.5" width="19" height="6" rx="3" />
								<path d="M6.5 15.5h.01M17.5 15.5h.01" />
								<path d="M7 7.5h10m0 0-2.8-2.8M17 7.5l-2.8 2.8" />
							</svg>
						{:else}
							<Icon name={box.icon} size={26} />
						{/if}
					</g>
					{#each box.text as [kind, x, y, words] (words)}
						<text class={kind} class:centre={layout.name === 'wide'} {x} {y}>{words}</text>
					{/each}
				{/each}

				{#each layout.arrows as arrow (arrow.n)}
					<g transform="translate({arrow.stud[0]} {arrow.stud[1]})">
						<rect class="stud" x="-8.5" y="-8.5" width="17" height="17" transform="rotate(45)" />
						<text class="n" y="4">{arrow.n}</text>
					</g>
					<text class="l" class:centre={layout.name === 'wide'} x={arrow.label.x} y={arrow.label.y}>
						{#each arrow.label.lines as line, i (line)}
							<tspan x={arrow.label.x} dy={i === 0 ? 0 : 17}>{line}</tspan>
						{/each}
					</text>
				{/each}
			</svg>
		{/each}
	</div>
	<figcaption>The numbers are the four steps below. The dotted line is the file.</figcaption>
</figure>

<style>
	/* The figure's own width decides which drawing shows. */
	.signal {
		container-type: inline-size;
	}

	/* (By class: the small drawing of the pad inside is an <svg> too.) */
	.wide,
	.tall {
		width: 100%;
		height: auto;
		overflow: visible;
	}

	/* Standing up, unless there is room to lie down. */
	.wide {
		display: none;
	}

	.tall {
		max-width: 22rem;
		margin-inline: auto;
	}

	@container (min-width: 42rem) {
		.wide {
			display: block;
		}

		.tall {
			display: none;
		}
	}

	.box {
		fill: var(--surface);
		stroke: var(--line-strong);
		stroke-width: 1;
	}

	.box.walka {
		stroke: var(--gold-soft);
		stroke-width: 1.25;
	}

	.icon {
		color: var(--ink-3);
	}

	.icon.walka {
		color: var(--gold);
	}

	text {
		font-family: var(--font-text);
		fill: var(--ink-2);
	}

	.centre {
		text-anchor: middle;
	}

	.t {
		fill: var(--ink);
		font-size: 15.5px;
		font-weight: 600;
		letter-spacing: -0.005em;
	}

	.p {
		font-size: 13px;
	}

	.s {
		fill: var(--ink-3);
		font-size: 13px;
	}

	.l {
		font-size: 13px;
	}

	.flow {
		fill: none;
		stroke: var(--accent);
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.flow.dotted {
		stroke-dasharray: 1.5 6;
	}

	.head {
		fill: var(--accent);
	}

	/* a numbered stud, as the Share picture marks every tenth level */
	.stud {
		fill: var(--bg);
		stroke: var(--gold);
		stroke-width: 1.25;
	}

	.n {
		fill: var(--gold);
		font-size: 11px;
		font-weight: 700;
		text-anchor: middle;
	}

	figcaption {
		margin-top: 1.1rem;
		color: var(--ink-3);
		font-size: var(--text-fine);
		text-align: center;
	}
</style>
