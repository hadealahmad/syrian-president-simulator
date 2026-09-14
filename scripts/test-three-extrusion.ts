import * as THREE from 'three';
import { SYRIA_PROVINCES_GEO } from '../src/lib/spatial3d/syria-map-data';

console.log('Testing 3D Extrusion for all 14 provinces:');

for (const prov of SYRIA_PROVINCES_GEO) {
  const shape = new THREE.Shape();
  const pts = prov.polygon;
  shape.moveTo(pts[0][0], -pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    shape.lineTo(pts[i][0], -pts[i][1]);
  }

  for (const hole of prov.holes) {
    const holePath = new THREE.Path();
    holePath.moveTo(hole[0][0], -hole[0][1]);
    for (let i = 1; i < hole.length; i++) {
      holePath.lineTo(hole[i][0], -hole[i][1]);
    }
    shape.holes.push(holePath);
  }

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 3.5,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.08,
    bevelSegments: 2,
  });

  geom.computeBoundingBox();
  const bb = geom.boundingBox!;
  console.log(`  ${prov.id} (${prov.nameAr}): verts=${geom.attributes.position.count}, bounds=[${bb.min.x.toFixed(1)}, ${bb.min.y.toFixed(1)}] to [${bb.max.x.toFixed(1)}, ${bb.max.y.toFixed(1)}]`);
}

console.log('All 14 provinces extruded successfully!');
