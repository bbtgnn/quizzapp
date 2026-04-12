/** Deterministic PRNG for session planning (resume-stable given the same seed inputs). */
export function hashStringToSeed(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) {
		h = Math.imul(31, h) + s.charCodeAt(i);
	}
	return h >>> 0;
}

/** Mulberry32 — fast, good enough for shuffles / weighted picks. */
export function createRng(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a += 0x6d2b79f5;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function shuffleInPlace<T>(arr: T[], rand: () => number): void {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
}

export function pickRandom<T>(items: T[], rand: () => number): T {
	if (items.length === 0) throw new Error('pickRandom: empty');
	return items[Math.floor(rand() * items.length)]!;
}
