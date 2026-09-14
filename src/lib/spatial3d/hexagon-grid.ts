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
  mesh: THREE.Mesh<THREE.CylinderGeometry, THREE.Material[]>;
  wireframe: THREE.LineSegments;
  labelSprite: THREE.Sprite;
  pylonGroup: THREE.Group;
  pylonCoreMesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  mineGroup: THREE.Group;
  mineSignMat: THREE.MeshStandardMaterial;
  mineTapeMat: THREE.MeshStandardMaterial;
  beaconGroup: THREE.Group;
  beaconCoreMesh: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
  baseY: number;
}

export function renderLabelCanvas(nameAr: string, canvas: HTMLCanvasElement): void {
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 128);
    // Sharp retro military situation table plaque (deep forest slate, brass border, rivets)
    ctx.fillStyle = 'rgba(8, 20, 18, 0.95)';
    ctx.beginPath();
    ctx.rect(14, 22, 228, 84);
    ctx.fill();

    // Double brass border
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#dfcaa0';
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(203, 180, 128, 0.4)';
    ctx.strokeRect(18, 26, 220, 76);

    // 4 Corner Brass Rivet Pins
    ctx.fillStyle = '#dfcaa0';
    const pins = [
      [20, 28],
      [236, 28],
      [20, 96],
      [236, 96],
    ];
    pins.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.font = 'bold 36px "Thmanyah Serif Display", "thmanyah serif display", "Thmanyah Sans", sans-serif';
    ctx.fillStyle = '#f7f5ed';
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
 * Procedural retro topographical military cartography texture for top face.
 */
