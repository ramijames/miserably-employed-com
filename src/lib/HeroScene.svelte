<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
	import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
	import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
	import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
	import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let loading = $state(true);

	onMount(() => {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0x000000);

		const w = container.clientWidth;
		const h = container.clientHeight;

		const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
		camera.position.set(0, 0, 10);

		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		const pixelRatio = Math.min(window.devicePixelRatio, 2);
		renderer.setPixelRatio(pixelRatio);
		renderer.setSize(w, h, false);
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.0;

		// Post-processing: bloom for glowing highlights
		const composer = new EffectComposer(renderer);
		composer.setPixelRatio(pixelRatio);
		composer.setSize(w, h);
		composer.addPass(new RenderPass(scene, camera));
		const bloomPass = new UnrealBloomPass(
			new THREE.Vector2(w, h),
			0.6, // strength
			0.2, // radius
			0.4 // threshold (lower = more pixels bloom)
		);
		composer.addPass(bloomPass);
		composer.addPass(new OutputPass());

		const pmrem = new THREE.PMREMGenerator(renderer);
		const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
		scene.environment = envTexture;

		const group = new THREE.Group();

		const NUM_RINGS = 22;
		const innerRadius = 0.8;
		const outerRadius = 14;
		const tube = 0.06;
		const arc = Math.PI * 1.55;
		const maxEnvIntensity = 1.4;

		const innerColor = new THREE.Color(0x000000);
		const outerColor = new THREE.Color(0x333333);

		// Shared cap geometry across every ring
		const capGeo = new THREE.SphereGeometry(tube, 24, 16);

		const disposables: Array<THREE.BufferGeometry | THREE.Material> = [capGeo];

		type Ring = { group: THREE.Group; material: THREE.MeshStandardMaterial };
		const rings: Ring[] = [];

		for (let i = 0; i < NUM_RINGS; i++) {
			const t = i / (NUM_RINGS - 1); // 0 at inner, 1 at outer
			const radius = innerRadius + t * (outerRadius - innerRadius);
			const color = new THREE.Color().lerpColors(innerColor, outerColor, t);

			const material = new THREE.MeshStandardMaterial({
				color,
				metalness: 1.0,
				roughness: 0.14,
				envMapIntensity: maxEnvIntensity * t, // pure black at center, shiny at edges
				transparent: true,
				opacity: 0
			});
			disposables.push(material);

			const torusGeo = new THREE.TorusGeometry(radius, tube, 24, 192, arc);
			disposables.push(torusGeo);
			const torus = new THREE.Mesh(torusGeo, material);

			const capStart = new THREE.Mesh(capGeo, material);
			capStart.position.set(radius, 0, 0);

			const capEnd = new THREE.Mesh(capGeo, material);
			capEnd.position.set(radius * Math.cos(arc), radius * Math.sin(arc), 0);

			const ringGroup = new THREE.Group();
			ringGroup.add(torus);
			ringGroup.add(capStart);
			ringGroup.add(capEnd);
			ringGroup.rotation.z = (i * Math.PI) / 7;

			group.add(ringGroup);
			rings.push({ group: ringGroup, material });
		}

		// Per-ring rotation speeds: alternate direction, slightly slower toward the outside
		const speeds = rings.map((_, i) => {
			const dir = i % 2 === 0 ? 1 : -1;
			const t = i / (NUM_RINGS - 1);
			return dir * (0.0006 + (1 - t) * 0.0014);
		});

		scene.add(group);

		// Cursor-following point light. Sits between camera and rings; only the rings exist
		// in the scene, so the light only illuminates them.
		const LIGHT_Z = 4;
		const cursorLight = new THREE.PointLight(0xffffff, 300, 60, 2);
		cursorLight.position.set(0, 0, LIGHT_Z);
		scene.add(cursorLight);

		const lightTarget = new THREE.Vector3(0, 0, LIGHT_Z);
		const lightPos = new THREE.Vector3(0, 0, LIGHT_Z);

		function updateLightTargetFromPointer(clientX: number, clientY: number) {
			const rect = canvas.getBoundingClientRect();
			const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
			const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
			const distance = camera.position.z - LIGHT_Z;
			const vFov = (camera.fov * Math.PI) / 180;
			const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
			const visibleWidth = visibleHeight * camera.aspect;
			lightTarget.set((ndcX * visibleWidth) / 2, (ndcY * visibleHeight) / 2, LIGHT_Z);
		}

		function onPointerMove(e: PointerEvent) {
			updateLightTargetFromPointer(e.clientX, e.clientY);
		}
		window.addEventListener('pointermove', onPointerMove, { passive: true });

		function positionGroup() {
			const distance = camera.position.z;
			const vFov = (camera.fov * Math.PI) / 180;
			const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
			const visibleWidth = visibleHeight * camera.aspect;
			group.position.set(visibleWidth * 0.22, visibleHeight * 0.22, 0);
		}
		positionGroup();

		const FADE_DELAY_PER_RING = 60; // ms
		const FADE_DURATION = 800; // ms
		const INTRO_DURATION = 1500; // ms — quick right-to-left sweep on first load
		const HANDOFF_BLEND = 600; // ms — soft fade into user cursor control
		const startTime = performance.now();
		let raf = 0;

		function animate() {
			const elapsed = performance.now() - startTime;

			rings.forEach((ring, i) => {
				ring.group.rotation.z += speeds[i];

				const ringStart = i * FADE_DELAY_PER_RING;
				const tRaw = Math.max(0, Math.min(1, (elapsed - ringStart) / FADE_DURATION));
				const eased = 1 - Math.pow(1 - tRaw, 3); // ease-out cubic
				ring.material.opacity = eased;
			});

			if (elapsed < INTRO_DURATION) {
				// Intro: sweep the light from right to left across the rings
				const t = elapsed / INTRO_DURATION;
				const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
				const distance = camera.position.z - LIGHT_Z;
				const vFov = (camera.fov * Math.PI) / 180;
				const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
				const visibleWidth = visibleHeight * camera.aspect;
				const startX = visibleWidth * 0.6;
				const endX = -visibleWidth * 0.6;
				const x = startX + (endX - startX) * eased;
				const y = group.position.y;
				lightPos.set(x, y, LIGHT_Z);
				cursorLight.position.copy(lightPos);
			} else {
				// Soft handoff: ease the lerp factor up so the light gently catches the cursor
				const handoffT = Math.min(1, (elapsed - INTRO_DURATION) / HANDOFF_BLEND);
				const lerpFactor = 0.04 + handoffT * 0.08; // 0.04 → 0.12
				lightPos.lerp(lightTarget, lerpFactor);
				cursorLight.position.copy(lightPos);
			}

			composer.render();
			raf = requestAnimationFrame(animate);
		}
		animate();
		// First frame is on the GPU — hide the spinner.
		requestAnimationFrame(() => {
			loading = false;
		});

		function onResize() {
			const nw = container.clientWidth;
			const nh = container.clientHeight;
			camera.aspect = nw / nh;
			camera.updateProjectionMatrix();
			renderer.setSize(nw, nh, false);
			composer.setSize(nw, nh);
			bloomPass.resolution.set(nw, nh);
			positionGroup();
		}
		window.addEventListener('resize', onResize);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('pointermove', onPointerMove);
			disposables.forEach((d) => d.dispose());
			envTexture.dispose();
			pmrem.dispose();
			bloomPass.dispose();
			composer.dispose();
			renderer.dispose();
		};
	});
</script>

<div class="hero-scene" bind:this={container}>
	<canvas bind:this={canvas}></canvas>
	{#if loading}
		<div class="scene-loading"></div>
	{/if}
</div>

<style>
	.hero-scene {
		position: absolute;
		inset: calc(-1 * var(--gap-outer));
		overflow: hidden;
		z-index: 0;
		background: #000000;
	}

	.hero-scene:after {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.594);
		content: '';
		pointer-events: none;
		backdrop-filter: blur(400px);
		mask-image: linear-gradient(to top, rgba(0,0,0, 1) 0%, rgba(0,0,0, 0) 40%);
	}

	.hero-scene:before {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.594);
		content: '';
		pointer-events: none;
		backdrop-filter: blur(400px);
		mask-image: linear-gradient(145deg, rgba(0,0,0, 1) 10%, rgba(0,0,0, 0) 70%);
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
