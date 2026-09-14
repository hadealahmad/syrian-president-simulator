<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import { draftStore } from '../stores/draft-store';
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
  // Camera static framing: entire Syrian Republic sovereign territory (all 14 governorates) edge-to-edge in viewport
  const targetCameraPos = new THREE.Vector3(0, 42.5, 31.0);
  const targetLookAt = new THREE.Vector3(0, 0, 0.5);

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

    camera = new THREE.PerspectiveCamera(41.5, width / height, 0.1, 1000);
    camera.position.copy(targetCameraPos);
    camera.lookAt(targetLookAt);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Warm presidential cinematic lighting
    const ambientLight = new THREE.AmbientLight(0xf7f5eb, 1.25);
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
    const baseGeo = new THREE.PlaneGeometry(46, 40);
    const baseMat = new THREE.MeshBasicMaterial({
      color: 0x0a110f,
      side: THREE.DoubleSide,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.set(0, -0.05, 0);
    scene.add(baseMesh);

    buildGovernorateMeshes();

    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    const animate = (time: number = 0) => {
      animationFrameId = requestAnimationFrame(animate);

      // Update mesh states based on selection/hover/tier
      const selectedId = $uiStore.selectedGovernorateId;
      const elapsedSec = time * 0.001;

      hexEntries.forEach((entry, id) => {
        const isSelected = selectedId === id;
        const isHovered = hoveredNodeId === id;
        const node = $gameStore.governorates[id];

        if (node) {
          updateGovernorateHex(entry, node, isSelected, isHovered, elapsedSec);

          // Subtle elevation lift when selected or hovered
          if (isSelected) {
            entry.mesh.position.y = 0.35;
          } else if (isHovered) {
            entry.mesh.position.y = 0.15;
          } else {
            entry.mesh.position.y = 0.0;
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
    const selectedId = $uiStore.selectedGovernorateId;
    hexEntries.forEach((entry, id) => {
      const node = governorates[id];
      if (node) {
        updateGovernorateHex(entry, node, selectedId === id, hoveredNodeId === id, 0);
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
    initThree();
  });

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    window.removeEventListener('resize', handleResize);
    if (renderer) {
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.dispose();
    }
  });
</script>

<div
  class="relative w-full h-full overflow-hidden select-none bg-forest-deep"
  style="cursor: {hoveredNodeId ? 'pointer' : 'default'};"
>
  <div bind:this={container} class="w-full h-full"></div>

  <!-- Tabletop Map Title Plate (top right corner) -->
  <div class="absolute top-4 right-4 pointer-events-none z-10 flex flex-col items-end gap-1">
    <div class="flex items-center gap-2 bg-forest-deep/90 border border-charcoal-mid/80 px-3 py-1.5 rounded-none shadow-md">
      <span class="w-2 h-2 rounded-full bg-forest-accent animate-pulse"></span>
      <span class="text-xs font-heading font-bold text-wheat-light tracking-wide">الخارطة الاستراتيجية للجمهورية العربية السورية</span>
    </div>
    <span class="text-[10px] font-mono text-wheat-dark/80 bg-black/40 px-2 py-0.5 border border-charcoal-mid/40">
      مقياس العمليات: 14 محافظة • قطاع موحد
    </span>
  </div>

  <!-- Floating HUD Panel for Hovered Governorate -->
  {#if hoveredNodeId && $gameStore.governorates[hoveredNodeId]}
    {@const gov = $gameStore.governorates[hoveredNodeId]}
    {@const isProjectActive = Boolean(gov.strategicProject && $draftStore.provincialProjects.includes(gov.strategicProject.id))}
    {@const isDeminingActive = $draftStore.deminingPriorityId === hoveredNodeId}
    {@const isPowerBoostActive = $draftStore.powerBoostGovId === hoveredNodeId}
    {@const activeDirectives = (isProjectActive ? 1 : 0) + (isDeminingActive ? 1 : 0) + (isPowerBoostActive ? 1 : 0)}
    {@const powerHours = Math.max(0, 24 - gov.dailyBlackoutHours)}
    <div
      class="absolute bottom-6 left-6 pointer-events-none z-10 bg-forest-deep/95 border-2 border-wheat-mid/80 p-4 shadow-2xl rounded-none w-72 text-wheat-light font-arabic"
    >
      <div class="flex items-center justify-between border-b border-charcoal-mid pb-2 mb-2.5">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 {gov.tier === 'CALM' ? 'bg-forest-accent' : gov.tier === 'TENSE' ? 'bg-wheat-gold' : 'bg-umber-crimson'} rounded-none"></span>
          <h3 class="font-heading font-bold text-sm text-wheat-light">{gov.nameAr}</h3>
        </div>
        <span class="text-[10px] px-2 py-0.5 font-bold font-mono border rounded-none {gov.tier === 'CALM' ? 'bg-forest-mid border-forest-accent text-forest-light' : gov.tier === 'TENSE' ? 'bg-wheat-mid/20 border-wheat-mid text-wheat-gold' : 'bg-umber-deep border-umber-border text-umber-crimson'}">
          {TIER_NAMES_AR[gov.tier] ?? gov.tier}
        </span>
      </div>

      <div class="space-y-2 text-xs font-mono">
        <div class="flex justify-between items-center text-wheat-mid">
          <span class="font-arabic text-wheat-dark">نسبة الإعمار:</span>
          <span class="text-wheat-gold font-bold">{(gov.reconstructionScore * 100).toFixed(0)}%</span>
        </div>
        <div class="w-full bg-charcoal-deep h-1.5 border border-charcoal-mid overflow-hidden rounded-none">
          <div class="bg-forest-accent h-full transition-all" style="width: {gov.reconstructionScore * 100}%"></div>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1 border-t border-charcoal-mid/60 text-[11px]">
          <div>
            <span class="text-wheat-dark font-arabic block text-[10px]">التغذية الكهربائية:</span>
            <span class="text-wheat-light font-bold">{powerHours} س/يوم</span>
          </div>
          <div>
            <span class="text-wheat-dark font-arabic block text-[10px]">تلوث الألغام:</span>
            <span class="{gov.mineSaturationPct > 10 ? 'text-umber-crimson' : 'text-wheat-light'} font-bold">
              {Math.round(gov.mineSaturationPct * 120).toLocaleString()} هـ
            </span>
          </div>
        </div>

        {#if activeDirectives > 0}
          <div class="pt-2 border-t border-charcoal-mid flex items-center justify-between text-[11px] text-wheat-gold font-bold">
            <span class="font-arabic">التوجيهات المجدولة بالدور:</span>
            <span>{activeDirectives}</span>
          </div>
        {/if}
      </div>

      <div class="mt-2.5 pt-2 border-t border-charcoal-mid/80 text-[10px] text-wheat-dark text-center font-arabic">
        انقر لفتح ملف المحافظة وتكليف المشاريع
      </div>
    </div>
  {/if}

  <!-- Interactive Tabletop Map Legend (bottom right) -->
  <div class="absolute bottom-6 right-6 pointer-events-none z-10 bg-forest-deep/90 border border-charcoal-mid p-3 shadow-lg rounded-none text-wheat-light font-arabic">
    <div class="text-[10px] font-bold text-wheat-gold mb-1.5 border-b border-charcoal-mid pb-1 font-heading">
      دليل الرموز التكتيكية
    </div>
    <div class="space-y-1.5 text-[10px] text-wheat-mid font-mono">
      <div class="flex items-center gap-2">
        <span class="w-3 h-2 bg-forest-accent/70 border border-forest-accent"></span>
        <span class="font-arabic">مستقرة (Calm)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-2 bg-wheat-gold/70 border border-wheat-mid"></span>
        <span class="font-arabic">متوترة (Tense)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-2 bg-umber-crimson/70 border border-umber-border"></span>
        <span class="font-arabic">اضطرابات / تمرد</span>
      </div>
      <div class="flex items-center gap-2 pt-1 border-t border-charcoal-mid/60">
        <span class="w-2.5 h-2.5 bg-yellow-400 rounded-full inline-block"></span>
        <span class="font-arabic">أبراج الربط الكهربائي</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 bg-red-600 rounded-none inline-block"></span>
        <span class="font-arabic">حقول الألغام والذخائر</span>
      </div>
    </div>
  </div>
</div>