export function createRetroTopographyTexture(node: GovernorateNode): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = 256;
    const cy = 256;
    ctx.clearRect(0, 0, 512, 512);

    const isRiot = node.tier === 'RIOT' || node.tier === 'REVOLT';
    const isTense = node.tier === 'TENSE';

    // Base tactical parchment / bakelite hue
    ctx.fillStyle = isRiot ? '#240a0e' : isTense ? '#1c180e' : '#0b1b17';
    ctx.fillRect(0, 0, 512, 512);

    // Fine topographic elevation contour curves
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isRiot
      ? 'rgba(239, 68, 68, 0.2)'
      : isTense
        ? 'rgba(223, 202, 160, 0.22)'
        : 'rgba(46, 139, 125, 0.25)';

    const contourRadii = [80, 130, 180, 225];
    contourRadii.forEach((r, idx) => {
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.1) {
        // Organic topographic perturbation
        const wobble = Math.sin(a * 4 + idx) * 8 + Math.cos(a * 2) * 5;
        const x = cx + Math.cos(a) * (r + wobble);
        const y = cy + Math.sin(a) * (r + wobble);
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Retro tactical radar / coordinate grid rings
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(203, 180, 128, 0.18)';
    ctx.beginPath();
    ctx.arc(cx, cy, 150, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs (+) at quadrants
    const crossPoints = [
      [cx, cy - 150],
      [cx, cy + 150],
      [cx - 150, cy],
      [cx + 150, cy],
    ];
    crossPoints.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.moveTo(px - 10, py);
      ctx.lineTo(px + 10, py);
      ctx.moveTo(px, py - 10);
      ctx.lineTo(px, py + 10);
      ctx.stroke();
    });

    // Stenciled military sector stamp
    ctx.font = 'bold 18px "Thmanyah Sans", monospace, sans-serif';
    ctx.fillStyle = 'rgba(223, 202, 160, 0.45)';
    ctx.textAlign = 'center';
    ctx.fillText(`SECTOR // ${node.id.slice(0, 3)}`, cx, 64);

    // If severe blackout: Stamped warning indicator
    if (node.dailyBlackoutHours >= 18) {
      ctx.fillStyle = 'rgba(220, 38, 38, 0.7)';
      ctx.font = 'bold 20px "Thmanyah Sans", sans-serif';
      ctx.fillText('[ عطل شبكة كامل - 0V ]', cx, 440);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Procedural retro triangular hazard caution sign texture.
 */
export function createRetroHazardSignTexture(isExtreme: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);

    // Equilateral triangle
    ctx.beginPath();
    ctx.moveTo(64, 10);
    ctx.lineTo(122, 114);
    ctx.lineTo(6, 114);
    ctx.closePath();

    // Vivid military caution yellow or emergency red
    ctx.fillStyle = isExtreme ? '#dc2626' : '#eab308';
    ctx.fill();

    // Bold black industrial border
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#09090b';
    ctx.stroke();

    // Inner black margin
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(64, 26);
    ctx.lineTo(108, 106);
    ctx.lineTo(20, 106);
    ctx.closePath();
    ctx.stroke();

    // Retro Landmine / UXO blast icon in center
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(64, 68, 13, 0, Math.PI * 2);
    ctx.fill();

    // Blast rays / detonator spikes
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#09090b';
    for (let r = 0; r < 8; r++) {
      const angle = (r * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(64 + Math.cos(angle) * 13, 68 + Math.sin(angle) * 13);
      ctx.lineTo(64 + Math.cos(angle) * 22, 68 + Math.sin(angle) * 22);
      ctx.stroke();
    }

    // Stenciled text "ألغام"
    ctx.font = 'bold 15px "Thmanyah Sans", sans-serif';
    ctx.fillStyle = '#09090b';
    ctx.textAlign = 'center';
    ctx.fillText('ألغام', 64, 98);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Procedural diagonal hazard caution stripes canvas texture.
 */
export function createHazardStripesTexture(isExtreme: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const stripeWidth = 24;
    const color1 = isExtreme ? '#dc2626' : '#eab308';
    const color2 = '#09090b';

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

/**
 * Creates a miniature 3D retro high-voltage transmission tower pylon.
 */
export function createRetroTransmissionPylon(powerHours: number): {
  group: THREE.Group;
  coreMesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
} {
  const group = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x272d2a,
    roughness: 0.5,
    metalness: 0.6,
  });

  // Base circular substation mounting plate
  const basePlateGeo = new THREE.CylinderGeometry(0.55, 0.62, 0.05, 8);
  const basePlate = new THREE.Mesh(basePlateGeo, steelMat);
  basePlate.position.y = 0.025;
  group.add(basePlate);

  // 4 Tapered Lattice Corner Struts
  const legHeight = 1.35;
  const legGeo = new THREE.CylinderGeometry(0.025, 0.028, legHeight, 6);
  const spreadBase = 0.34;
  const spreadTop = 0.12;

  const legPositions = [
    { x0: -spreadBase, z0: -spreadBase, x1: -spreadTop, z1: -spreadTop },
    { x0: spreadBase, z0: -spreadBase, x1: spreadTop, z1: -spreadTop },
    { x0: spreadBase, z0: spreadBase, x1: spreadTop, z1: spreadTop },
    { x0: -spreadBase, z0: spreadBase, x1: -spreadTop, z1: spreadTop },
  ];

  legPositions.forEach((pos) => {
    const leg = new THREE.Mesh(legGeo, steelMat);
    const midX = (pos.x0 + pos.x1) / 2;
    const midZ = (pos.z0 + pos.z1) / 2;
    leg.position.set(midX, legHeight / 2, midZ);
    const dx = pos.x1 - pos.x0;
    const dz = pos.z1 - pos.z0;
    leg.rotation.z = -dx / legHeight;
    leg.rotation.x = dz / legHeight;
    group.add(leg);
  });

  // Mid-level horizontal cross braces collar
  const midCollarGeo = new THREE.BoxGeometry(0.46, 0.03, 0.46);
  const midCollar = new THREE.Mesh(midCollarGeo, steelMat);
  midCollar.position.y = 0.62;
  group.add(midCollar);

  // Top horizontal cross-arm beam
  const armGeo = new THREE.BoxGeometry(1.28, 0.04, 0.05);
  const crossArm = new THREE.Mesh(armGeo, steelMat);
  crossArm.position.y = 1.15;
  group.add(crossArm);

  // Apex tower cap
  const capGeo = new THREE.ConeGeometry(0.14, 0.24, 4);
  const cap = new THREE.Mesh(capGeo, steelMat);
  cap.position.y = 1.28;
  cap.rotation.y = Math.PI / 4;
  group.add(cap);

  // Ceramic insulator discs hanging from the cross-arm tips
  const insGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.18, 6);
  const insMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    roughness: 0.3,
    metalness: 0.2,
  });
  [-0.56, 0.56].forEach((x) => {
    const ins = new THREE.Mesh(insGeo, insMat);
    ins.position.set(x, 1.05, 0);
    group.add(ins);
  });

  // Tungsten Power Filament / Substation Transformer Core in center of pylon
  const coreGeo = new THREE.SphereGeometry(0.2, 16, 16);
  const isHighPower = powerHours >= 12;
  const isMediumPower = powerHours >= 6 && powerHours < 12;

  const coreMat = new THREE.MeshStandardMaterial({
    color: isHighPower ? 0xffea79 : isMediumPower ? 0xd97706 : 0x1f2937,
    roughness: 0.2,
    metalness: 0.1,
    emissive: isHighPower ? new THREE.Color(0xf59e0b) : isMediumPower ? new THREE.Color(0xb45309) : new THREE.Color(0x000000),
    emissiveIntensity: isHighPower ? 0.95 : isMediumPower ? 0.45 : 0.0,
  });

  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.y = 0.62;
  group.add(coreMesh);

  return { group, coreMesh };
}

