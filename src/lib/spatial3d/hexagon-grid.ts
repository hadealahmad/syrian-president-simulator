import * as THREE from 'three';
import type { GovernorateNode } from '../engine/types';
import { SYRIA_PROVINCES_GEO, type ProvinceGeoData } from './syria-map-data';

export interface HexMeshEntry {
  nodeId: string;
  mesh: THREE.Group;
  provinceMesh: THREE.Mesh<THREE.ExtrudeGeometry, THREE.Material[]>;
  wireframe: THREE.LineSegments;
  labelSprite: THREE.Sprite;
  pylonGroup: THREE.Group;
  pylonCoreMesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  mineGroup: THREE.Group;
  mineSignMat: THREE.MeshStandardMaterial;
  beaconGroup: THREE.Group;
  beaconCoreMesh: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
  baseY: number;
}

/**
 * Renders a compact, sleek military brass identification nameplate.
 */
export function renderLabelCanvas(nameAr: string, canvas: HTMLCanvasElement): void {
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 72);

    // Sleek compact brass-rimmed plate
    ctx.fillStyle = 'rgba(7, 18, 16, 0.95)';
    ctx.beginPath();
    ctx.rect(10, 10, 236, 52);
    ctx.fill();

    // Double hairline brass borders
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#dfcaa0';
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(203, 180, 128, 0.35)';
    ctx.strokeRect(13, 13, 230, 46);

    // 4 Corner Brass Rivet Pins
    ctx.fillStyle = '#dfcaa0';
    const pins = [
      [15, 15],
      [241, 15],
      [15, 57],
      [241, 57],
    ];
    pins.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Refined Thmanyah typography
    ctx.font = 'bold 22px "Thmanyah Serif Display", "thmanyah serif display", "Thmanyah Sans", sans-serif';
    ctx.fillStyle = '#f7f5ed';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.fillText(nameAr, 128, 36);
  }
}

