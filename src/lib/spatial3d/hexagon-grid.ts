import * as THREE from 'three';
import type { GovernorateNode } from '../engine/types';

export const HEX_RADIUS = 2.4;

export function hexToWorldPosition(q: number, r: number, radius: number = HEX_RADIUS): THREE.Vector3 {
  const x = radius * Math.sqrt(3) * (q + r / 2);
  const z = radius * 1.5 * r;
  return new THREE.Vector3(x, 0, z);
}

export interface HexMeshEntry {
  nodeId: string;
  mesh: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>;
  wireframe: THREE.LineSegments;
  labelSprite: THREE.Sprite;
  powerMesh: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial[]>;
  hazardMesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  baseY: number;
}

export function renderLabelCanvas(nameAr: string, canvas: HTMLCanvasElement): void {
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 128);
    // Sharp rectangle, zero rounded borders, deep forest slate background
    ctx.fillStyle = 'rgba(10, 27, 24, 0.95)'; // Deep Forest #0a1b18
    ctx.beginPath();
    ctx.rect(16, 24, 224, 80);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#dfcaa0'; // Golden Wheat Mid
    ctx.stroke();

    ctx.font = 'bold 36px "Thmanyah Serif Display", "thmanyah serif display", "Thmanyah Sans", sans-serif';
    ctx.fillStyle = '#f7f5ed'; // Crisp Light Wheat Alabaster
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.fillText(nameAr, 128, 64);
  }
}

export function createGovernorateLabel(nameAr: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  renderLabelCanvas(nameAr, canvas);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.2, 1.6, 1);
  sprite.userData = { canvas, nameAr, texture };
  return sprite;
}

export function refreshGovernorateLabel(sprite: THREE.Sprite): void {
  if (sprite.userData && sprite.userData.canvas && sprite.userData.nameAr && sprite.userData.texture) {
    renderLabelCanvas(sprite.userData.nameAr, sprite.userData.canvas);
    sprite.userData.texture.needsUpdate = true;
  }
}

/**
 * Procedural electrical substation grid canvas texture reflecting provincial power supply.
 */
