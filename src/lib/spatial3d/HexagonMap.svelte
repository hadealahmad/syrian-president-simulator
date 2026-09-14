<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import { draftStore, budgetStore } from '../stores/draft-store';
  import {
    createGovernorateHex,
    getTierColor,
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
  // Camera static framing: entire Syrian territory (all 14 governorates) clearly in viewport
  const targetCameraPos = new THREE.Vector3(0.0, 37.0, 27.0);
  const targetLookAt = new THREE.Vector3(0.0, 0, 1.8);

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
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      hoveredNodeId = hit.userData.nodeId ?? null;
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
    const ambientLight = new THREE.AmbientLight(0xf7f5eb, 1.1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf2cf77, 1.4); // Wheat-gold highlight
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x2e8b7d, 0.6); // Forest-teal cool fill
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

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Update mesh states based on selection/hover/tier
      const selectedId = $uiStore.selectedGovernorateId;

      hexEntries.forEach((entry, id) => {
        const isSelected = selectedId === id;
        const isHovered = hoveredNodeId === id;
        const node = $gameStore.governorates[id];

        if (node && entry.mesh.material) {
          const mat = entry.mesh.material as THREE.MeshStandardMaterial;
          const baseColor = getTierColor(node);

          if (isSelected) {
            mat.emissive = new THREE.Color(0x5a481c);
            mat.color = new THREE.Color(0xf2cf77);
            entry.mesh.position.y = entry.baseY + 0.35;
          } else if (isHovered) {
            mat.emissive = new THREE.Color(0x1a453e);
            mat.color = new THREE.Color(baseColor);
            entry.mesh.position.y = entry.baseY + 0.15;
          } else {
            mat.emissive = new THREE.Color(0x000000);
            mat.color = new THREE.Color(baseColor);
            entry.mesh.position.y = entry.baseY;
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();
  }

  $effect(() => {
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
      class="absolute top-20 left-6 z-20 pointer-events-none p-3.5 bg-forest-deep/95 border border-wheat-mid/70 backdrop-blur-md rounded-none shadow-2xl font-arabic text-wheat-light space-y-1.5 text-xs min-w-[210px]"
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