export function createGovernorateLabel(nameAr: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  renderLabelCanvas(nameAr, canvas);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.9, 0.55, 1);
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

    ctx.fillStyle = isExtreme ? '#dc2626' : '#eab308';
    ctx.fill();

    ctx.lineWidth = 8;
    ctx.strokeStyle = '#09090b';
    ctx.stroke();

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

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#09090b';
    for (let r = 0; r < 8; r++) {
      const angle = (r * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(64 + Math.cos(angle) * 13, 68 + Math.sin(angle) * 13);
      ctx.lineTo(64 + Math.cos(angle) * 22, 68 + Math.sin(angle) * 22);
      ctx.stroke();
    }

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
  const basePlateGeo = new THREE.CylinderGeometry(0.45, 0.52, 0.05, 8);
  const basePlate = new THREE.Mesh(basePlateGeo, steelMat);
  basePlate.position.y = 0.025;
  group.add(basePlate);

  // 4 Tapered Lattice Corner Struts
  const legHeight = 1.35;
  const legGeo = new THREE.CylinderGeometry(0.025, 0.028, legHeight, 6);
  const spreadBase = 0.30;
  const spreadTop = 0.10;

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
  const midCollarGeo = new THREE.BoxGeometry(0.42, 0.03, 0.42);
  const midCollar = new THREE.Mesh(midCollarGeo, steelMat);
  midCollar.position.y = 0.62;
  group.add(midCollar);

  // Top horizontal cross-arm beam
  const armGeo = new THREE.BoxGeometry(1.20, 0.04, 0.05);
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
  [-0.52, 0.52].forEach((x) => {
    const ins = new THREE.Mesh(insGeo, insMat);
    ins.position.set(x, 1.05, 0);
    group.add(ins);
  });

  // Tungsten Power Filament / Substation Transformer Core in center of pylon
  const coreGeo = new THREE.SphereGeometry(0.18, 16, 16);
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
 * Creates 3D tactical minefield warning stakes and hazard markers.
 */
export function createRetroMinefieldMarkers(
  minePct: number
): {
  group: THREE.Group;
  signMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  const isExtreme = minePct > 14;

  const signTex = createRetroHazardSignTexture(isExtreme);
  const signGeo = new THREE.PlaneGeometry(0.50, 0.50);
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

  // Cluster of 2 stakes with caution signs
  const stakePositions = [
    { x: -0.3, z: 0.2 },
    { x: 0.3, z: -0.2 },
  ];

  stakePositions.forEach((pos) => {
    const post = new THREE.Group();
    post.position.set(pos.x, 0, pos.z);

    const stake = new THREE.Mesh(stakeGeo, stakeMat);
    stake.position.y = 0.22;
    post.add(stake);

    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.y = 0.45;
    sign.rotation.x = -Math.PI * 0.15;
    post.add(sign);

    group.add(post);
  });

  group.visible = minePct > 8;
  return { group, signMat };
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

  group.visible = tier === 'RIOT' || tier === 'REVOLT';
  return { group, coreMesh };
}

export function getTierColor(node: GovernorateNode): number {
  if (node.tier === 'CALM') return 0x1a433a;   // Rich Syrian Forest Pine
  if (node.tier === 'TENSE') return 0x7a6326;  // Burnished Tactical Brass / Amber
  if (node.tier === 'RIOT') return 0x6e1622;   // Deep Blood-Garnet Bakelite
  return 0x941824;                             // Intense Cold War Alert Vermilion
}

export function getWireframeColor(node: GovernorateNode): number {
  if (node.tier === 'CALM') return 0x2e8b7d;   // Slate Pine
  if (node.tier === 'TENSE') return 0xdfcaa0;  // Golden Wheat
  if (node.tier === 'RIOT') return 0xb91c1c;   // Warning Garnet
  return 0xef4444;                             // Emergency Vermilion
}

/**
 * Creates an extruded 3D geographic province mesh from Syrian boundary GeoJSON.
 */
export function createGovernorateHex(node: GovernorateNode): HexMeshEntry {
  const geo = SYRIA_PROVINCES_GEO.find((p) => p.id === node.id);
  const height = 0.85 + node.reconstructionScore * 2.3;

  // Build 2D shape with exterior boundary and interior holes
  const shape = new THREE.Shape();
  if (geo && geo.polygon.length > 0) {
    const pts = geo.polygon;
    shape.moveTo(pts[0][0], -pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i][0], -pts[i][1]);
    }
    for (const hole of geo.holes) {
      if (hole.length >= 3) {
        const holePath = new THREE.Path();
        holePath.moveTo(hole[0][0], -hole[0][1]);
        for (let i = 1; i < hole.length; i++) {
          holePath.lineTo(hole[i][0], -hole[i][1]);
        }
        shape.holes.push(holePath);
      }
    }
  }

  // 3D Extrusion with subtle industrial bevel
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.10,
    bevelSize: 0.08,
    bevelSegments: 2,
  });

  const tierColor = getTierColor(node);

  // Top/bottom cap material
  const topMaterial = new THREE.MeshStandardMaterial({
    color: tierColor,
    roughness: 0.42,
    metalness: 0.22,
  });

  // Side extruded walls material (slightly darker with industrial metallic tone)
  const sideColor = new THREE.Color(tierColor).multiplyScalar(0.75);
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: sideColor,
    roughness: 0.55,
    metalness: 0.35,
  });

  // In ExtrudeGeometry: material index 0 is cap (top/bottom), material index 1 is sides
  const provinceMesh = new THREE.Mesh(geometry, [topMaterial, sideMaterial]);
  provinceMesh.rotation.x = -Math.PI / 2;
  provinceMesh.castShadow = true;
  provinceMesh.receiveShadow = true;
  provinceMesh.userData = { nodeId: node.id };

  // Tactical Edge Wireframe along perimeter and bevels
  const edgesGeometry = new THREE.EdgesGeometry(geometry, 28);
  const wireframeMaterial = new THREE.LineBasicMaterial({
    color: getWireframeColor(node),
    linewidth: 1.5,
  });
  const wireframe = new THREE.LineSegments(edgesGeometry, wireframeMaterial);
  provinceMesh.add(wireframe);

  // Main Assembly Group
  const group = new THREE.Group();
  group.userData = { nodeId: node.id };
  group.add(provinceMesh);

  const cx = geo ? geo.center.x : 0;
  const cz = geo ? geo.center.z : 0;

  // 3D Miniature Transmission Pylon
  const powerHours = Math.max(0, 24 - node.dailyBlackoutHours);
  const { group: pylonGroup, coreMesh: pylonCoreMesh } = createRetroTransmissionPylon(powerHours);
  pylonGroup.position.set(cx + 0.5, height, cz - 0.4);
  pylonGroup.userData = { nodeId: node.id };
  group.add(pylonGroup);

  // 3D Minefield Warning Markers
  const { group: mineGroup, signMat: mineSignMat } = createRetroMinefieldMarkers(node.mineSaturationPct);
  mineGroup.position.set(cx - 0.5, height, cz + 0.5);
  mineGroup.userData = { nodeId: node.id };
  group.add(mineGroup);

  // 3D Alarm Siren Beacon (RIOT/REVOLT)
  const { group: beaconGroup, coreMesh: beaconCoreMesh } = createRetroAlarmBeacon(node.tier);
  beaconGroup.position.set(cx - 0.5, height, cz - 0.5);
  beaconGroup.userData = { nodeId: node.id };
  group.add(beaconGroup);

  // Floating Stamped Brass Placard Label
  const labelSprite = createGovernorateLabel(node.nameAr);
  labelSprite.position.set(cx, height + 0.85, cz);
  group.add(labelSprite);

  return {
    nodeId: node.id,
    mesh: group,
    provinceMesh,
    wireframe,
    labelSprite,
    pylonGroup,
    pylonCoreMesh,
    mineGroup,
    mineSignMat,
    beaconGroup,
    beaconCoreMesh,
    baseY: height,
  };
}

