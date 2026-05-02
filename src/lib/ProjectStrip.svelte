<script lang="ts">
	import ProjectScene from './ProjectScene.svelte';

	interface Props {
		name: string;
		tagline: string;
		description: string;
		href: string;
		colors: [string, string, string, string];
		screenshot: string;
		align?: 'left' | 'right';
	}

	let {
		name,
		tagline,
		description,
		href,
		colors,
		screenshot,
		align = 'right'
	}: Props = $props();
</script>

<article class="project">
	<div class="project-card">
		<ProjectScene {colors} {screenshot} {align} />
	</div>
	<div class="project-info">
		<div class="project-text">
			<h2>{name}</h2>
			<p class="tagline">{tagline}</p>
			<p class="description">{description}</p>
		</div>
		<a class="button" {href} target="_blank" rel="noopener noreferrer">
			Visit {name} <span aria-hidden="true">→</span>
		</a>
	</div>
</article>

<style>
	.project {
		display: flex;
		flex-direction: column;
		gap: 30px;
	}

	.project-card {
		position: relative;
		overflow: hidden;
		min-height: 80dvh;
		border-radius: 20px;
		background: #000000;
	}

	.project-info {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 30px;
	}

	.project-text {
		display: flex;
		flex-direction: column;
		gap: 10px;
		flex: 1;
		min-width: 0;
	}

	h2 {
		font-size: 40px;
		line-height: 1.1;
	}

	.tagline {
		font-size: 18px;
		font-weight: 600;
		line-height: 1.4;
		color: var(--text);
		margin: 0;
	}

	.description {
		font-size: 15px;
		line-height: 1.6;
		color: var(--text-muted);
		white-space: pre-line;
		margin: 0;
	}

	a.button {
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.project-info {
			flex-direction: column;
			align-items: flex-start;
			gap: 20px;
		}

		h2 {
			font-size: 32px;
		}
	}
</style>
