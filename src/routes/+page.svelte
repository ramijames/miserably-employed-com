<script lang="ts">
	import { onMount } from 'svelte';
	import ProjectStrip from '$lib/ProjectStrip.svelte';
	import HeroScene from '$lib/HeroScene.svelte';

	onMount(() => {
		const heroEl = document.querySelector<HTMLElement>('.hero');

		function onScroll() {
			if (!heroEl) return;
			const heroHeight = heroEl.offsetHeight;
			const progress = Math.max(0, Math.min(1, window.scrollY / (heroHeight * 0.7)));
			heroEl.style.opacity = String(1 - progress);
			heroEl.style.pointerEvents = progress >= 1 ? 'none' : '';
		}
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();

		const reveals = document.querySelectorAll<HTMLElement>('.reveal');
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (reduceMotion) {
			reveals.forEach((el) => el.classList.add('revealed'));
		} else {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							entry.target.classList.add('revealed');
							observer.unobserve(entry.target);
						}
					});
				},
				{ threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
			);
			reveals.forEach((el) => observer.observe(el));
		}

		return () => {
			window.removeEventListener('scroll', onScroll);
		};
	});

	const TAGLINE_PARTS = [
		{ text: 'We build technical marvels.', muted: false },
		{ text: 'They build character.', muted: true }
	];
	const TAGLINE_WORDS = TAGLINE_PARTS.flatMap((p) =>
		p.text.split(' ').map((word) => ({ word, muted: p.muted }))
	);

	const TEAM = [
		{
			name: 'Nathan James',
			role: 'Co-Founder & CTO',
			image: '/nathan.png',
			summary:
				'20 years as a developer, 10 deep in security and privacy centric verticals. Co-founded applications that serviced customers with over $4B in self-custodied assets. Held senior and director-level roles at multiple open source foundations, and has grown apps to hundreds of thousands of users.'
		},
		{
			name: 'Rami James',
			role: 'Co-Founder & CPO',
			image: '/rami.png',
			summary:
				"30 years in tech, designing and shipping products. Co-founded applications that held over $4B in self-custodied assets, led product and operations to scale it to support hundreds of thousands of users. From enterprise UX overhauls to startup product launches, Rami's focus has always been the same: make complex systems feel simple."
		}
	];

	let formName = $state('');
	let formEmail = $state('');
	let formMessage = $state('');
	let formSending = $state(false);
	let formStatus = $state<'idle' | 'success' | 'error'>('idle');
	let formError = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formSending = true;
		formStatus = 'idle';
		formError = '';

		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: formName, email: formEmail, message: formMessage })
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || 'Something went wrong');
			}
			formStatus = 'success';
			formName = '';
			formEmail = '';
			formMessage = '';
		} catch (err) {
			formStatus = 'error';
			formError = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			formSending = false;
		}
	}

	const PRINCIPLES = [
		{
			title: 'We value honesty',
			description:
				"We say what we mean. If something isn't working, we say that too. Sugar-coating is a waste of everyone's time.",
			icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`
		},
		{
			title: 'We prefer flat',
			description:
				'No hierarchy worth worrying about. Anyone can step into any problem and ship the fix.',
			icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>`
		},
		{
			title: 'Simple is better',
			description:
				'If you need a diagram to explain the feature, the feature is too complicated. Start over.',
			icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>`
		},
		{
			title: 'Go go go',
			description:
				'Ship it, watch what happens, adjust. A plan that lives on a roadmap helps nobody.',
			icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 3 21 12 13 21"/><polyline points="5 3 13 12 5 21"/></svg>`
		},
		{
			title: 'Product driven',
			description: 'The roadmap starts with real user pain. Everything else is a nice-to-have.',
			icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>`
		},
		{
			title: 'Have a good time doing it',
			description:
				"The problems are interesting. The people are good. We'd rather enjoy the work than survive it.",
			icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r="0.8" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="0.8" fill="currentColor" stroke="none"/></svg>`
		}
	];
</script>

