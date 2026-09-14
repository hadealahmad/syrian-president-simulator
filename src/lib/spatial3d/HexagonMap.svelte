<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import { draftStore, budgetStore } from '../stores/draft-store';
  import {
    createGovernorateHex,
    updateGovernorateHex,
    refreshGovernorateLabel,
    type HexMeshEntry,
  } from './hexagon-grid';

  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let animationFrameId: number;

  const hexEntries: Map<string, HexMeshEntry> = new Map();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let hoveredNodeId = $state<string | null>(null);
  // Camera static framing: entire Syrian territory (all 14 governorates) edge-to-edge in viewport
  const targetCameraPos = new THREE.Vector3(0.0, 35.5, 25.8);
  const targetLookAt = new THREE.Vector3(0.0, 0, 1.7);

  const TIER_NAMES_AR: Record<string, string> = {
    CALM: 'مستقرة',
    TENSE: 'متوترة',
    RIOT: 'اضطرابات',
    REVOLT: 'تمرد مسلح',
  };

  function buildGovernorateMeshes(): void {
    hexEntries.forEach((entry) => {
      scene.remove(entry.mesh);
    });
    hexEntries.clear();

    const governorates = $gameStore.governorates;
    for (const node of Object.values(governorates)) {
      const entry = createGovernorateHex(node);
      hexEntries.set(node.id, entry);
      scene.add(entry.mesh);
    }
  }

  function handleResize(): void {
    if (!container || !renderer || !camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const meshes = Array.from(hexEntries.values()).map((e) => e.mesh);
    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      let hitObj: THREE.Object3D | null = intersects[0].object;
      while (hitObj && !hitObj.userData?.nodeId) {
        hitObj = hitObj.parent;
      }
      hoveredNodeId = hitObj?.userData?.nodeId ?? null;
    } else {
      hoveredNodeId = null;
    }
  }

  function handleClick(): void {
    if (hoveredNodeId) {
      uiStore.selectGovernorate(hoveredNodeId);
    }
  }

  function initThree(): void {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1715); // Rich obsidian forest bg

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.copy(targetCameraPos);
    camera.lookAt(targetLookAt);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Warm presidential cinematic lighting
    const ambientLight = new THREE.AmbientLight(0xf7f5eb, 1.15);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf2cf77, 1.45); // Wheat-gold highlight
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x2e8b7d, 0.65); // Forest-teal cool fill
    fillLight.position.set(-20, 15, -10);
    scene.add(fillLight);

    // Subtle national map base plane
    const baseGeo = new THREE.PlaneGeometry(36, 32);
    const baseMat = new THREE.MeshBasicMaterial({
      color: 0x0a110f,
      side: THREE.DoubleSide,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.set(0, -0.05, 1.5);
    scene.add(baseMesh);

    buildGovernorateMeshes();

    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    const animate = (time: number = 0) => {
      animationFrameId = requestAnimationFrame(animate);

      // Update mesh states based on selection/hover/tier
      const selectedId = $uiStore.selectedGovernorateId;

      hexEntries.forEach((entry, id) => {
        const isSelected = selectedId === id;
        const isHovered = hoveredNodeId === id;
        const node = $gameStore.governorates[id];

        if (node && entry.mesh.material) {
          const sideMat = (entry.mesh.material as THREE.Material[])[0] as THREE.MeshStandardMaterial;

          // Dynamic Unrest Alert Pulsing for RIOT and REVOLT
          let defaultEmissive = new THREE.Color(0x000000);
          let defaultEmissiveIntensity = 1.0;

          if (node.tier === 'RIOT') {
            defaultEmissive = new THREE.Color(0x4a0e16);
            defaultEmissiveIntensity = 0.25 + 0.2 * Math.sin(time * 0.003);
            if (entry.beaconCoreMesh) {
              const r = 0.65 + 0.35 * Math.sin(time * 0.003);
              entry.beaconCoreMesh.material.color.setRGB(r, 0.05, 0.05);
            }
          } else if (node.tier === 'REVOLT') {
            defaultEmissive = new THREE.Color(0x8a1522);
            defaultEmissiveIntensity = 0.4 + 0.35 * Math.sin(time * 0.008);
            if (entry.beaconCoreMesh) {
              const flash = Math.sin(time * 0.01) > 0 ? 1.0 : 0.15;
              entry.beaconCoreMesh.material.color.setRGB(flash, 0.0, 0.0);
            }
          }

          if (isSelected) {
            sideMat.emissive = new THREE.Color(0x5a481c);
            sideMat.emissiveIntensity = 1.0;
            sideMat.color = new THREE.Color(0xfde68a); // Warm gold tint on milled texture
            entry.mesh.position.y = entry.baseY + 0.35;
          } else if (isHovered) {
            sideMat.emissive = new THREE.Color(0x1a453e);
            sideMat.emissiveIntensity = 1.0;
            sideMat.color = new THREE.Color(0xd1fae5); // Cool teal tint on milled texture
            entry.mesh.position.y = entry.baseY + 0.15;
          } else {
            sideMat.emissive = defaultEmissive;
            sideMat.emissiveIntensity = defaultEmissiveIntensity;
            sideMat.color = new THREE.Color(0xffffff); // Full native texture colors
            entry.mesh.position.y = entry.baseY;
          }

          // Subtle tungsten filament oscillation on transmission pylon
          const powerHours = Math.max(0, 24 - node.dailyBlackoutHours);
          if (powerHours >= 12 && entry.pylonCoreMesh) {
            entry.pylonCoreMesh.material.emissiveIntensity = 0.95 * (0.94 + 0.08 * Math.sin(time * 0.005));
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();
  }

  $effect(() => {
    // Dynamic updates when governorates change
    const governorates = $gameStore.governorates;
    hexEntries.forEach((entry, id) => {
      const node = governorates[id];
      if (node) {
        updateGovernorateHex(entry, node);
      }
    });

    // Refresh labels when fonts are loaded or state updates
    if (document.fonts) {
      document.fonts.ready.then(() => {
        hexEntries.forEach((entry) => {
          refreshGovernorateLabel(entry.labelSprite);
        });
      });
    }
  });

  onMount(() => {
    (window as any).__uiStore = uiStore;
    (window as any).__gameStore = gameStore;
    (window as any).__draftStore = draftStore;
    (window as any).__budgetStore = budgetStore;
    initThree();
  });

  onDestroy(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', handleResize);
    if (renderer) {
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.dispose();
    }
  });
</script>

<div
  bind:this={container}
  class="w-full h-full relative cursor-default select-none overflow-hidden"
>
  {#if hoveredNodeId && hoveredNodeId !== $uiStore.selectedGovernorateId && $gameStore.governorates[hoveredNodeId]}
    {@const node = $gameStore.governorates[hoveredNodeId]}
    <div
      class="absolute top-4 left-6 z-20 pointer-events-none p-3.5 bg-forest-deep/95 border border-wheat-mid/70 backdrop-blur-md rounded-none shadow-2xl font-arabic text-wheat-light space-y-1.5 text-xs min-w-[210px]"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-none bg-wheat-gold"></span>
          <span class="font-bold text-sm text-wheat-light font-heading">{node.nameAr}</span>
        </div>
        <span class="text-[10px] text-wheat-gold border border-charcoal-mid px-1.5 py-0.5 bg-forest-mid font-bold">
          {TIER_NAMES_AR[node.tier] ?? node.tier}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1.5 border-t border-charcoal-mid">
        <span class="text-wheat-dark">مؤشر الاحتقان:</span>
        <span class="font-mono font-bold text-wheat-light text-left">{node.prri}%</span>
        <span class="text-wheat-dark">ساعات التغذية:</span>
        <span class="font-mono font-bold text-wheat-light text-left">{24 - node.dailyBlackoutHours} س</span>
        <span class="text-wheat-dark">تلوث الألغام:</span>
        <span class="font-mono font-bold text-left {node.mineSaturationPct > 8 ? 'text-wheat-gold' : 'text-forest-accent'}">{node.mineSaturationPct}%</span>
      </div>
    </div>
  {/if}
</div>