/**
 * Creates 3D tactical minefield warning stakes and hazard border tape.
 */
export function createRetroMinefieldMarkers(
  minePct: number
): {
  group: THREE.Group;
  signMat: THREE.MeshStandardMaterial;
  tapeMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  const isExtreme = minePct > 14;

  const signTex = createRetroHazardSignTexture(isExtreme);
  const signGeo = new THREE.PlaneGeometry(0.55, 0.55);
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    transparent: true,
    roughness: 0.4,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });

  const stakeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6);
  const stakeMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
    metalness: 0.4,
  });

  // 3 Stakes placed facing the camera
  const markerAngles = [Math.PI * 0.25, Math.PI * 0.58, Math.PI * 0.92];
  const radius = HEX_RADIUS * 0.84;

  markerAngles.forEach((angle) => {
    const post = new THREE.Group();
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    post.position.set(x, 0, z);

    const stake = new THREE.Mesh(stakeGeo, stakeMat);
    stake.position.y = 0.22;
    post.add(stake);

    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.y = 0.46;
    sign.rotation.x = -Math.PI * 0.18; // Angled backward so clearly readable from RTS camera
    post.add(sign);

    group.add(post);
  });

  // Perimeter caution tape along hexagon rim
  const tapeGeo = createHexagonalBandGeometry(HEX_RADIUS * 0.74, HEX_RADIUS * 0.92);
  const tapeTex = createHazardStripesTexture(isExtreme);
  const tapeMat = new THREE.MeshStandardMaterial({
    map: tapeTex,
    roughness: 0.5,
    metalness: 0.1,
    transparent: true,
    opacity: isExtreme ? 0.95 : 0.85,
    side: THREE.DoubleSide,
  });
  const tapeMesh = new THREE.Mesh(tapeGeo, tapeMat);
  tapeMesh.position.set(0, 0.02, 0);
  group.add(tapeMesh);

  group.visible = minePct > 8;
  return { group, signMat, tapeMat };
}

/**
 * Creates a vintage military incandescent alarm siren beacon for RIOT/REVOLT.
 */
export function createRetroAlarmBeacon(tier: string): {
  group: THREE.Group;
  coreMesh: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
} {
  const group = new THREE.Group();

  const mountGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.1, 8);
  const mountMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
    metalness: 0.6,
  });
  const mount = new THREE.Mesh(mountGeo, mountMat);
  mount.position.y = 0.05;
  group.add(mount);

  const glassGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.26, 8);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    transparent: true,
    opacity: 0.65,
    roughness: 0.1,
    metalness: 0.2,
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.y = 0.23;
  group.add(glass);

  const bulbGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.16, 6);
  const bulbMat = new THREE.MeshBasicMaterial({
    color: 0xff1111,
  });
  const coreMesh = new THREE.Mesh(bulbGeo, bulbMat);
  coreMesh.position.y = 0.23;
  group.add(coreMesh);

  // Position beacon at an offset corner of the tile
  group.position.set(-1.1, 0, -0.85);
  group.visible = tier === 'RIOT' || tier === 'REVOLT';

  return { group, coreMesh };
}

export function getTierColor(node: GovernorateNode): number {
  if (node.tier === 'CALM') return 0x184a42;   // Rich Soviet Military Forest Green
  if (node.tier === 'TENSE') return 0x8a6f27;  // Burnished Tactical Brass / Amber
  if (node.tier === 'RIOT') return 0x6e1622;   // Deep Blood-Garnet Bakelite
  return 0xa81c2b;                             // Intense Cold War Alert Vermilion
}

export function getWireframeColor(node: GovernorateNode): number {
  if (node.tier === 'CALM') return 0x2e8b7d;   // Slate Pine
  if (node.tier === 'TENSE') return 0xdfcaa0;  // Golden Wheat
  if (node.tier === 'RIOT') return 0xb91c1c;   // Warning Garnet
  return 0xef4444;                             // Emergency Vermilion
}