export function updateGovernorateHex(
  entry: HexMeshEntry,
  node: GovernorateNode,
  isSelected: boolean,
  isHovered: boolean,
  elapsedTime: number
): void {
  const materials = entry.provinceMesh.material;
  const topMat = materials[0] as THREE.MeshStandardMaterial;
  const sideMat = materials[1] as THREE.MeshStandardMaterial;
  const wfMat = entry.wireframe.material as THREE.LineBasicMaterial;

  const baseTierColor = getTierColor(node);
  const baseSideColor = new THREE.Color(baseTierColor).multiplyScalar(0.75);

  if (isSelected) {
    topMat.color.setHex(baseTierColor);
    topMat.emissive.setHex(0xdfcaa0); // Bright sovereign wheat gold
    topMat.emissiveIntensity = 0.38;
    sideMat.color.set(baseSideColor);
    sideMat.emissive.setHex(0xdfcaa0);
    sideMat.emissiveIntensity = 0.20;

    wfMat.color.setHex(0xffea79); // Brilliant gold outline
    wfMat.opacity = 1.0;
  } else if (isHovered) {
    topMat.color.setHex(baseTierColor);
    topMat.emissive.setHex(0xb9a779); // Warm brass glow
    topMat.emissiveIntensity = 0.25;
    sideMat.color.set(baseSideColor);
    sideMat.emissive.setHex(0xb9a779);
    sideMat.emissiveIntensity = 0.12;

    wfMat.color.setHex(0xdfcaa0);
    wfMat.opacity = 0.95;
  } else {
    topMat.color.setHex(baseTierColor);
    topMat.emissive.setHex(0x000000);
    topMat.emissiveIntensity = 0.0;
    sideMat.color.set(baseSideColor);
    sideMat.emissive.setHex(0x000000);
    sideMat.emissiveIntensity = 0.0;

    wfMat.color.setHex(getWireframeColor(node));
    wfMat.opacity = 0.75;
  }

  // Update Pylon Tungsten Glow
  const powerHours = Math.max(0, 24 - node.dailyBlackoutHours);
  const isHighPower = powerHours >= 12;
  const isMediumPower = powerHours >= 6 && powerHours < 12;
  entry.pylonCoreMesh.material.color.setHex(isHighPower ? 0xffea79 : isMediumPower ? 0xd97706 : 0x1f2937);
  entry.pylonCoreMesh.material.emissive.setHex(isHighPower ? 0xf59e0b : isMediumPower ? 0xb45309 : 0x000000);
  entry.pylonCoreMesh.material.emissiveIntensity = isHighPower ? 0.95 : isMediumPower ? 0.45 : 0.0;

  // Update Minefield Warning Stakes
  const hasMines = node.mineSaturationPct > 8;
  entry.mineGroup.visible = hasMines;

  // Update Alarm Beacon Pulse / Strobe
  const isRiot = node.tier === 'RIOT';
  const isRevolt = node.tier === 'REVOLT';
  entry.beaconGroup.visible = isRiot || isRevolt;

  if (isRevolt) {
    // Sharp rapid emergency strobe (5 Hz)
    const strobe = Math.sin(elapsedTime * 15) > 0 ? 1.0 : 0.15;
    entry.beaconCoreMesh.material.color.setRGB(strobe, 0.05 * strobe, 0.05 * strobe);
  } else if (isRiot) {
    // Pulsing warning breath (1.5 Hz)
    const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(elapsedTime * 4));
    entry.beaconCoreMesh.material.color.setRGB(pulse * 0.9, pulse * 0.2, 0.05);
  }
}
