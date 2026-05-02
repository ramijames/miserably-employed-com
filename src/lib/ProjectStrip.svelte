<script lang="ts">
	interface Props {
		name: string;
		blurb: string;
		href: string;
	}

	let { name, blurb, href }: Props = $props();
</script>

<article class="project">
	<div class="project-card"></div>
	<div class="project-info">
		<div class="project-text">
			<h2>{name}</h2>
			<p class="blurb">{blurb}</p>
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
		min-height: 80dvh;
		border-radius: 20px;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 50%),
			linear-gradient(180deg, #0d0d0d 0%, #030303 100%);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-top-color: rgba(255, 255, 255, 0.2);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.14),
			inset 0 -1px 0 rgba(0, 0, 0, 0.55),
			inset 0 0 80px rgba(255, 255, 255, 0.02),
			0 2px 6px rgba(0, 0, 0, 0.4);
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

	.blurb {
		font-size: 16px;
		line-height: 1.6;
		color: var(--text-muted);
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
