<script lang="ts">
	// The sky behind a hero: soft lights, a scatter of small stars and two
	// faint arcs - the backdrop of the Share picture. All of it is drawn here;
	// it is decoration, and hidden from screen readers.
	//
	// (The stars are a fixed scatter: the same on every page and every build,
	// and thin in the middle, where the words stand.)
	let { quiet = false }: { quiet?: boolean } = $props();
</script>

<div class="sky" class:quiet aria-hidden="true">
	<svg class="stars" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMin slice" focusable="false">
		<g class="arcs" fill="none">
			<circle cx="800" cy="-420" r="760" />
			<circle cx="800" cy="-420" r="1010" />
		</g>
		<g class="dots">
			<circle cx="809" cy="798" r="1.2" opacity="0.68"/>
			<circle cx="99" cy="690" r="0.84" opacity="0.49"/>
			<circle cx="503" cy="798" r="1.45" opacity="0.31"/>
			<circle cx="1322" cy="33" r="0.63" opacity="0.68"/>
			<circle cx="815" cy="683" r="0.72" opacity="0.28"/>
			<circle cx="522" cy="864" r="1.1" opacity="0.63"/>
			<circle cx="394" cy="856" r="0.58" opacity="0.56"/>
			<circle cx="1376" cy="0" r="0.96" opacity="0.7"/>
			<circle cx="449" cy="549" r="0.61" opacity="0.4"/>
			<circle cx="1403" cy="19" r="1.41" opacity="0.39"/>
			<circle cx="1490" cy="873" r="0.6" opacity="0.64"/>
			<circle cx="552" cy="591" r="0.66" opacity="0.3"/>
			<circle cx="62" cy="242" r="1.1" opacity="0.74"/>
			<circle cx="1350" cy="86" r="1.24" opacity="0.75"/>
			<circle cx="1036" cy="38" r="0.53" opacity="0.5"/>
			<circle cx="828" cy="9" r="1.2" opacity="0.73"/>
			<circle cx="1517" cy="299" r="0.64" opacity="0.38"/>
			<circle cx="45" cy="337" r="1.12" opacity="0.58"/>
			<circle cx="1118" cy="861" r="0.69" opacity="0.58"/>
			<circle cx="82" cy="218" r="0.82" opacity="0.29"/>
			<circle cx="213" cy="166" r="1.43" opacity="0.49"/>
			<circle cx="1562" cy="29" r="1.29" opacity="0.4"/>
			<circle cx="230" cy="40" r="0.62" opacity="0.7"/>
			<circle cx="1212" cy="299" r="0.8" opacity="0.34"/>
			<circle cx="990" cy="20" r="0.5" opacity="0.4"/>
			<circle cx="1446" cy="760" r="0.55" opacity="0.55"/>
			<circle cx="441" cy="285" r="0.8" opacity="0.4"/>
			<circle cx="1411" cy="269" r="0.65" opacity="0.75"/>
			<circle cx="1539" cy="854" r="1.11" opacity="0.32"/>
			<circle cx="1377" cy="528" r="0.89" opacity="0.56"/>
			<circle cx="398" cy="91" r="0.97" opacity="0.52"/>
			<circle cx="394" cy="790" r="1.17" opacity="0.68"/>
			<circle cx="1543" cy="356" r="1.13" opacity="0.77"/>
			<circle cx="84" cy="871" r="0.82" opacity="0.54"/>
			<circle cx="888" cy="887" r="1.05" opacity="0.39"/>
			<circle cx="1429" cy="726" r="0.64" opacity="0.51"/>
			<circle cx="513" cy="473" r="0.73" opacity="0.36"/>
			<circle cx="170" cy="518" r="1.03" opacity="0.45"/>
			<circle cx="1379" cy="332" r="0.69" opacity="0.69"/>
			<circle cx="1565" cy="219" r="0.66" opacity="0.74"/>
			<circle cx="1136" cy="320" r="0.8" opacity="0.3"/>
			<circle cx="339" cy="77" r="0.65" opacity="0.81"/>
			<circle cx="73" cy="118" r="1.27" opacity="0.69"/>
			<circle cx="8" cy="298" r="1.22" opacity="0.36"/>
			<circle cx="212" cy="778" r="1.25" opacity="0.79"/>
			<circle cx="985" cy="716" r="1.0" opacity="0.8"/>
			<circle cx="777" cy="652" r="0.93" opacity="0.5"/>
			<circle cx="306" cy="390" r="1.5" opacity="0.51"/>
			<circle cx="406" cy="714" r="1.31" opacity="0.8"/>
			<circle cx="61" cy="516" r="1.47" opacity="0.51"/>
			<circle cx="1364" cy="186" r="0.74" opacity="0.5"/>
			<circle cx="198" cy="583" r="0.68" opacity="0.28"/>
			<circle cx="1418" cy="723" r="1.2" opacity="0.83"/>
			<circle cx="185" cy="221" r="0.78" opacity="0.71"/>
			<circle cx="575" cy="881" r="0.91" opacity="0.65"/>
			<circle cx="819" cy="802" r="0.56" opacity="0.53"/>
			<circle cx="658" cy="682" r="1.19" opacity="0.64"/>
			<circle cx="16" cy="488" r="1.47" opacity="0.76"/>
			<circle cx="1311" cy="421" r="1.2" opacity="0.26"/>
			<circle cx="66" cy="66" r="0.84" opacity="0.77"/>
			<circle cx="31" cy="203" r="0.7" opacity="0.5"/>
			<circle cx="1529" cy="110" r="0.87" opacity="0.72"/>
			<circle cx="673" cy="888" r="1.49" opacity="0.28"/>
			<circle cx="395" cy="66" r="0.64" opacity="0.79"/>
		</g>
		<g class="sparks">
			<path d="M72 532.3L72.52 535.48L75.7 536L72.52 536.52L72 539.7L71.48 536.52L68.3 536L71.48 535.48Z" opacity="0.58"/>
			<path d="M177 288.1L177.83 293.17L182.9 294L177.83 294.83L177 299.9L176.17 294.83L171.1 294L176.17 293.17Z" opacity="0.76"/>
			<path d="M1231 97.3L1231.52 100.48L1234.7 101L1231.52 101.52L1231 104.7L1230.48 101.52L1227.3 101L1230.48 100.48Z" opacity="0.79"/>
			<path d="M1382 485.2L1382.95 491.05L1388.8 492L1382.95 492.95L1382 498.8L1381.05 492.95L1375.2 492L1381.05 491.05Z" opacity="0.4"/>
			<path d="M180 333.4L180.92 339.08L186.6 340L180.92 340.92L180 346.6L179.08 340.92L173.4 340L179.08 339.08Z" opacity="0.83"/>
			<path d="M1311 346.9L1311.57 350.43L1315.1 351L1311.57 351.57L1311 355.1L1310.43 351.57L1306.9 351L1310.43 350.43Z" opacity="0.8"/>
			<path d="M1345 137.6L1345.62 141.38L1349.4 142L1345.62 142.62L1345 146.4L1344.38 142.62L1340.6 142L1344.38 141.38Z" opacity="0.41"/>
		</g>
	</svg>
