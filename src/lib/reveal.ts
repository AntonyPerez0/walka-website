// use:reveal - lets something come up softly when it is scrolled into view.
//
// What is already on screen when the page opens is left alone. What is below
// waits, hidden, until it is nearly in view. Without scripts, and for anyone
// who asked their system for less motion, nothing is ever hidden (the styles
// are in src/lib/styles/base.css).

let observer: IntersectionObserver | undefined;

function watch(): IntersectionObserver {
	observer ??= new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				(entry.target as HTMLElement).dataset.reveal = 'in';
				observer?.unobserve(entry.target);
			}
		},
		{ rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
	);
	return observer;
}

/** `delay` in milliseconds, for things that should arrive one after another. */
export function reveal(node: HTMLElement, delay = 0) {
	if (typeof IntersectionObserver === 'undefined') return;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	if (node.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already in view

	if (delay) node.style.setProperty('--reveal-delay', `${delay}ms`);
	node.dataset.reveal = 'wait';
	watch().observe(node);

	return {
		destroy() {
			observer?.unobserve(node);
		}
	};
}
