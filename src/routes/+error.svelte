<script lang="ts">
	import { page } from '$app/state';
	import HeroScene from '$lib/HeroScene.svelte';

	const TAGLINE_PARTS = [
		{ text: 'This page is missing.', muted: false },
		{ text: 'Probably for the better.', muted: true }
	];
	let _wordIdx = 0;
	const TAGLINE_LINES = TAGLINE_PARTS.map((p) => ({
		muted: p.muted,
		words: p.text.split(' ').map((word) => ({ word, i: _wordIdx++ }))
	}));
</script>

<svelte:head>
	<title>{page.status} — Miserably Employed, LLC</title>
</svelte:head>

<section class="section hero">
	<HeroScene />

	<span class="word code-mask">
		<span class="word-inner" style="--i: 0">{page.status}</span>
	</span>

	<p class="tagline">
		{#each TAGLINE_LINES as line}
			<span class="tagline-line" class:muted={line.muted}>
				{#each line.words as item}
					<span class="word"
						><span class="word-inner" style="--i: {item.i + 1}">{item.word}</span></span
					>{' '}
				{/each}
			</span>
		{/each}
	</p>

	<a class="button home-button" href="/">Back to home</a>
</section>

<style>
	.hero {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
		gap: 30px;
		background: transparent;
		border-radius: 0;
	}

	.code-mask {
		position: relative;
		z-index: 1;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: clamp(96px, 18vw, 240px);
		line-height: 1;
		color: #ffffff;
		letter-spacing: -0.02em;
	}

	.tagline {
		position: relative;
		z-index: 1;
		font-family: var(--font-display);
		font-style: normal;
		font-weight: 700;
		font-size: min(40px, 2.6vw);
		line-height: 1.3;
		text-transform: uppercase;
		color: #ffffff;
		max-width: none;
	}

	.tagline-line {
		display: inline;
		white-space: nowrap;
	}

	.tagline-line.muted {
		color: #444;
	}

	.word {
		display: inline-block;
		overflow: hidden;
		vertical-align: bottom;
		line-height: inherit;
	}

	.word-inner {
		display: inline-block;
		transform: translateY(110%);
		animation: word-reveal 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
		animation-delay: calc(var(--i) * 80ms);
	}

	@keyframes word-reveal {
		to {
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.word-inner {
			animation: none;
			transform: none;
		}
	}

	.home-button {
		position: relative;
		z-index: 1;
		animation: fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: 700ms;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.home-button {
			animation: none;
		}
	}

	@media (max-width: 768px) {
		.hero {
			padding-top: 40px;
			padding-bottom: 40px;
			gap: 20px;
		}

		.tagline {
			font-size: min(4.8vw, 32px);
		}

		.tagline-line {
			display: block;
		}

		.home-button {
			align-self: stretch;
		}
	}
</style>