export function createGovernorateHex(node: GovernorateNode): HexMeshEntry {
  const pos = hexToWorldPosition(node.hexQ, node.hexR);
  const height = 0.75 + node.reconstructionScore * 2.2;

  // Base Hexagonal Column
  const geometry = new THREE.CylinderGeometry(HEX_RADIUS * 0.95, HEX_RADIUS * 0.95, height, 6);
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: getTierColor(node),
    roughness: 0.45,
    metalness: 0.25,
  });
  const topMaterial = new THREE.MeshStandardMaterial({
    map: createRetroTopographyTexture(node),
    roughness: 0.4,
    metalness: 0.15,
  });
  const bottomMaterial = new THREE.MeshStandardMaterial({ visible: false });

  const mesh = new THREE.Mesh(geometry, [sideMaterial, topMaterial, bottomMaterial]);
  mesh.position.set(pos.x, height / 2, pos.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { nodeId: node.id };

  // Tactical Wireframe Border
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const wireframeMaterial = new THREE.LineBasicMaterial({
    color: getWireframeColor(node),
    linewidth: 1,
  });
  const wireframe = new THREE.LineSegments(edgesGeometry, wireframeMaterial);
  mesh.add(wireframe);

  // 3D Miniature Retro Transmission Pylon (Power Grid)
  const powerHours = Math.max(0, 24 - node.dailyBlackoutHours);
  const { group: pylonGroup, coreMesh: pylonCoreMesh } = createRetroTransmissionPylon(powerHours);
  pylonGroup.position.set(0, height / 2, 0);
  pylonGroup.userData = { nodeId: node.id };
  mesh.add(pylonGroup);

  // 3D Retro Minefield Warning Stakes & Hazard Tape
  const {
    group: mineGroup,
    signMat: mineSignMat,
    tapeMat: mineTapeMat,
  } = createRetroMinefieldMarkers(node.mineSaturationPct);
  mineGroup.position.set(0, height / 2, 0);
  mineGroup.userData = { nodeId: node.id };
  mesh.add(mineGroup);

  // 3D Vintage Incandescent Alarm Siren Beacon (RIOT/REVOLT)
  const { group: beaconGroup, coreMesh: beaconCoreMesh } = createRetroAlarmBeacon(node.tier);
  beaconGroup.position.set(-1.1, height / 2, -0.85);
  beaconGroup.userData = { nodeId: node.id };
  mesh.add(beaconGroup);

  // Floating Stamped Brass Placard Label
  const labelSprite = createGovernorateLabel(node.nameAr);
  labelSprite.position.set(0, height / 2 + 1.8, 0); // Elevated to gracefully crown the pylon
  mesh.add(labelSprite);

  return {
    nodeId: node.id,
    mesh,
    wireframe,
    labelSprite,
    pylonGroup,
    pylonCoreMesh,
    mineGroup,
    mineSignMat,
    mineTapeMat,
    beaconGroup,
    beaconCoreMesh,
    baseY: height / 2,
  };
}

export function updateGovernorateHex(entry: HexMeshEntry, node: GovernorateNode): void {
  // 1. Civil Unrest Updates
  const sideMat = entry.mesh.material[0] as THREE.MeshStandardMaterial;
  sideMat.color.setHex(getTierColor(node));

  const wireMat = entry.wireframe.material as THREE.LineBasicMaterial;
  wireMat.color.setHex(getWireframeColor(node));

  // Update Top Face Topography texture
  const topMat = entry.mesh.material[1] as THREE.MeshStandardMaterial;
  if (topMat.map) topMat.map.dispose();
  topMat.map = createRetroTopographyTexture(node);
  topMat.map.needsUpdate = true;

  // Unrest Alarm Beacon Visibility
  entry.beaconGroup.visible = node.tier === 'RIOT' || node.tier === 'REVOLT';

  // 2. Power Grid (Pylon Tungsten Core)
  const powerHours = Math.max(0, 24 - node.dailyBlackoutHours);
  const isHighPower = powerHours >= 12;
  const isMediumPower = powerHours >= 6 && powerHours < 12;

  entry.pylonCoreMesh.material.color.setHex(isHighPower ? 0xffea79 : isMediumPower ? 0xd97706 : 0x1f2937);
  if (isHighPower) {
    entry.pylonCoreMesh.material.emissive.setHex(0xf59e0b);
    entry.pylonCoreMesh.material.emissiveIntensity = 0.95;
  } else if (isMediumPower) {
    entry.pylonCoreMesh.material.emissive.setHex(0xb45309);
    entry.pylonCoreMesh.material.emissiveIntensity = 0.45;
  } else {
    entry.pylonCoreMesh.material.emissive.setHex(0x000000);
    entry.pylonCoreMesh.material.emissiveIntensity = 0.0;
  }

  // 3. Minefield Hazard Updates
  const isExtreme = node.mineSaturationPct > 14;
  entry.mineGroup.visible = node.mineSaturationPct > 8;

  if (entry.mineSignMat.map) entry.mineSignMat.map.dispose();
  entry.mineSignMat.map = createRetroHazardSignTexture(isExtreme);
  entry.mineSignMat.map.needsUpdate = true;

  if (entry.mineTapeMat.map) entry.mineTapeMat.map.dispose();
  entry.mineTapeMat.map = createHazardStripesTexture(isExtreme);
  entry.mineTapeMat.map.needsUpdate = true;
  entry.mineTapeMat.opacity = isExtreme ? 0.95 : 0.85;
}
