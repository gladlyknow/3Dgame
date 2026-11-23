import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Expression, VehicleRig } from '../core/types';

const MATTE = 0.82;

function material(color: THREE.ColorRepresentation, roughness = MATTE, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function roundedMesh(
  size: [number, number, number],
  color: THREE.ColorRepresentation,
  radius = 0.22,
  segments = 4,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], segments, radius), material(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function wheel(x: number, z: number, radius = 0.66): THREE.Mesh {
  const wheelMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.42, 24, 1),
    material(0x20323a, 0.95),
  );
  wheelMesh.geometry.rotateZ(Math.PI / 2);
  wheelMesh.position.set(x, radius, z);
  wheelMesh.castShadow = true;

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.38, radius * 0.38, 0.44, 20), material(0xf7d37c, 0.62));
  hub.geometry.rotateZ(Math.PI / 2);
  wheelMesh.add(hub);
  return wheelMesh;
}

function addFace(group: THREE.Group, y: number, z: number, scale = 1): Pick<VehicleRig, 'pupils' | 'eyebrows' | 'mouth' | 'baseMouthY'> {
  const eyeWhite = material(0xfbfdf4, 0.55);
  const eyeInk = material(0x173e50, 0.7);
  const pupils: THREE.Mesh[] = [];
  const eyebrows: THREE.Mesh[] = [];

  [-0.48, 0.48].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.32 * scale, 20, 16), eyeWhite);
    eye.scale.y = 1.12;
    eye.position.set(x * scale, y, z);
    group.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.13 * scale, 16, 12), eyeInk);
    pupil.position.set(x * scale, y - 0.01 * scale, z + 0.28 * scale);
    group.add(pupil);
    pupils.push(pupil);

    const brow = roundedMesh([0.42 * scale, 0.075 * scale, 0.07 * scale], 0x173e50, 0.035, 3);
    brow.position.set(x * scale, y + 0.48 * scale, z + 0.24 * scale);
    brow.userData.baseY = brow.position.y;
    group.add(brow);
    eyebrows.push(brow);
  });

  const mouth = roundedMesh([0.74 * scale, 0.1 * scale, 0.08 * scale], 0x173e50, 0.04, 3);
  const baseMouthY = y - 0.62 * scale;
  mouth.position.set(0, baseMouthY, z + 0.33 * scale);
  group.add(mouth);
  return { pupils, eyebrows, mouth, baseMouthY };
}

export function createEddy(): VehicleRig {
  const group = new THREE.Group();
  group.name = 'Eddy';

  const chassis = roundedMesh([2.9, 0.72, 3.8], 0x247fb3, 0.26);
  chassis.position.y = 0.88;
  group.add(chassis);

  const cab = roundedMesh([2.62, 2.18, 2.05], 0x32a9e0, 0.44, 6);
  cab.position.set(0, 2.05, 1.03);
  group.add(cab);

  const roof = roundedMesh([2.38, 0.28, 1.72], 0x79d6f0, 0.14);
  roof.position.set(0, 3.22, 0.95);
  group.add(roof);

  const windowMaterial = material(0x90dce9, 0.24, 0.03);
  const windscreen = new THREE.Mesh(new RoundedBoxGeometry(1.72, 0.7, 0.08, 5, 0.15), windowMaterial);
  windscreen.position.set(0, 2.58, 2.07);
  group.add(windscreen);

  const bed = roundedMesh([2.72, 1.26, 2.26], 0x238fc9, 0.25, 5);
  bed.position.set(0, 1.82, -1.32);
  bed.rotation.x = -0.08;
  group.add(bed);
  const bedInset = roundedMesh([2.3, 0.64, 1.78], 0x1c6f9c, 0.18);
  bedInset.position.set(0, 2.05, -1.48);
  bed.add(bedInset);

  const bumper = roundedMesh([2.54, 0.3, 0.3], 0xffd673, 0.12);
  bumper.position.set(0, 0.78, 2.12);
  group.add(bumper);

  const wheels = [wheel(-1.36, 1.25), wheel(1.36, 1.25), wheel(-1.36, -1.35), wheel(1.36, -1.35)];
  wheels.forEach((item) => group.add(item));
  const face = addFace(group, 1.93, 2.08, 0.88);

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) child.castShadow = true;
  });
  return { group, wheels, ...face, expression: 'happy' };
}

