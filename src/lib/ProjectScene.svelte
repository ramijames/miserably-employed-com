<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
	import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
	import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

	interface Props {
		colors: [string, string, string, string];
		screenshot: string;
		align?: 'left' | 'right';
	}

	let { colors, screenshot, align = 'right' }: Props = $props();
	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let loading = $state(true);

	onMount(() => {
		const scene = new THREE.Scene();

		const w = container.clientWidth;
		const h = container.clientHeight;

		// Match macbook-pro-3d: narrow FOV, far camera so the laptop reads with
		// minimal perspective distortion.
		const camera = new THREE.PerspectiveCamera(20, w / h, 0.1, 1000);
		camera.position.set(0, -10, 180);
		camera.lookAt(0, -10, 20);

		const renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: true,
			powerPreference: 'high-performance'
		});
		renderer.setClearColor(0x000000, 0);
		// Higher DPR cap → more pixels per frame, fewer visible jaggies on the laptop edges.
		const dpr = Math.min(window.devicePixelRatio, 3);
		renderer.setPixelRatio(dpr);
		renderer.setSize(w, h, false);
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.0;

		const pmrem = new THREE.PMREMGenerator(renderer);
		const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
		scene.environment = envTexture;

		// --- Animated mesh-gradient background ---
		const colorVecs = colors.map((c) => new THREE.Color(c));
		const bgUniforms = {
			uTime: { value: 0 },
			c0: { value: colorVecs[0] },
			c1: { value: colorVecs[1] },
			c2: { value: colorVecs[2] },
			c3: { value: colorVecs[3] }
		};

		const bgMaterial = new THREE.ShaderMaterial({
			uniforms: bgUniforms,
			vertexShader: /* glsl */ `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}
			`,
			fragmentShader: /* glsl */ `
				varying vec2 vUv;
				uniform float uTime;
				uniform vec3 c0;
				uniform vec3 c1;
				uniform vec3 c2;
				uniform vec3 c3;

				void main() {
					// Four glowing colored nodes sitting under the laptop, in the lower
					// portion of the frame.
					float t = uTime * 0.3;
					vec2 b0 = vec2(0.16 + 0.03 * sin(t),         0.26 + 0.03 * cos(t * 1.2));
					vec2 b1 = vec2(0.40 + 0.03 * sin(t * 1.1 + 1.5), 0.30 + 0.03 * cos(t * 0.9 + 2.0));
					vec2 b2 = vec2(0.60 + 0.03 * sin(t * 1.05 + 2.5), 0.30 + 0.03 * cos(t * 1.15 + 0.8));
					vec2 b3 = vec2(0.84 + 0.03 * sin(t * 0.95 + 4.0), 0.24 + 0.03 * cos(t * 1.0 + 3.5));

					float radius = 0.36;
					float a0 = smoothstep(radius, 0.0, distance(vUv, b0));
					float a1 = smoothstep(radius, 0.0, distance(vUv, b1));
					float a2 = smoothstep(radius, 0.0, distance(vUv, b2));
					float a3 = smoothstep(radius, 0.0, distance(vUv, b3));

					a0 = pow(a0, 1.6);
					a1 = pow(a1, 1.6);
					a2 = pow(a2, 1.6);
					a3 = pow(a3, 1.6);

					vec3 col = c0 * a0 + c1 * a1 + c2 * a2 + c3 * a3;
					float coverage = clamp(a0 + a1 + a2 + a3, 0.0, 1.0);

					// Cap overall opacity at 0.15 → subtle glow behind the laptop.
					gl_FragColor = vec4(col, coverage * 0.15);
				}
			`,
			transparent: true,
			depthWrite: false,
			depthTest: false
		});

		// Bg plane sits far behind the laptop, centered on the camera's view center
		// so UV 0..1 maps cleanly to the visible frame.
		const bgZ = -100;
		const bgGeo = new THREE.PlaneGeometry(1, 1);
		const bgMesh = new THREE.Mesh(bgGeo, bgMaterial);
		bgMesh.position.set(0, -10, bgZ);
		bgMesh.renderOrder = -1;
		scene.add(bgMesh);

		function updateBgSize() {
			const distToBg = camera.position.z - bgZ;
			const vFov = (camera.fov * Math.PI) / 180;
			const vh = 2 * Math.tan(vFov / 2) * distToBg;
			const vw = vh * camera.aspect;
			bgMesh.scale.set(vw, vh, 1);
		}
		updateBgSize();

		// --- Load mac.glb: centered horizontally, anchored toward the bottom of the card ---
		const laptopGroup = new THREE.Group();
		laptopGroup.position.set(0, -22, 20);
		laptopGroup.scale.setScalar(1.875);
		// Tilt the laptop back so the keyboard faces away from the camera.
		laptopGroup.rotation.x = -0.075;
		scene.add(laptopGroup);

		// Scroll-driven shine: a bright directional light whose direction sweeps
		// across the laptop as the user scrolls. Directional lights don't fall off
		// with distance, so the shine reads regardless of GLB scale.
		const shineLight = new THREE.DirectionalLight(0xffffff, 1);
		shineLight.position.set(-50, 30, 60);
		shineLight.target = laptopGroup;
		scene.add(shineLight);

		let screenPivot: THREE.Object3D | null = null;
		const matMaterials: THREE.Material[] = []; // for cleanup

		let glbReady = false;
		let texReady = false;
		const maybeDoneLoading = () => {
			if (glbReady && texReady) loading = false;
		};

		const textureLoader = new THREE.TextureLoader();
		const screenshotTex = textureLoader.load(screenshot, () => {
			texReady = true;
			maybeDoneLoading();
		});
		screenshotTex.colorSpace = THREE.SRGBColorSpace;
		// The matte UVs need only a vertical flip — applied here without horizontal mirroring.
		screenshotTex.flipY = true;
		screenshotTex.center.set(0.5, 0.5);
		screenshotTex.rotation = 0;

		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
		const gltfLoader = new GLTFLoader();
		gltfLoader.setDRACOLoader(dracoLoader);
		gltfLoader.load('/mac.glb', (gltf) => {
			const root = gltf.scene;
			root.traverse((node) => {
				if (node.name === 'screen') {
					screenPivot = node;
					node.rotation.x = THREE.MathUtils.degToRad(180);
				}
				if ((node as THREE.Mesh).isMesh) {
					const mesh = node as THREE.Mesh;

					if (node.name === 'matte') {
						// Display surface — keep it matte and apply the screenshot.
						const screenMat = new THREE.MeshStandardMaterial({
							map: screenshotTex,
							metalness: 0,
							roughness: 1
						});
						mesh.material = screenMat;
						matMaterials.push(screenMat);
					} else {
						// Body — match the dark shiny metal of the hero rings.
						const ringMat = new THREE.MeshStandardMaterial({
							color: 0x333333,
							metalness: 1.0,
							roughness: 0.014,
							envMapIntensity: 0.4
						});
						mesh.material = ringMat;
						matMaterials.push(ringMat);
					}
				}
			});
			laptopGroup.add(root);
			glbReady = true;
			maybeDoneLoading();
		});

		let raf = 0;
		let scrollProgress = 0;
		const startTime = performance.now();

		function updateScroll() {
			const rect = container.getBoundingClientRect();
			const total = window.innerHeight + rect.height;
			const scrolled = window.innerHeight - rect.top;
			scrollProgress = Math.max(0, Math.min(1, scrolled / total));
		}

		function animate() {
			const elapsed = (performance.now() - startTime) / 1000;
			bgUniforms.uTime.value = elapsed;

			// Lid: closed (180°) → open (90°). Fully open by mid-scroll-traversal.
			if (screenPivot) {
				const lidT = Math.max(0, Math.min(1, scrollProgress * 2));
				screenPivot.rotation.x = THREE.MathUtils.degToRad(180 - lidT * 90);
			}

			// Lazy-susan: gentle Y-axis rotation as the user scrolls, centered around 0
			// at the middle of the card so the laptop faces the camera most when fully open.
			laptopGroup.rotation.y = (scrollProgress - 0.5) * (Math.PI / 4);

			// Shine direction sweeps horizontally across the laptop with scroll progress.
			// Wider arc + the light is directional, so the angle of incidence rotates
			// around the laptop, producing a visible moving specular highlight.
			shineLight.position.x = -80 + scrollProgress * 160;

			renderer.render(scene, camera);
			raf = requestAnimationFrame(animate);
		}
		animate();

		function onScroll() {
			updateScroll();
		}
		window.addEventListener('scroll', onScroll, { passive: true });
		updateScroll();

		function onResize() {
			const nw = container.clientWidth;
			const nh = container.clientHeight;
			camera.aspect = nw / nh;
			camera.updateProjectionMatrix();
			renderer.setSize(nw, nh, false);
			updateBgSize();
		}
		window.addEventListener('resize', onResize);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
			bgGeo.dispose();
			bgMaterial.dispose();
			screenshotTex.dispose();
			matMaterials.forEach((m) => m.dispose());
			envTexture.dispose();
			pmrem.dispose();
			dracoLoader.dispose();
			renderer.dispose();
		};
	});
</script>

<div class="project-scene" bind:this={container}>
	<canvas bind:this={canvas}></canvas>
	{#if loading}
		<div class="scene-loading"></div>
	{/if}
</div>

<style>
	.project-scene {
		position: absolute;
		inset: 0;
		overflow: hidden;
		border-radius: 20px;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