export function createPowerCoreTexture(powerHours: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = 128;
    const cy = 128;
    ctx.clearRect(0, 0, 256, 256);

    const isHighPower = powerHours >= 12;
    const isMediumPower = powerHours >= 6 && powerHours < 12;
    const isBlackout = powerHours < 6;

    // Outer dark chassis disc
    ctx.fillStyle = isBlackout ? '#0d1413' : isMediumPower ? '#14201c' : '#0a2320';
    ctx.beginPath();
    ctx.arc(cx, cy, 122, 0, Math.PI * 2);
    ctx.fill();

    // Concentric electrical circuit rings
    ctx.lineWidth = 3;
    ctx.strokeStyle = isBlackout
      ? '#263431'
      : isMediumPower
        ? 'rgba(234, 179, 8, 0.45)'
        : 'rgba(56, 189, 248, 0.65)';
    ctx.beginPath();
    ctx.arc(cx, cy, 96, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 62, 0, Math.PI * 2);
    ctx.stroke();

    // Radial electrical bus lines
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 28, cy + Math.sin(angle) * 28);
      ctx.lineTo(cx + Math.cos(angle) * 115, cy + Math.sin(angle) * 115);
      ctx.stroke();
    }

    // Central generator core
    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 40);
    if (isHighPower) {
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.4, '#38bdf8');
      grad.addColorStop(1, 'rgba(14, 165, 233, 0.15)');
    } else if (isMediumPower) {
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.4, '#eab308');
      grad.addColorStop(1, 'rgba(202, 138, 4, 0.15)');
    } else {
      grad.addColorStop(0, '#374151');
      grad.addColorStop(1, '#111827');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fill();

    // High-voltage lightning bolt emblem in center
    ctx.fillStyle = isBlackout ? '#4b5563' : '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy - 20);
    ctx.lineTo(cx - 9, cy + 2);
    ctx.lineTo(cx + 1, cy + 2);
    ctx.lineTo(cx - 5, cy + 20);
    ctx.lineTo(cx + 11, cy - 2);
    ctx.lineTo(cx + 2, cy - 2);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Procedural diagonal hazard caution stripes canvas texture for minefield warning bands.
 */
export function createHazardStripesTexture(isExtreme: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const stripeWidth = 24;
    const color1 = isExtreme ? '#dc2626' : '#eab308'; // Red for >14%, Amber-Yellow for 8-14%
    const color2 = '#111827'; // Dark charcoal black

    ctx.fillStyle = color2;
    ctx.fillRect(0, 0, 512, 64);

    for (let x = -64; x < 512 + 64; x += stripeWidth * 2) {
      ctx.fillStyle = color1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth - 32, 64);
      ctx.lineTo(x - 32, 64);
      ctx.closePath();
      ctx.fill();
    }

    // Border edge lines
    ctx.strokeStyle = color1;
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 512, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(8, 1);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Generates an exact 6-sided planar hexagonal band geometry that fits flush onto the cylinder top face.
 */
export function createHexagonalBandGeometry(innerR: number, outerR: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < 6; i++) {
    const a0 = (i * Math.PI) / 3;
    const a1 = ((i + 1) * Math.PI) / 3;

    const s0 = Math.sin(a0);
    const c0 = Math.cos(a0);
    const s1 = Math.sin(a1);
    const c1 = Math.cos(a1);

    const baseIdx = i * 4;
    positions.push(
      innerR * s0, 0, innerR * c0,
      outerR * s0, 0, outerR * c0,
      outerR * s1, 0, outerR * c1,
      innerR * s1, 0, innerR * c1
    );

    uvs.push(
      0, 0,
      0, 1,
      1, 1,
      1, 0
    );

    indices.push(
      baseIdx, baseIdx + 1, baseIdx + 2,
      baseIdx, baseIdx + 2, baseIdx + 3
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function getTierColor(node: GovernorateNode): number {
  if (node.tier === 'CALM') return 0x21695f;   // Deep Forest Slate Teal
  if (node.tier === 'TENSE') return 0xc5a359;  // Golden Wheat Amber
  if (node.tier === 'RIOT') return 0x851c2a;   // Deep Umber Garnet Crimson
  return 0xd92638;                             // Radiant Vermilion Alert
}

export function getWireframeColor(node: GovernorateNode): number {
  if (node.tier === 'CALM') return 0x2e8b7d;   // Slate-Pine Border
  if (node.tier === 'TENSE') return 0xdfcaa0;  // Golden Wheat Edge
  if (node.tier === 'RIOT') return 0xb91c1c;   // Garnet Edge
  return 0xef4444;                             // Radiant Red Edge
}

export function createGovernorateHex(node: GovernorateNode): HexMeshEntry {
  const pos = hexToWorldPosition(node.hexQ, node.hexR);
  const height = 0.7 + node.reconstructionScore * 2.3;

  // Base Hexagonal Pillar
  const geometry = new THREE.CylinderGeometry(HEX_RADIUS * 0.95, HEX_RADIUS * 0.95, height, 6);
  const material = new THREE.MeshStandardMaterial({
    color: getTierColor(node),
    roughness: 0.4,
    metalness: 0.15,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(pos.x, height / 2, pos.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { nodeId: node.id };

  // Wireframe with unrest-reactive coloring
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const wireframeMaterial = new THREE.LineBasicMaterial({
    color: getWireframeColor(node),
    linewidth: 1,
  });
  const wireframe = new THREE.LineSegments(edgesGeometry, wireframeMaterial);
  mesh.add(wireframe);

  // Electrical Power Substation Disc (Concentric Core on top face)
  const powerHours = Math.max(0, 24 - node.dailyBlackoutHours);
  const powerGeo = new THREE.CylinderGeometry(HEX_RADIUS * 0.54, HEX_RADIUS * 0.54, 0.08, 6);
  const powerSideMat = new THREE.MeshStandardMaterial({
    color: 0x141f1c,
    roughness: 0.7,
    metalness: 0.4,
  });
  const powerTopMat = new THREE.MeshStandardMaterial({
    map: createPowerCoreTexture(powerHours),
    roughness: 0.3,
    metalness: 0.2,
    emissive: powerHours >= 12 ? new THREE.Color(0x0284c7) : powerHours >= 6 ? new THREE.Color(0x854d0e) : new THREE.Color(0x000000),
    emissiveIntensity: powerHours >= 12 ? 0.65 : powerHours >= 6 ? 0.35 : 0.0,
  });
  const powerBottomMat = new THREE.MeshStandardMaterial({ visible: false });
  const powerMesh = new THREE.Mesh(powerGeo, [powerSideMat, powerTopMat, powerBottomMat]);
  powerMesh.position.set(0, height / 2 + 0.04, 0);
  powerMesh.userData = { nodeId: node.id };
  mesh.add(powerMesh);

  // Minefield Hazard Warning Band (6-sided diagonal stripes ring)
  const hazardGeo = createHexagonalBandGeometry(HEX_RADIUS * 0.72, HEX_RADIUS * 0.92);
  const isExtremeMines = node.mineSaturationPct > 14;
  const hazardMat = new THREE.MeshStandardMaterial({
    map: createHazardStripesTexture(isExtremeMines),
    roughness: 0.5,
    metalness: 0.1,
    transparent: true,
    opacity: isExtremeMines ? 0.95 : 0.85,
    side: THREE.DoubleSide,
  });
  const hazardMesh = new THREE.Mesh(hazardGeo, hazardMat);
  hazardMesh.position.set(0, height / 2 + 0.045, 0);
  hazardMesh.visible = node.mineSaturationPct > 8;
  hazardMesh.userData = { nodeId: node.id };
  mesh.add(hazardMesh);

  // Floating label sprite with Thmanyah font
  const labelSprite = createGovernorateLabel(node.nameAr);
  labelSprite.position.set(0, height / 2 + 0.95, 0);
  mesh.add(labelSprite);

  return {
    nodeId: node.id,
    mesh,
    wireframe,
    labelSprite,
    powerMesh,
    hazardMesh,
    baseY: height / 2,
  };
}

export function updateGovernorateHex(entry: HexMeshEntry, node: GovernorateNode): void {
  // 1. Unrest Updates (Color, Wireframe)
  const baseMat = entry.mesh.material as THREE.MeshStandardMaterial;
  baseMat.color.setHex(getTierColor(node));

  const wireMat = entry.wireframe.material as THREE.LineBasicMaterial;
  wireMat.color.setHex(getWireframeColor(node));

  // 2. Power Grid Updates
  const powerHours = Math.max(0, 24 - node.dailyBlackoutHours);
  const powerTopMat = entry.powerMesh.material[1] as THREE.MeshStandardMaterial;
  if (powerTopMat.map) powerTopMat.map.dispose();
  powerTopMat.map = createPowerCoreTexture(powerHours);
  powerTopMat.map.needsUpdate = true;
  if (powerHours >= 12) {
    powerTopMat.emissive.setHex(0x0284c7);
    powerTopMat.emissiveIntensity = 0.65;
  } else if (powerHours >= 6) {
    powerTopMat.emissive.setHex(0x854d0e);
    powerTopMat.emissiveIntensity = 0.35;
  } else {
    powerTopMat.emissive.setHex(0x000000);
    powerTopMat.emissiveIntensity = 0.0;
  }

  // 3. Minefield Hazard Updates
  const isExtremeMines = node.mineSaturationPct > 14;
  entry.hazardMesh.visible = node.mineSaturationPct > 8;
  const hazardMat = entry.hazardMesh.material as THREE.MeshStandardMaterial;
  if (hazardMat.map) hazardMat.map.dispose();
  hazardMat.map = createHazardStripesTexture(isExtremeMines);
  hazardMat.map.needsUpdate = true;
  hazardMat.opacity = isExtremeMines ? 0.95 : 0.85;
}
