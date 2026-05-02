<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		lat: number;
		lng: number;
		zoom?: number;
		label: string;
	}

	let { lat, lng, zoom = 10, label }: Props = $props();
	let mapEl: HTMLDivElement;

	onMount(() => {
		let cleanup: (() => void) | undefined;

		Promise.all([
			import('leaflet'),
			// @ts-expect-error - importing CSS as a side-effect
			import('leaflet/dist/leaflet.css')
		]).then(([leaflet]) => {
			const L = leaflet.default;

			const map = L.map(mapEl, {
				center: [lat, lng],
				zoom,
				zoomControl: false,
				dragging: false,
				scrollWheelZoom: false,
				doubleClickZoom: false,
				touchZoom: false,
				boxZoom: false,
				keyboard: false,
				attributionControl: false
			});

			// CartoDB Dark Matter — black bg with light streets/labels.
			L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
				maxZoom: 19,
				subdomains: 'abcd'
			}).addTo(map);

			const icon = L.divIcon({
				className: 'location-marker',
				html: '<div class="map-dot"></div>',
				iconSize: [16, 16],
				iconAnchor: [8, 8]
			});
			L.marker([lat, lng], { icon }).addTo(map);

			cleanup = () => map.remove();
		});

		return () => cleanup?.();
	});
</script>

<figure class="location">
	<div class="map" bind:this={mapEl}></div>
	<figcaption>{label}</figcaption>
</figure>

<style>
	.location {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 0;
		width: 100%;
	}

	.map {
		width: 100%;
		aspect-ratio: 4 / 3;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: #000;
		overflow: hidden;
	}

	figcaption {
		font-family: var(--font-sans);
		font-size: 14px;
		color: var(--text);
	}

	:global(.leaflet-container) {
		background: #000 !important;
		font-family: var(--font-sans) !important;
	}

	:global(.location-marker .map-dot) {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #7a69fb;
		border: 2px solid #ffffff;
		box-shadow: 0 0 12px rgba(122, 105, 251, 0.9);
	}
</style>