export function createPoppy(): VehicleRig {
  const group = new THREE.Group();
  group.name = 'Poppy';
  const base = roundedMesh([2.55, 0.72, 3.4], 0xd95560, 0.3);
  base.position.y = 0.78;
  group.add(base);
  const body = roundedMesh([2.34, 1.42, 2.65], 0xf87973, 0.52, 7);
  body.position.set(0, 1.58, 0.28);
  group.add(body);
  const canopy = roundedMesh([1.78, 0.78, 1.22], 0x4ab8b4, 0.34, 6);
  canopy.position.set(0, 2.42, -0.18);
  group.add(canopy);
  const ribbon = roundedMesh([0.68, 0.22, 0.3], 0xffe39d, 0.1);
  ribbon.position.set(0, 2.95, -0.14);
  group.add(ribbon);
  const wheels = [wheel(-1.18, 1.06, 0.57), wheel(1.18, 1.06, 0.57), wheel(-1.18, -1.02, 0.57), wheel(1.18, -1.02, 0.57)];
  wheels.forEach((item) => group.add(item));
  const face = addFace(group, 1.63, 1.68, 0.75);
  setExpression({ group, wheels, ...face, expression: 'happy' }, 'happy');
  return { group, wheels, ...face, expression: 'happy' };
}

export function createLongBus(): VehicleRig {
  const group = new THREE.Group();
  group.name = 'Long school vehicle';
  const base = roundedMesh([3.05, 0.76, 8.7], 0xce7551, 0.28);
  base.position.y = 0.9;
  group.add(base);
  const body = roundedMesh([2.85, 2.5, 8.2], 0xffce73, 0.5, 6);
  body.position.y = 2.05;
  group.add(body);
  const stripe = roundedMesh([2.92, 0.35, 7.58], 0xf47d61, 0.14);
  stripe.position.set(0, 1.6, -0.15);
  group.add(stripe);
  for (let z = -2.6; z <= 2.7; z += 1.75) {
    const windowMesh = roundedMesh([2.9, 0.72, 1.08], 0x90dce9, 0.15);
    windowMesh.position.set(0, 2.62, z);
    group.add(windowMesh);
  }
  const wheels = [wheel(-1.46, 2.75, 0.7), wheel(1.46, 2.75, 0.7), wheel(-1.46, -2.75, 0.7), wheel(1.46, -2.75, 0.7)];
  wheels.forEach((item) => group.add(item));
  const face = addFace(group, 1.75, 4.15, 0.8);
  return { group, wheels, ...face, expression: 'happy' };
}

export function createRaceCar(): VehicleRig {
  const group = new THREE.Group();
  group.name = 'Zippy';
  const base = roundedMesh([2.65, 0.56, 4.15], 0xb93b4f, 0.23);
  base.position.y = 0.7;
  group.add(base);
  const nose = roundedMesh([2.25, 0.72, 2.48], 0xef5264, 0.32, 6);
  nose.position.set(0, 1.05, 0.92);
  group.add(nose);
  const canopy = roundedMesh([1.5, 0.82, 1.38], 0x6b5b9e, 0.32, 6);
  canopy.position.set(0, 1.67, -0.48);
  group.add(canopy);
  const spoiler = roundedMesh([2.55, 0.18, 0.4], 0xffd96d, 0.08);
  spoiler.position.set(0, 1.42, -1.95);
  group.add(spoiler);
  const wheels = [wheel(-1.18, 1.22, 0.58), wheel(1.18, 1.22, 0.58), wheel(-1.18, -1.28, 0.63), wheel(1.18, -1.28, 0.63)];
  wheels.forEach((item) => group.add(item));
  const face = addFace(group, 1.1, 2.13, 0.66);
  setExpression({ group, wheels, ...face, expression: 'happy' }, 'happy');
  return { group, wheels, ...face, expression: 'happy' };
}

export function setExpression(rig: VehicleRig, expression: Expression): void {
  rig.expression = expression;
  rig.eyebrows.forEach((brow, index) => {
    brow.rotation.z = 0;
    brow.position.y = Number(brow.userData.baseY ?? brow.position.y);
    if (expression === 'worried' || expression === 'shy') brow.rotation.z = index === 0 ? -0.16 : 0.16;
    if (expression === 'surprised') brow.position.y += 0.1;
  });
  rig.pupils.forEach((pupil) => {
    pupil.scale.setScalar(expression === 'surprised' ? 0.76 : 1);
  });
  rig.mouth.scale.set(1, expression === 'surprised' ? 2.2 : 1, 1);
  rig.mouth.rotation.z = expression === 'worried' || expression === 'shy' ? Math.PI : 0;
  rig.mouth.position.y = rig.baseMouthY + (expression === 'happy' ? 0 : -0.02);
}

export function animateWheels(rig: VehicleRig, distance: number): void {
  rig.wheels.forEach((item) => {
    item.rotation.x += distance / 0.62;
  });
}
