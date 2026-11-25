<script lang="ts" module>
	// The barcode reader: the browser's own where it has one (Chrome on
	// Android), and on every other browser - Safari on an iPhone, Firefox -
	// the one this site brings (src/lib/food/readers.ts). So scanning needs
	// only a camera.
	import { barcodeReader, hasCamera } from '#lib/food/readers.ts';

	/** Can this browser read a barcode with the camera? */
	export const canScan = hasCamera;
</script>

<script lang="ts">
	// The camera, in a small live view, until it has read one barcode. Then
	// it is switched off at once - as it is when this view goes away, or the
	// page is hidden. The picture never leaves the device: only the digits
	// that were read are used.
	//
	//   {#if scanning}<Scanner onread={(digits) => ...} onstop={() => (scanning = false)} />{/if}
	let { onread, onstop }: { onread: (digits: string) => void; onstop: () => void } = $props();

	let video = $state<HTMLVideoElement>();
	let problem = $state('');
	let watching = $state(false);

	$effect(() => {
		const view = video;
		if (!view) return;
		let stream: MediaStream | null = null;
		let over = false;
		let timer: ReturnType<typeof setTimeout> | undefined;

		const off = () => {
			over = true;
			clearTimeout(timer);
			for (const track of stream?.getTracks() ?? []) track.stop();
			stream = null;
			view.srcObject = null;
		};
		// a page that is hidden does not keep the camera
		const hidden = () => {
			if (document.visibilityState === 'hidden') {
				off();
				onstop();
			}
		};
		document.addEventListener('visibilitychange', hidden);

		void (async () => {
			try {
				stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
			} catch (error) {
				const name = (error as { name?: string })?.name;
				problem =
					name === 'NotAllowedError'
						? 'The camera is not allowed for this page. You can allow it in the browser\'s settings for this site - or type the digits.'
						: name === 'NotFoundError'
							? 'No camera was found. Type the digits instead.'
							: 'The camera could not be started. Type the digits instead.';
				return;
			}
			if (over) return off(); // closed while the browser was asking
			view.srcObject = stream;
			await view.play().catch(() => {});
			watching = true;
			let reader: Awaited<ReturnType<typeof barcodeReader>>;
			try {
				reader = await barcodeReader();
			} catch {
				off();
				problem = 'The barcode reader could not be started. Type the digits instead.';
				return;
			}
			const look = async () => {
				if (over) return;
				try {
					const digits = (await reader.detect(view)).map((code) => code.rawValue.replace(/\D/g, '')).find((code) => [8, 12, 13, 14].includes(code.length));
					if (digits && !over) {
						off(); // the camera stops before anything else happens
						onread(digits);
						return;
					}
				} catch {
					// a frame that could not be read: the next one may be
				}
				timer = setTimeout(look, 180);
			};
			void look();
		})();

		return () => {
			document.removeEventListener('visibilitychange', hidden);
			off();
		};
	});
</script>

<div class="scanner">
	{#if problem}
		<p class="notice" role="alert">{problem}</p>
	{:else}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video bind:this={video} playsinline muted aria-label="What the camera sees"></video>
		<p class="estimate" role="status">{watching ? 'Hold the barcode in front of the camera. The picture stays on this device.' : 'Starting the camera...'}</p>
	{/if}
	<button class="plain-button" type="button" onclick={onstop}>{problem ? 'Close' : 'Stop the camera'}</button>
</div>

<style>
	.scanner {
		display: grid;
		gap: 0.75rem;
		justify-items: start;
	}

	video {
		display: block;
		width: 100%;
		max-height: 15rem;
		aspect-ratio: 4 / 3;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		background: #000;
		object-fit: cover;
	}
</style>