</div>

<style>
	.sky {
		position: absolute;
		inset: 0;
		z-index: -1;
		overflow: hidden;
		background:
			radial-gradient(62% 58% at 50% 0%, var(--glow-1), transparent 70%),
			radial-gradient(46% 52% at 0% 58%, var(--glow-2), transparent 70%),
			radial-gradient(48% 50% at 100% 78%, var(--glow-3), transparent 70%);
		/* the lights fade out into the page */
		-webkit-mask-image: linear-gradient(#000 62%, transparent);
		mask-image: linear-gradient(#000 62%, transparent);
	}

	/* Behind the heading of an inner page: one light, fewer and fainter
	   stars, and none of the larger ones - the words stand to the left there. */
	.sky.quiet {
		background: radial-gradient(70% 90% at 50% 0%, var(--glow-1), transparent 72%);
		opacity: 0.8;
	}

	.sky.quiet .sparks {
		display: none;
	}

	.sky.quiet .dots {
		opacity: 0.55;
	}

	.stars {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.arcs {
		stroke: var(--arc);
		stroke-width: 1.5;
	}

	.dots,
	.sparks {
		fill: var(--star);
	}

	@media (prefers-reduced-motion: no-preference) {
		.sparks path {
			animation: twinkle 5.5s ease-in-out infinite;
			transform-box: fill-box;
			transform-origin: center;
		}

		.sparks path:nth-child(2n) {
			animation-delay: -1.8s;
			animation-duration: 7s;
		}

		.sparks path:nth-child(3n) {
			animation-delay: -3.4s;
			animation-duration: 8.5s;
		}
	}

	@keyframes twinkle {
		50% {
			opacity: 0.15;
			transform: scale(0.7);
		}
	}
</style>
