import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CampusWorld } from '../core/types';

const COLORS = {
  grass: 0x9bcd70,
  grassDark: 0x79b765,
  road: 0x58727b,
  roadEdge: 0xd7ecdc,
  cream: 0xffe5ac,
  coral: 0xf87973,
  ink: 0x173e50,
  leaf: 0x6fb96d,
  leafLight: 0x91ce77,
};

function matte(color: THREE.ColorRepresentation, roughness = 0.84): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function rounded(size: [number, number, number], color: THREE.ColorRepresentation, radius = 0.25): THREE.Mesh {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 5, radius), matte(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function plane(width: number, height: number, color: THREE.ColorRepresentation): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), matte(color));
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

function createRoadRibbon(curve: THREE.CatmullRomCurve3, width: number, color: THREE.ColorRepresentation): THREE.Mesh {
  const steps = 64;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width / 2);
    vertices.push(point.x + side.x, 0.08, point.z + side.z, point.x - side.x, 0.08, point.z - side.z);
    uvs.push(0, t * 10, 1, t * 10);
    if (i < steps) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, matte(color, 0.93));
  mesh.receiveShadow = true;
  return mesh;
}

function createPaintedArrow(position: THREE.Vector3, rotation = 0): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(0, 1.3);
  shape.lineTo(0.72, 0.3);
  shape.lineTo(0.28, 0.3);
  shape.lineTo(0.28, -1.1);
  shape.lineTo(-0.28, -1.1);
  shape.lineTo(-0.28, 0.3);
  shape.lineTo(-0.72, 0.3);
  shape.closePath();
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: 0xbfe9ed, transparent: true, opacity: 0.74 }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = rotation;
  mesh.position.copy(position).setY(0.105);
  return mesh;
}

function createTree(x: number, z: number, scale = 1): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.64, 3.2, 12), matte(0x936d50));
  trunk.position.y = 1.6;
  trunk.castShadow = true;
  tree.add(trunk);
  const crownMaterial = matte(Math.random() > 0.45 ? COLORS.leaf : COLORS.leafLight);
  [[0, 4.1, 0], [-0.8, 3.7, 0.2], [0.72, 3.75, -0.12], [0.1, 4.62, -0.1]].forEach(([px, py, pz], index) => {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(index === 0 ? 1.55 : 1.18, 18, 14), crownMaterial);
    crown.position.set(px, py, pz);
    crown.scale.y = 0.86;
    crown.castShadow = true;
    tree.add(crown);
  });
  return tree;
}

function createCloud(x: number, y: number, z: number, scale: number): THREE.Group {
  const cloud = new THREE.Group();
  cloud.position.set(x, y, z);
  cloud.scale.setScalar(scale);
  const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xf8ffff, roughness: 1, transparent: true, opacity: 0.82 });
  [[-1.3, 0, 0], [0, 0.4, 0], [1.25, 0, 0], [0.4, -0.1, 0.2]].forEach(([px, py, pz], index) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(index === 1 ? 1.35 : 1.05, 16, 12), cloudMaterial);
    puff.position.set(px, py, pz);
    cloud.add(puff);
  });
  cloud.userData.drift = 0.16 + Math.random() * 0.12;
  return cloud;
}

function createSchoolSign(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#173E50';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '900 112px Arial Rounded MT Bold, Arial, sans-serif';
  context.fillText('TIRE TOWN', 512, 92);
  context.fillStyle = '#F87973';
  context.font = '800 68px Arial Rounded MT Bold, Arial, sans-serif';
  context.fillText('SCHOOL', 512, 187);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 2.7), new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
  return mesh;
}

function createSchool(): THREE.Group {
  const school = new THREE.Group();
  school.position.z = 40;

  const body = rounded([43, 10.5, 9], COLORS.cream, 1.15);
  body.position.y = 5.25;
  school.add(body);

  const upperBand = rounded([44, 1.2, 9.35], COLORS.coral, 0.48);
  upperBand.position.y = 8.65;
  school.add(upperBand);

  const roof = rounded([46, 1.2, 10.8], 0xf6aa67, 0.58);
  roof.position.y = 10.4;
  school.add(roof);

  const signPanel = rounded([13.2, 3.4, 0.45], 0xfff5d7, 0.55);
  signPanel.position.set(0, 7.15, -4.65);
  school.add(signPanel);
  const sign = createSchoolSign();
  sign.position.set(0, 7.12, -4.9);
  sign.rotation.y = Math.PI;
  school.add(sign);

  [-14, -4.7, 4.7, 14].forEach((x, index) => {
    const bay = rounded([7.1, 6.3, 0.42], index === 1 ? 0x79cde0 : 0xb9d8d1, 0.52);
    bay.position.set(x, 3.45, -4.58);
    school.add(bay);
    for (let line = 0; line < 3; line += 1) {
      const rail = rounded([6.2, 0.12, 0.08], 0xf4faf2, 0.04);
      rail.position.set(x, 2 + line * 1.55, -4.84);
      school.add(rail);
    }
  });

  const clock = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.38, 32), matte(0xfff9e9));
  clock.geometry.rotateX(Math.PI / 2);
  clock.position.set(0, 9.25, -5.12);
  school.add(clock);
  const hand = rounded([0.12, 0.8, 0.1], COLORS.ink, 0.04);
  hand.position.set(0, 9.48, -5.36);
  hand.rotation.z = 0.35;
  school.add(hand);

  return school;
}

