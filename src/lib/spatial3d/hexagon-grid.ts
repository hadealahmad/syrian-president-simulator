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

export function getTierColor(node: GovernorateNode): number {
  if (node.tier === 'CALM') return 0x2e8b7d; // Crisp Forest Slate Teal
  if (node.tier === 'TENSE') return 0xdfcaa0; // Golden Wheat Amber
  if (node.tier === 'RIOT') return 0x8b2333;  // Deep Umber Garnet
  return 0xf87171;                            // Radiant Vermilion Alert
}

export function createGovernorateHex(node: GovernorateNode): HexMeshEntry {
  const pos = hexToWorldPosition(node.hexQ, node.hexR);
  const height = 0.6 + node.reconstructionScore * 2.4;

  const geometry = new THREE.CylinderGeometry(HEX_RADIUS * 0.95, HEX_RADIUS * 0.95, height, 6);
  const material = new THREE.MeshStandardMaterial({
    color: getTierColor(node),
    roughness: 0.35,
    metalness: 0.15,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(pos.x, height / 2, pos.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { nodeId: node.id };

  // Sharp top border wireframe
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const wireframeMaterial = new THREE.LineBasicMaterial({
    color: 0x254b42, // Slate-Pine Border
    linewidth: 1,
  });
  const wireframe = new THREE.LineSegments(edgesGeometry, wireframeMaterial);
  mesh.add(wireframe);

  // Floating label sprite with Thmanyah font
  const labelSprite = createGovernorateLabel(node.nameAr);
  labelSprite.position.set(0, height / 2 + 0.9, 0);
  mesh.add(labelSprite);

  return {
    nodeId: node.id,
    mesh,
    wireframe,
    labelSprite,
    baseY: height / 2,
  };
}