<!-- Hero -->
<section class="section hero">
	<HeroScene />
	<span class="word logo-mask"
		><span class="word-inner" style="--i: 0"
			><img src="/me-logo.svg" alt="Miserably Employed" class="logo" /></span
		></span
	>
	<p class="tagline">
		{#each TAGLINE_WORDS as item, i}
			<span class="word" class:muted={item.muted}
				><span class="word-inner" style="--i: {i}">{item.word}</span></span
			>{' '}
		{/each}
	</p>
</section>

<!-- Projects -->
<section class="section projects-intro reveal">
	<div class="col-left">
		<h2>Projects</h2>
		<p class="intro-line">We're proud to have built these products.</p>
	</div>
	<div class="col-right">
		<div class="projects-list">
			<ProjectStrip
				name="Doodledapp"
				blurb="TODO: project blurb goes here"
				href="https://doodledapp.com"
			/>
			<ProjectStrip
				name="SessionSight"
				blurb="TODO: project blurb goes here"
				href="https://sessionsight.com"
			/>
		</div>
	</div>
</section>

<!-- Company -->
<section class="section company reveal">
	<div class="col-left">
		<h2>About us</h2>
		<p class="intro-line">
			We're two technically minded brothers on a mission to build the coolest shit ever.
		</p>
	</div>
	<div class="col-right">
		<div class="company-block">
			<div class="team-list">
				{#each TEAM as member}
					<div class="team-card">
						<img src={member.image} alt={member.name} class="team-avatar" />
						<div class="team-info">
							<h4 class="team-name">{member.name}</h4>
							<p class="team-role">{member.role}</p>
							<p class="team-summary">{member.summary}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="company-block">
			<div class="principles-grid">
				{#each PRINCIPLES as item}
					<div class="principle-card">
						<div class="principle-icon">{@html item.icon}</div>
						<h4 class="item-title">{item.title}</h4>
						<p class="item-description">{item.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- Contact -->
<section class="section contact reveal">
	<div class="col-left">
		<h2>Get in touch</h2>
		<p class="intro-line">
			We're always interested in speaking with people interested in our work — collaborators,
			customers, future hires, the curious. Drop a line and we'll get back to you.
		</p>
	</div>
	<div class="col-right">
		<form class="contact-form" onsubmit={handleSubmit}>
			<div class="form-row">
				<label for="contact-name">Name</label>
				<input
					id="contact-name"
					type="text"
					bind:value={formName}
					required
					disabled={formSending}
					autocomplete="name"
				/>
			</div>
			<div class="form-row">
				<label for="contact-email">Email</label>
				<input
					id="contact-email"
					type="email"
					bind:value={formEmail}
					required
					disabled={formSending}
					autocomplete="email"
				/>
			</div>
			<div class="form-row">
				<label for="contact-message">Message</label>
				<textarea
					id="contact-message"
					rows="5"
					bind:value={formMessage}
					required
					disabled={formSending}
				></textarea>
			</div>
			<button class="button" type="submit" disabled={formSending}>
				{formSending ? 'Sending…' : 'Send message'}
			</button>
			{#if formStatus === 'success'}
				<p class="form-feedback success">Thanks — we'll be in touch.</p>
			{:else if formStatus === 'error'}
				<p class="form-feedback error">{formError}</p>
			{/if}
		</form>

		<dl class="contact-details">
			<div class="contact-row">
				<dt>Email</dt>
				<dd>
					<a class="contact-email" href="mailto:hello@miserablyemployed.com"
						>hello@miserablyemployed.com</a
					>
				</dd>
			</div>
			<div class="contact-row">
				<dt>Address</dt>
				<dd>TODO: Company address</dd>
			</div>
			<div class="contact-row">
				<dt>Phone</dt>
				<dd>TODO: Company phone</dd>
			</div>
		</dl>
	</div>
</section>

<!-- Footer -->
<footer class="section footer">
	<p>© 2026 Miserably Employed, LLC. All rights reserved.</p>
</footer>

<style>
	/* Hero */
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

	.logo-mask {
		position: relative;
		z-index: 1;
	}

	.logo {
		display: block;
		width: 200px;
		height: auto;
	}

	@media (max-width: 768px) {
		.logo {
			width: 150px;
		}
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
		white-space: nowrap;
		color: #ffffff;
		max-width: none;
	}

	.word.muted {
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

	/* Projects intro */
	.projects-intro {
		display: flex;
		flex-direction: row;
		gap: 80px;
		background: transparent;
		border-radius: 0;
		margin-bottom: 20dvh;
	}

	.projects-list {
		display: flex;
		flex-direction: column;
		gap: 120px;
	}

	/* Left column shared styles */
	.col-left h2,
	.col-left h3,
	.col-left p {
		font-family: var(--font-sans);
		font-size: 17px;
		line-height: 1.5;
		letter-spacing: 0;
		display: inline;
		margin: 0;
	}

	.col-left h2,
	.col-left h3 {
		font-weight: 700;
	}

	.col-left p {
		font-weight: 400;
		opacity: 0.5;
		color: var(--text);
	}

	/* Company */
	.company {
		display: flex;
		flex-direction: row;
		gap: 80px;
		background: transparent;
		border-radius: 0;
		margin-bottom: 20dvh;
	}

	.col-left {
		width: 320px;
		flex-shrink: 0;
		position: sticky;
		top: 40px;
		align-self: flex-start;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.col-right {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 160px;
	}

	.company-block {
		display: flex;
		flex-direction: column;
		gap: 30px;
	}

	.company-block h3 {
		font-size: 32px;
		line-height: 1.2;
	}

	/* Team */
	.team-list {
		display: flex;
		flex-direction: column;
	}

	.team-card {
		display: flex;
		align-items: flex-start;
		gap: 30px;
		padding: 30px 0;
		border-bottom: 1px solid var(--border);
	}

	.team-card:first-child {
		padding-top: 0;
	}

	.team-card:last-child {
		border-bottom: none;
	}

	.team-avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
		background: rgba(122, 105, 251, 0.15);
	}

	.team-info {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.team-name {
		font-size: 17px;
		font-weight: 700;
		line-height: 1.2;
		text-transform: none;
	}

	.team-role {
		font-family: var(--font-sans);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--accent);
	}

	.team-summary {
		font-size: 15px;
		line-height: 1.6;
		max-width: 720px;
	}

	/* Principles grid */
	.principles-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}

	.principle-card {
		padding: 30px;
		min-height: 360px;
		display: flex;
		flex-direction: column;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0) 50%),
			linear-gradient(180deg, #0c0c0c 0%, #030303 100%);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-top-color: rgba(255, 255, 255, 0.18);
		border-radius: 20px;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.12),
			inset 0 -1px 0 rgba(0, 0, 0, 0.5),
			inset 0 0 40px rgba(255, 255, 255, 0.02),
			0 1px 2px rgba(0, 0, 0, 0.4);
	}

	.principle-icon {
		width: 24px;
		height: 24px;
		color: #555;
		margin-bottom: auto;
	}

	.principle-icon :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}

	.item-title {
		font-family: var(--font-sans);
		font-size: 17px;
		font-weight: 700;
		text-transform: none;
		letter-spacing: 0;
		margin-bottom: 10px;
	}

	.item-description {
		font-family: var(--font-sans);
		font-size: 14px;
		line-height: 1.6;
	}

	/* Contact */
	.contact {
		display: flex;
		flex-direction: row;
		gap: 80px;
		background: transparent;
		border-radius: 0;
		min-height: 0;
		margin-bottom: 20dvh;
	}

	.contact .col-right {
		gap: 80px;
	}

	.contact-blurb {
		font-size: 18px;
		line-height: 1.6;
		max-width: 720px;
		color: var(--text-muted);
	}

	.contact-details {
		display: flex;
		flex-direction: column;
		gap: 0;
		margin: 0;
		max-width: 720px;
	}

	.contact-row {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 20px;
		padding: 20px 0;
		border-bottom: 1px solid var(--border);
	}

	.contact-row:first-child {
		padding-top: 0;
	}

	.contact-row:last-child {
		border-bottom: none;
	}

	.contact-row dt {
		font-family: var(--font-sans);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.contact-row dd {
		margin: 0;
		font-family: var(--font-sans);
		font-size: 16px;
		color: var(--text);
	}

	.contact-email {
		color: var(--text);
		border-bottom: 1px solid rgba(255, 255, 255, 0.3);
	}

	.contact-email:hover {
		opacity: 0.8;
	}

	.contact-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
		max-width: 720px;
	}

	.form-row {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.form-row label {
		font-family: var(--font-sans);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.form-row input,
	.form-row textarea {
		padding: 14px 16px;
		font-family: var(--font-sans);
		font-size: 15px;
		color: var(--text);
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		outline: none;
		resize: vertical;
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
	}

	.form-row input:focus,
	.form-row textarea:focus {
		border-color: rgba(255, 255, 255, 0.4);
		background: rgba(255, 255, 255, 0.06);
	}

	.form-row input:disabled,
	.form-row textarea:disabled {
		opacity: 0.6;
	}

	.contact-form .button {
		align-self: flex-start;
	}

	.form-feedback {
		font-family: var(--font-sans);
		font-size: 14px;
		margin: 0;
	}

	.form-feedback.success {
		color: #6ee7a8;
	}

	.form-feedback.error {
		color: #ff7a7a;
	}

	/* Footer */
	.footer {
		padding-top: 30px;
		padding-bottom: 30px;
		background: transparent;
		border-radius: 0;
		min-height: 0;
		align-items: flex-end;
		text-align: right;
		opacity: 0.5;
	}

	.footer p {
		font-size: 13px;
		color: var(--text-muted);
		letter-spacing: 0.5px;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.hero {
			padding-top: 40px;
			padding-bottom: 40px;
			gap: 20px;
		}

		.company {
			flex-direction: column;
			gap: 50px;
		}

		.col-right {
			gap: 100px;
		}

		.contact,
		.projects-intro {
			flex-direction: column;
			gap: 30px;
		}

		.col-left {
			width: 100%;
			position: static;
		}

		.company-block h3 {
			font-size: 26px;
		}

		.team-card {
			flex-direction: column;
			gap: 20px;
		}

		.team-name {
			font-size: 24px;
		}

		.principles-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