function createTireStack(x: number, z: number, colors: number[], scale = 1): THREE.Group {
  const stack = new THREE.Group();
  stack.position.set(x, 0, z);
  colors.forEach((color, index) => {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.82 * scale, 0.3 * scale, 12, 24), matte(color, 0.9));
    tire.rotation.x = Math.PI / 2;
    tire.position.y = 0.32 * scale + index * 0.48 * scale;
    tire.castShadow = true;
    stack.add(tire);
  });
  return stack;
}

function createLamp(x: number, z: number): THREE.Group {
  const lamp = new THREE.Group();
  lamp.position.set(x, 0, z);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 5.8, 10), matte(0x53666d));
  pole.position.y = 2.9;
  lamp.add(pole);
  const head = rounded([0.8, 0.35, 0.52], 0xffe39d, 0.16);
  head.position.set(0, 5.75, 0.18);
  lamp.add(head);
  return lamp;
}

export function createCampus(): CampusWorld {
  const root = new THREE.Group();
  root.name = 'Tire Town School campus';
  const animated: THREE.Object3D[] = [];

  const ground = plane(180, 180, COLORS.grass);
  ground.position.y = -0.02;
  root.add(ground);

  const approachCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, -88),
    new THREE.Vector3(0, 0, -70),
    new THREE.Vector3(-4, 0, -53),
    new THREE.Vector3(-6, 0, -38),
    new THREE.Vector3(-2, 0, -24),
    new THREE.Vector3(0, 0, -12),
  ]);
  root.add(createRoadRibbon(approachCurve, 12, COLORS.road));
  const parkingLot = plane(76, 48, COLORS.road);
  parkingLot.position.set(0, 0.05, 12);
  root.add(parkingLot);

  for (let i = 0; i < 7; i += 1) {
    const point = approachCurve.getPoint(0.16 + i * 0.115);
    root.add(createPaintedArrow(point, point.x < -3 ? -0.16 : 0));
  }
  [[0, -7], [0, 5], [12, 15], [21, 20]].forEach(([x, z], index) => {
    root.add(createPaintedArrow(new THREE.Vector3(x, 0, z), index > 1 ? -Math.PI / 2 : 0));
  });

  const gateLeft = rounded([1.2, 4.6, 1.2], COLORS.cream, 0.34);
  gateLeft.position.set(-8.2, 2.3, -23);
  const gateRight = gateLeft.clone();
  gateRight.position.x = 8.2;
  root.add(gateLeft, gateRight);
  const gateBanner = rounded([17.1, 1.1, 1.05], COLORS.coral, 0.42);
  gateBanner.position.set(0, 4.85, -23);
  root.add(gateBanner);

  root.add(createSchool());

  const curbMaterial = matte(COLORS.roadEdge);
  [[-38, 12, 0.62, 48], [38, 12, 0.62, 48], [0, -12, 76, 0.62]].forEach(([x, z, width, depth]) => {
    const curb = new THREE.Mesh(new RoundedBoxGeometry(width, 0.3, depth, 4, 0.12), curbMaterial);
    curb.position.set(x, 0.15, z);
    curb.receiveShadow = true;
    root.add(curb);
  });

  [-29, -20, -11, 11].forEach((x) => {
    const line = rounded([0.18, 0.05, 8], 0xe8f0df, 0.03);
    line.position.set(x, 0.1, 19);
    root.add(line);
  });

  const quietPatch = plane(19, 16, 0x8fc373);
  quietPatch.position.set(26, 0.085, 23);
  root.add(quietPatch);
  root.add(createTireStack(23, 25, [0xf0b64f, 0x62b9b0, 0xf87973]));
  root.add(createTireStack(29, 22, [0x7188d8, 0xf3cf70], 1.15));
  root.add(createTireStack(31, 28, [0xf87973, 0xffd66f, 0x62b9b0], 0.86));
  const bench = rounded([5.6, 0.45, 1.2], 0xb87a51, 0.2);
  bench.position.set(25.5, 1.15, 31);
  root.add(bench);
  [-2.1, 2.1].forEach((x) => {
    const leg = rounded([0.35, 1.2, 0.65], 0x7d624e, 0.12);
    leg.position.set(25.5 + x, 0.6, 31);
    root.add(leg);
  });

  [[-34, -31, 1.15], [29, -27, 1.05], [-30, 31, 1.18], [38, 31, 1.1], [-24, -58, 1], [22, -51, 1.2], [-18, -73, 0.9], [18, -76, 0.92]].forEach(([x, z, scale]) => {
    root.add(createTree(x, z, scale));
  });
  [[-34, -9], [34, -9], [-34, 24], [34, 24]].forEach(([x, z]) => root.add(createLamp(x, z)));

  for (let i = 0; i < 10; i += 1) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(15 + (i % 3) * 4, 24, 12), matte(i % 2 ? 0x7bbd73 : 0x8dca7c));
    const angle = (i / 10) * Math.PI * 2;
    hill.position.set(Math.cos(angle) * 84, -9, Math.sin(angle) * 84);
    hill.scale.y = 0.7;
    root.add(hill);
  }

  [[-32, 18, -52, 1.8], [25, 23, -30, 1.35], [4, 26, 5, 1.2]].forEach(([x, y, z, scale]) => {
    const cloud = createCloud(x, y, z, scale);
    animated.push(cloud);
    root.add(cloud);
  });

  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = child.castShadow || false;
      child.receiveShadow = child.receiveShadow || false;
    }
  });

  return {
    root,
    schoolFocus: new THREE.Vector3(0, 5.5, 38),
    arrivalTarget: new THREE.Vector3(-2, 0, -26),
    crossingTarget: new THREE.Vector3(0, 0, -6),
    tireCorner: new THREE.Vector3(25, 0, 24),
    animated,
  };
}
