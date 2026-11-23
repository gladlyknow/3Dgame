import * as THREE from 'three';
import './style.css';

const EPISODES = [
  {
    number: '01',
    title: "Eddy's First Day",
    zh: '艾迪的第一天',
    tag: '勇气 · GREETINGS',
    art: '🏫',
    colors: ['#f5a85c', '#e56c4f'],
    prompt: '沿着星光进入校园，在停车位停好。',
    steps: ['对新学校说 Hello!', '找到 Tire Town School', '在发光区域停好车'],
    words: ['HELLO', 'SCHOOL', 'STOP'],
    result: '你勇敢地完成了上学第一天！面对新环境，先观察、慢慢来，再友好地打招呼。'
  },
  {
    number: '02',
    title: 'New Friends',
    zh: '认识新朋友',
    tag: '友谊 · INTRODUCTIONS',
    art: '🎈',
    colors: ['#64c98b', '#2ca484'],
    prompt: '找到三位新朋友，听听他们喜欢做什么。',
    steps: ['认识 Poppy', '认识 Dipper', '认识 Jeb'],
    words: ['FRIEND', 'MUSIC', 'DIRT'],
    result: '你认识了三位新朋友！每个人都可以有不同爱好，认真倾听就是友谊的开始。'
  },
  {
    number: '03',
    title: 'Racing Zippy',
    zh: '和 Zippy 比赛',
    tag: '坚持 · FAST & SLOW',
    art: '🏁',
    colors: ['#7188e5', '#4b58b8'],
    prompt: '穿过彩色检查点。直道加速，转弯慢行！',
    steps: ['Ready — 准备', '通过 4 个检查点', '安全抵达终点'],
    words: ['READY', 'FAST', 'SLOW'],
    result: '你安全地跑完了赛道！速度不是唯一目标，懂得在转弯时慢下来才是真正的小赛车手。'
  },
  {
    number: '04',
    title: 'Crash! Let’s Help',
    zh: '撞车了，一起来帮忙',
    tag: '善意 · HELPING',
    art: '🛞',
    colors: ['#f47477', '#c94664'],
    prompt: 'Zippy 的车轮掉了。找到车轮并送回给他。',
    steps: ['找到掉落的 wheel', '把车轮 carry 回去', '对 Zippy 说 I’ll help!'],
    words: ['WHEEL', 'CARRY', 'HELP'],
    result: '你没有嘲笑遇到困难的 Zippy，而是选择帮助他。善意比输赢更重要。'
  },
  {
    number: '05',
    title: "Mr. Grill's Surprise",
    zh: '老师的神秘郊游',
    tag: '规则 · FIELD TRIP',
    art: '🧼',
    colors: ['#26b8c1', '#168aa5'],
    prompt: '跟紧 Mr. Grill，遵守标志，一起找到神秘目的地。',
    steps: ['在 STOP 标志前慢下来', 'Stay with the group', '抵达 Car Wash'],
    words: ['FOLLOW', 'STOP', 'CAR WASH'],
    result: '你一路跟紧队伍、遵守标志，安全到达洗车场。集体出行要守规则，也要互相照顾。'
  }
];

const $ = (selector) => document.querySelector(selector);
const els = {
  canvas: $('#game'),
  loading: $('#loadingScreen'),
  home: $('#homeScreen'),
  map: $('#mapScreen'),
  result: $('#resultScreen'),
  help: $('#helpScreen'),
  mission: $('#missionPanel'),
  episodePill: $('#episodePill'),
  missionTitle: $('#missionTitle'),
  missionSubtitle: $('#missionSubtitle'),
  missionPrompt: $('#missionPrompt'),
  missionSteps: $('#missionSteps'),
  wordChips: $('#wordChips'),
  cards: $('#episodeCards'),
  speech: $('#speechBubble'),
  speakerAvatar: $('#speakerAvatar'),
  speakerName: $('#speakerName'),
  speechEnglish: $('#speechEnglish'),
  speechChinese: $('#speechChinese'),
  speedometer: $('#speedometer'),
  speedValue: $('#speedValue'),
  speedFill: $('#speedFill'),
  desktopHint: $('#desktopHint'),
  touchControls: $('#touchControls'),
  stars: $('#starCount'),
  resultTitle: $('#resultTitle'),
  resultCopy: $('#resultCopy'),
  resultWords: $('#resultWords'),
  sound: $('#soundButton')
};

const state = {
  mode: 'home',
  currentEpisode: Number(localStorage.getItem('tts-last-episode') || 0),
  completed: new Set(JSON.parse(localStorage.getItem('tts-completed') || '[]')),
  sound: localStorage.getItem('tts-sound') !== 'off',
  started: false,
  finished: false,
  stage: 0,
  found: new Set(),
  learned: new Set(),
  target: null,
  activeMarkers: [],
  elapsed: 0,
  speechTimer: null,
  completionTimer: null
};

const input = { forward: false, back: false, left: false, right: false };
const world = {
  scene: null,
  camera: null,
  renderer: null,
  root: null,
  player: null,
  clock: new THREE.Clock(),
  speed: 0,
  heading: 0,
  cameraLook: new THREE.Vector3(),
  bounds: 28,
  animated: [],
  ai: [],
  bubbles: null,
  materials: {},
  audio: null
};

init();

function init() {
  setupThree();
  createMaterials();
  buildEpisodeCards();
  bindUI();
  bindControls();
  updatePersistentUI();
  buildHomeWorld();
  animate();
  const previewEpisode = new URLSearchParams(location.search).get('episode');
  if (previewEpisode !== null && Number(previewEpisode) >= 0 && Number(previewEpisode) < EPISODES.length) {
    window.setTimeout(() => startEpisode(Number(previewEpisode)), 80);
  }
  window.setTimeout(() => els.loading.classList.add('done'), 500);
}

function setupThree() {
  world.scene = new THREE.Scene();
  world.scene.background = new THREE.Color(0x79d9f0);
  world.scene.fog = new THREE.Fog(0x90dff0, 42, 88);
  world.camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 200);
  world.camera.position.set(16, 16, 24);
  world.renderer = new THREE.WebGLRenderer({ canvas: els.canvas, antialias: true, powerPreference: 'high-performance' });
  world.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  world.renderer.setSize(innerWidth, innerHeight);
  world.renderer.shadowMap.enabled = true;
  world.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  world.renderer.outputColorSpace = THREE.SRGBColorSpace;
  world.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  world.renderer.toneMappingExposure = 1.12;

  const hemi = new THREE.HemisphereLight(0xeaffff, 0x62a55e, 2.45);
  world.scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3d6, 3.2);
  sun.position.set(-22, 32, -12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -42;
  sun.shadow.camera.right = 42;
  sun.shadow.camera.top = 42;
  sun.shadow.camera.bottom = -42;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 90;
  sun.shadow.bias = -0.0005;
  world.scene.add(sun);

  window.addEventListener('resize', () => {
    world.camera.aspect = innerWidth / innerHeight;
    world.camera.updateProjectionMatrix();
    world.renderer.setSize(innerWidth, innerHeight);
  });
}

function createMaterials() {
  const palette = {
    grass: 0x83c96e,
    grass2: 0xa3d57a,
    asphalt: 0x4d6770,
    line: 0xffe273,
    white: 0xfffdf2,
    cream: 0xffedc4,
    ink: 0x173b4c,
    glass: 0xb9ecf2,
    red: 0xf2665d,
    blue: 0x3d95d6,
    yellow: 0xffd34e,
    orange: 0xf4984c,
    green: 0x55b76e,
    pink: 0xf884aa,
    purple: 0x7969c7,
    brown: 0x8f674d,
    gray: 0xabb8b8,
    dark: 0x273b42
  };
  Object.entries(palette).forEach(([key, color]) => {
    world.materials[key] = new THREE.MeshStandardMaterial({ color, roughness: .82, metalness: 0, flatShading: true });
  });
}

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .8, flatShading: true, ...options });
}

function mesh(geometry, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, cast = true, receive = true } = {}) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(x, y, z);
  item.rotation.set(rx, ry, rz);
  item.castShadow = cast;
  item.receiveShadow = receive;
  return item;
}

function clearWorld() {
  if (world.root) {
    world.scene.remove(world.root);
    world.root.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material && !Object.values(world.materials).includes(obj.material)) {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose?.();
      }
    });
  }
  world.root = new THREE.Group();
  world.scene.add(world.root);
  world.player = null;
  world.animated = [];
  world.ai = [];
  world.bubbles = null;
  world.speed = 0;
  state.activeMarkers = [];
}

function addBase({ size = 76, road = true } = {}) {
  const ground = mesh(new THREE.CircleGeometry(size, 64), world.materials.grass, { y: -.12, rx: -Math.PI / 2, receive: true, cast: false });
  world.root.add(ground);
  const outer = mesh(new THREE.RingGeometry(size * .82, size, 64), world.materials.grass2, { y: -.1, rx: -Math.PI / 2, receive: true, cast: false });
  world.root.add(outer);

  if (road) {
    addRoadSegment(new THREE.Vector3(0, 0, -34), new THREE.Vector3(0, 0, 34), 9, true);
    addRoadSegment(new THREE.Vector3(-34, 0, 0), new THREE.Vector3(34, 0, 0), 9, true);
  }
  addTownEdge();
}

function addRoadSegment(from, to, width = 8, dashed = false, material = world.materials.asphalt) {
  const direction = to.clone().sub(from);
  const length = direction.length();
  const center = from.clone().add(to).multiplyScalar(.5);
  const road = mesh(new THREE.BoxGeometry(width, .12, length), material, { x: center.x, y: 0, z: center.z, ry: Math.atan2(direction.x, direction.z), receive: true, cast: false });
  world.root.add(road);
  if (dashed) {
    const pieces = Math.floor(length / 4);
    for (let i = 0; i < pieces; i++) {
      if (i % 2) continue;
      const t = (i + .5) / pieces;
      const p = from.clone().lerp(to, t);
      const line = mesh(new THREE.BoxGeometry(.16, .04, length / pieces * .58), world.materials.line, { x: p.x, y: .09, z: p.z, ry: Math.atan2(direction.x, direction.z), cast: false });
      world.root.add(line);
    }
  }
  return road;
}

function addTownEdge() {
  const treePositions = [
    [-29,-25],[-20,-30],[-10,-31],[10,-31],[21,-28],[30,-20],
    [32,-7],[31,12],[27,26],[15,31],[-3,32],[-18,30],[-29,23],[-32,8],[-31,-9]
  ];
  treePositions.forEach(([x, z], i) => createTree(x, z, .72 + (i % 3) * .12));
  createCloud(-17, 14, -18, 1.3);
  createCloud(18, 18, -7, .9);
  createCloud(3, 21, 24, 1.15);
}

function createTree(x, z, scale = 1) {
  const group = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(.38, .55, 2.4, 7), world.materials.brown, { y: 1.2 });
  const crown = mesh(new THREE.IcosahedronGeometry(1.65, 1), (Math.round(x + z) % 2 ? world.materials.green : world.materials.grass2), { y: 3.25 });
  group.add(trunk, crown);
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  world.root.add(group);
  return group;
}

function createCloud(x, y, z, scale = 1) {
  const group = new THREE.Group();
  [[0,0,0,1.2],[-1,0,0,.8],[1,0,0,.95],[-.1,.5,0,.85]].forEach(([dx,dy,dz,s]) => {
    group.add(mesh(new THREE.SphereGeometry(s, 10, 8), mat(0xffffff, { roughness: 1 }), { x: dx, y: dy, z: dz, cast: false }));
  });
  group.position.set(x,y,z);
  group.scale.setScalar(scale);
  world.root.add(group);
}

function createBuilding({ x = 0, z = 0, width = 9, depth = 5, height = 5, color = 0xffedc4, roof = 0xf2665d, label = '', rotation = 0 }) {
  const group = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(width, height, depth), mat(color), { y: height / 2 });
  const roofMesh = mesh(new THREE.ConeGeometry(Math.max(width, depth) * .72, 2.4, 4), mat(roof), { y: height + 1.1, ry: Math.PI / 4 });
  roofMesh.scale.z = depth / width;
  const door = mesh(new THREE.BoxGeometry(1.8, 2.9, .16), world.materials.blue, { x: 0, y: 1.45, z: depth / 2 + .09 });
  group.add(body, roofMesh, door);
  [-1,1].forEach((side) => {
    const win = mesh(new THREE.BoxGeometry(1.65, 1.4, .17), world.materials.glass, { x: side * width * .29, y: height * .55, z: depth / 2 + .1 });
    group.add(win);
  });
  if (label) {
    const sign = createTextSprite(label, { background: '#fff8dd', color: '#173b4c', width: 430, height: 86, fontSize: 31 });
    sign.position.set(0, height + 1.25, depth / 2 + .42);
    sign.scale.set(5.3, 1.05, 1);
    group.add(sign);
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  world.root.add(group);
  return group;
}

function createSchool(x = 0, z = 14, rotation = 0) {
  const school = createBuilding({ x, z, width: 14, depth: 6.5, height: 6.2, color: 0xffe4a7, roof: 0xf16b5f, label: 'TIRE TOWN SCHOOL', rotation });
  const bell = mesh(new THREE.SphereGeometry(.48, 10, 8), world.materials.yellow, { x: 0, y: 9.15, z: 0 });
  school.add(bell);
  return school;
}

function createCarWash(x = 0, z = 17) {
  const group = new THREE.Group();
  const left = mesh(new THREE.BoxGeometry(2, 5.5, 7), world.materials.blue, { x: -4.5, y: 2.75 });
  const right = left.clone(); right.position.x = 4.5;
  const top = mesh(new THREE.BoxGeometry(11, 1.6, 7), world.materials.blue, { y: 5.5 });
  group.add(left, right, top);
  const sign = createTextSprite('CAR WASH', { background: '#fff2a7', color: '#173b4c', width: 380, height: 95, fontSize: 42 });
  sign.position.set(0, 6.2, 3.7); sign.scale.set(5, 1.25, 1); group.add(sign);
  for (let side of [-1, 1]) {
    const brush = mesh(new THREE.CylinderGeometry(1.15, 1.15, 3.7, 14), side < 0 ? world.materials.pink : world.materials.yellow, { x: side * 2.8, y: 2.4, rx: Math.PI / 2 });
    group.add(brush); world.animated.push({ type: 'spin', object: brush, speed: side * 1.8, axis: 'z' });
  }
  group.position.set(x, 0, z);
  world.root.add(group);
  return group;
}

function createCar(color = 0xf4984c, { truck = true, name = '', face = true, scale = 1 } = {}) {
  const group = new THREE.Group();
  const carMat = mat(color);
  const body = mesh(new THREE.BoxGeometry(3.2, 1.25, 4.5), carMat, { y: 1.15, z: -.2 });
  body.geometry.translate(0, 0, 0);
  const cabin = mesh(new THREE.BoxGeometry(2.85, 1.65, truck ? 2 : 2.8), carMat, { y: 2.25, z: truck ? .9 : .1 });
  const windshield = mesh(new THREE.BoxGeometry(2.3, .9, .12), world.materials.glass, { y: 2.42, z: truck ? 1.94 : 1.52, rx: -.04 });
  group.add(body, cabin, windshield);
  if (truck) {
    const dumper = mesh(new THREE.BoxGeometry(3.1, 1.45, 2.2), carMat, { y: 2.05, z: -1.55, rx: -.05 });
    group.add(dumper);
  }
  const wheelMat = world.materials.dark;
  const hubMat = world.materials.gray;
  const wheels = [];
  [-1.62, 1.62].forEach((x) => [-1.42, 1.42].forEach((z) => {
    const wheel = mesh(new THREE.CylinderGeometry(.68, .68, .48, 14), wheelMat, { x, y: .68, z, rz: Math.PI / 2 });
    const hub = mesh(new THREE.CylinderGeometry(.28, .28, .5, 12), hubMat, { x, y: .68, z, rz: Math.PI / 2 });
    group.add(wheel, hub); wheels.push(wheel, hub);
  }));
  if (face) {
    [-.62, .62].forEach((x) => {
      const eye = mesh(new THREE.SphereGeometry(.15, 10, 8), world.materials.ink, { x, y: 2.48, z: truck ? 2.03 : 1.61 });
      group.add(eye);
    });
    const smile = mesh(new THREE.TorusGeometry(.34, .055, 6, 16, Math.PI), world.materials.ink, { y: 1.15, z: 2.07, rx: 0, ry: 0, rz: Math.PI });
    group.add(smile);
  }
  const lights = [-1.05, 1.05].map((x) => mesh(new THREE.CylinderGeometry(.22, .22, .12, 10), world.materials.cream, { x, y: 1.28, z: 2.08, rx: Math.PI / 2 }));
  group.add(...lights);
  if (name) {
    const label = createTextSprite(name, { background: '#ffffff', color: '#173b4c', width: 250, height: 72, fontSize: 31 });
    label.position.set(0, 4.25, 0); label.scale.set(3.2, .9, 1); group.add(label);
  }
  group.userData.wheels = wheels;
  group.scale.setScalar(scale);
  return group;
}

function createTextSprite(text, { background = '#173b4c', color = '#ffffff', width = 360, height = 90, fontSize = 36 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  roundRect(ctx, 2, 2, width - 4, height - 4, height * .28);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = `900 ${fontSize}px Nunito, Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2 + 2, width - 24);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  return new THREE.Sprite(material);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function createMarker(x, z, label, color = '#ffd84d', radius = 2.5) {
  const group = new THREE.Group();
  const threeColor = new THREE.Color(color);
  const ringMat = new THREE.MeshBasicMaterial({ color: threeColor, transparent: true, opacity: .75, side: THREE.DoubleSide, depthWrite: false });
  const ring = mesh(new THREE.RingGeometry(radius * .72, radius, 32), ringMat, { y: .15, rx: -Math.PI / 2, cast: false, receive: false });
  const innerMat = new THREE.MeshBasicMaterial({ color: threeColor, transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false });
  const inner = mesh(new THREE.CircleGeometry(radius * .7, 32), innerMat, { y: .14, rx: -Math.PI / 2, cast: false, receive: false });
  const beam = mesh(new THREE.CylinderGeometry(.18, .7, 4.5, 16, 1, true), new THREE.MeshBasicMaterial({ color: threeColor, transparent: true, opacity: .14, side: THREE.DoubleSide, depthWrite: false }), { y: 2.25, cast: false, receive: false });
  const text = createTextSprite(label, { background: color, color: '#173b4c', width: 320, height: 88, fontSize: 32 });
  text.position.set(0, 3.35, 0); text.scale.set(3.5, .96, 1);
  group.add(ring, inner, beam, text);
  group.position.set(x, 0, z);
  group.userData = { radius, label, ring, text, baseY: 3.35, active: true };
  world.root.add(group);
  world.animated.push({ type: 'marker', object: group });
  state.activeMarkers.push(group);
  return group;
}

function removeMarker(marker) {
  if (!marker || !marker.parent) return;
  marker.userData.active = false;
  marker.scale.setScalar(1);
  const start = performance.now();
  const shrink = () => {
    const p = Math.min(1, (performance.now() - start) / 250);
    marker.scale.setScalar(1 - p);
    if (p < 1) requestAnimationFrame(shrink); else marker.parent?.remove(marker);
  };
  shrink();
}

function createCone(x, z, color = world.materials.orange) {
  const group = new THREE.Group();
  group.add(mesh(new THREE.CylinderGeometry(.18, .6, 1.4, 12), color, { y: .7 }));
  group.add(mesh(new THREE.BoxGeometry(1.25, .18, 1.25), world.materials.white, { y: .09 }));
  group.position.set(x, 0, z); world.root.add(group); return group;
}

function createStopSign(x, z, rotation = 0) {
  const group = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(.09, .12, 3.1, 8), world.materials.gray, { y: 1.55 });
  const sign = mesh(new THREE.CylinderGeometry(.82, .82, .12, 8), world.materials.red, { y: 3.15, rz: Math.PI / 2 });
  const word = createTextSprite('STOP', { background: '#e95353', color: '#ffffff', width: 220, height: 85, fontSize: 42 });
  word.position.set(0, 3.15, .1); word.scale.set(1.45, .56, 1);
  group.add(pole, sign, word); group.position.set(x,0,z); group.rotation.y = rotation; world.root.add(group); return group;
}

function createParkingSpot(x, z) {
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8, side: THREE.DoubleSide });
  const back = mesh(new THREE.BoxGeometry(4.7, .04, .16), material, { x, y: .15, z: z - 2.5, cast: false });
  const l = mesh(new THREE.BoxGeometry(.16, .04, 5), material, { x: x - 2.25, y: .15, z, cast: false });
  const r = l.clone(); r.position.x = x + 2.25;
  world.root.add(back, l, r);
}

function setPlayer(x, z, heading = 0) {
  const player = createCar(0xf39a45, { truck: true, name: '' });
  player.position.set(x, 0, z);
  player.rotation.y = heading;
  world.root.add(player);
  world.player = player;
  world.heading = heading;
  world.speed = 0;
  snapCamera();
  return player;
}

function snapCamera() {
  if (!world.player) return;
  const forward = new THREE.Vector3(Math.sin(world.heading), 0, Math.cos(world.heading));
  const pos = world.player.position.clone().addScaledVector(forward, -10).add(new THREE.Vector3(0, 6.7, 0));
  world.camera.position.copy(pos);
  world.cameraLook.copy(world.player.position).addScaledVector(forward, 4).add(new THREE.Vector3(0, 1.1, 0));
  world.camera.lookAt(world.cameraLook);
}

function buildHomeWorld() {
  clearWorld();
  state.mode = 'home';
  addBase();
  createSchool(7, 13);
  createCarWash(-18, 16).scale.setScalar(.75);
  createBuilding({ x: 19, z: -15, width: 7, depth: 5, height: 4.5, color: 0xd9eaa4, roof: 0x6b8ed4, label: 'GARAGE', rotation: -Math.PI / 2 });
  const eddy = createCar(0xf39a45, { truck: true, scale: 1.2 });
  eddy.position.set(7, 0, -4); eddy.rotation.y = -.42; world.root.add(eddy);
  const poppy = createCar(0xf884aa, { truck: false, scale: .88 });
  poppy.position.set(13, 0, 1); poppy.rotation.y = -1.1; world.root.add(poppy);
  const zippy = createCar(0x657ee4, { truck: false, scale: .86 });
  zippy.position.set(-2, 0, 8); zippy.rotation.y = 2.35; world.root.add(zippy);
  world.animated.push({ type: 'idleCar', object: eddy, phase: 0 });
  world.animated.push({ type: 'idleCar', object: poppy, phase: 1.2 });
  world.animated.push({ type: 'idleCar', object: zippy, phase: 2.3 });
  world.camera.position.set(23, 14, 28);
  world.cameraLook.set(4, 2, 3);
  world.camera.lookAt(world.cameraLook);
}

function startEpisode(index) {
  clearTimeout(state.completionTimer);
  hideSpeech();
  clearWorld();
  state.mode = 'game';
  state.currentEpisode = index;
  state.stage = 0;
  state.found.clear();
  state.learned.clear();
  state.finished = false;
  state.elapsed = 0;
  localStorage.setItem('tts-last-episode', String(index));
  els.home.classList.add('hidden');
  els.map.classList.add('hidden');
  els.result.classList.add('hidden');
  els.mission.classList.remove('hidden');
  els.speedometer.classList.remove('hidden');
  els.desktopHint.classList.add('game-active');
  els.touchControls.classList.add('game-active');
  updateMissionUI();
  [buildEpisodeOne, buildEpisodeTwo, buildEpisodeThree, buildEpisodeFour, buildEpisodeFive][index]();
  playChime('start');
}

function buildEpisodeOne() {
  addBase({ road: false });
  addRoadSegment(new THREE.Vector3(0,0,-34), new THREE.Vector3(0,0,8), 10, true);
  const lotMat = mat(0x688087);
  world.root.add(mesh(new THREE.BoxGeometry(30,.12,21), lotMat, { y: .01, z: 14, receive: true, cast: false }));
  createSchool(0, 25, Math.PI);
  createParkingSpot(0, 13);
  createParkingSpot(-7, 13);
  createParkingSpot(7, 13);
  createStopSign(-5.7, 2, Math.PI / 2);
  [-1,1].forEach(s => { createCone(s * 4.8, 4); createCone(s * 4.8, 8); });
  setPlayer(0, -22, 0);
  state.target = createMarker(0, -8, 'HELLO!', '#ffd84d', 2.7);
  showSpeech('Eddy · 艾迪', 'My first day of school!', '我的学校第一天！', 'E', '#f39a45');
}

function buildEpisodeTwo() {
  addBase({ road: false });
  const lot = mesh(new THREE.CircleGeometry(24, 40), mat(0x688087), { y: .01, rx: -Math.PI / 2, receive: true, cast: false });
  world.root.add(lot);
  createSchool(0, 23, Math.PI);
  setPlayer(0, -18, 0);
  const friends = [
    { id: 'Poppy', x: -11, z: 3, color: 0xf884aa, truck: false, word: 'FRIEND' },
    { id: 'Dipper', x: 0, z: 9, color: 0x55bfe0, truck: true, word: 'MUSIC' },
    { id: 'Jeb', x: 11, z: 3, color: 0xe5b848, truck: true, word: 'DIRT' }
  ];
  friends.forEach((f, i) => {
    const car = createCar(f.color, { truck: f.truck, name: f.id, scale: .88 });
    car.position.set(f.x, 0, f.z); car.rotation.y = Math.PI; world.root.add(car);
    world.animated.push({ type: 'idleCar', object: car, phase: i * 1.3 });
    const marker = createMarker(f.x, f.z - 4.3, `MEET ${f.id.toUpperCase()}`, ['#f8a9c2','#74d6eb','#f3cf60'][i], 2.2);
    marker.userData.friend = f;
  });
  const balloons = [];
  ['#ff6f79','#ffd84d','#62c77c','#657ee4'].forEach((c, i) => {
    const b = mesh(new THREE.SphereGeometry(.55, 12, 10), mat(c), { x: -13 + i * 1.1, y: 5 + (i % 2), z: 3, cast: false });
    world.root.add(b); balloons.push(b); world.animated.push({ type: 'float', object: b, phase: i });
  });
  state.target = null;
  showSpeech('Poppy · 波比', "Hi! What's your name?", '嗨！你叫什么名字？', 'P', '#f884aa');
}

function buildEpisodeThree() {
  addBase({ road: false });
  const trackMat = mat(0x536970);
  addRoadSegment(new THREE.Vector3(-12,0,-14), new THREE.Vector3(12,0,-14), 8, false, trackMat);
  addRoadSegment(new THREE.Vector3(12,0,-14), new THREE.Vector3(16,0,-5), 8, false, trackMat);
  addRoadSegment(new THREE.Vector3(16,0,-5), new THREE.Vector3(16,0,8), 8, false, trackMat);
  addRoadSegment(new THREE.Vector3(16,0,8), new THREE.Vector3(9,0,15), 8, false, trackMat);
  addRoadSegment(new THREE.Vector3(9,0,15), new THREE.Vector3(-9,0,15), 8, false, trackMat);
  addRoadSegment(new THREE.Vector3(-9,0,15), new THREE.Vector3(-16,0,8), 8, false, trackMat);
  addRoadSegment(new THREE.Vector3(-16,0,8), new THREE.Vector3(-16,0,-5), 8, false, trackMat);
  addRoadSegment(new THREE.Vector3(-16,0,-5), new THREE.Vector3(-12,0,-14), 8, false, trackMat);
  const infield = mesh(new THREE.CircleGeometry(8, 32), world.materials.grass2, { y: .08, rx: -Math.PI / 2, cast: false });
  world.root.add(infield);
  for (let i = -10; i <= 10; i += 2) {
    const color = ((i / 2) % 2) ? world.materials.white : world.materials.ink;
    world.root.add(mesh(new THREE.BoxGeometry(1.8,.05,.6), color, { x: i, y: .17, z: -14, cast: false }));
  }
  const cps = [
    [0,-9,'READY','#ffd84d'], [15,0,'FAST','#65d3ee'], [9,15,'SLOW','#f57d73'], [-12,13,'TURN','#ffd84d'], [-15,-5,'GO!','#65d38a'], [0,-14,'FINISH','#ffffff']
  ];
  state.racePoints = cps.map((p) => new THREE.Vector3(p[0],0,p[1]));
  setPlayer(0, -20, 0);
  state.target = createMarker(...cps[0], 2.3);
  state.raceMarkerIndex = 0;
  const zippy = createCar(0x657ee4, { truck: false, name: 'ZIPPY', scale: .82 });
  zippy.position.set(-3.2,0,-19); world.root.add(zippy);
  world.ai.push({ object: zippy, path: state.racePoints, index: 0, speed: 5.8, loop: true, paused: 2.4 });
  showSpeech('Poppy · 波比', 'Ready, set... go!', '各就各位，预备……出发！', 'P', '#f884aa');
}

function buildEpisodeFour() {
  addBase({ road: false });
  addRoadSegment(new THREE.Vector3(0,0,-30), new THREE.Vector3(0,0,18), 12, true);
  const wall = mesh(new THREE.BoxGeometry(13, 3.2, 1.2), mat(0xd8b27b), { x: 0, y: 1.6, z: 18 });
  world.root.add(wall);
  for (let x = -5; x <= 5; x += 2.5) createCone(x, 13.5);
  const zippy = createCar(0x657ee4, { truck: false, name: 'ZIPPY', scale: .92 });
  zippy.position.set(2.5, 0, 11); zippy.rotation.y = -.3; zippy.rotation.z = .05; world.root.add(zippy);
  state.zippy = zippy;
  const wheel = mesh(new THREE.TorusGeometry(1.1, .36, 12, 24), world.materials.dark, { x: -9, y: 1.1, z: 3, ry: Math.PI / 2 });
  const hub = mesh(new THREE.CylinderGeometry(.4,.4,.35,12), world.materials.gray,{ x:-9,y:1.1,z:3,rz:Math.PI/2 });
  world.root.add(wheel, hub);
  world.animated.push({ type: 'rollWheel', object: wheel, phase: 0 });
  state.looseWheel = wheel; state.looseHub = hub;
  setPlayer(0, -20, 0);
  state.target = createMarker(-9, 3, 'FIND THE WHEEL', '#ffd84d', 2.5);
  showSpeech('Zippy · 齐比', "Oh no! My wheel!", '糟了！我的车轮！', 'Z', '#657ee4');
}

function buildEpisodeFive() {
  addBase({ road: false });
  const path = [new THREE.Vector3(0,0,-25), new THREE.Vector3(0,0,-4), new THREE.Vector3(9,0,5), new THREE.Vector3(4,0,14), new THREE.Vector3(4,0,24)];
  for (let i = 0; i < path.length - 1; i++) addRoadSegment(path[i], path[i+1], 9, true);
  createStopSign(-5, -4, Math.PI / 2);
  createCarWash(4, 28);
  createBuilding({ x: -17, z: 8, width: 7, depth: 5, height: 4.2, color: 0xffe3ae, roof: 0xf08367, label: 'SHOP', rotation: Math.PI/2 });
  setPlayer(0, -25, 0);
  const teacher = createCar(0x2f7596, { truck: true, name: 'MR. GRILL', scale: .9 });
  teacher.position.set(0,0,-16); world.root.add(teacher);
  world.ai.push({ object: teacher, path: path.slice(1), index: 0, speed: 3.2, loop: false, paused: 1.5 });
  const poppy = createCar(0xf884aa, { truck: false, scale: .72 }); poppy.position.set(-3.3,0,-19); world.root.add(poppy);
  world.ai.push({ object: poppy, path: path.slice(1), index: 0, speed: 3, loop: false, paused: 2.4 });
  state.tripPoints = [[0,-4,'STOP','#f36d65'],[9,5,'FOLLOW','#ffd84d'],[4,22,'CAR WASH','#64d5e6']];
  state.tripMarkerIndex = 0;
  state.target = createMarker(...state.tripPoints[0], 2.7);
  showSpeech('Mr. Grill · 格里尔老师', 'Everyone, follow me!', '大家跟我来！', 'M', '#2f7596');
}

function updateGame(dt, time) {
  if (state.mode !== 'game' || !world.player || state.finished) return;
  state.elapsed += dt;
  const maxSpeed = state.currentEpisode === 2 ? 11.5 : 8.5;
  const acceleration = input.forward ? 9.5 : input.back ? -7 : 0;
  if (acceleration) world.speed += acceleration * dt;
  else world.speed *= Math.pow(.12, dt);
  world.speed = THREE.MathUtils.clamp(world.speed, -3.8, maxSpeed);
  if (Math.abs(world.speed) < .03) world.speed = 0;
  const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  if (steer && Math.abs(world.speed) > .15) {
    world.heading += steer * dt * 1.5 * THREE.MathUtils.clamp(Math.abs(world.speed) / 3, .45, 1.3) * Math.sign(world.speed);
  }
  const forward = new THREE.Vector3(Math.sin(world.heading), 0, Math.cos(world.heading));
  world.player.position.addScaledVector(forward, world.speed * dt);
  world.player.position.x = THREE.MathUtils.clamp(world.player.position.x, -world.bounds, world.bounds);
  world.player.position.z = THREE.MathUtils.clamp(world.player.position.z, -world.bounds, world.bounds);
  world.player.rotation.y = world.heading;
  world.player.userData.wheels?.forEach((wheel) => wheel.rotation.x += world.speed * dt * 1.3);

  const desiredCamera = world.player.position.clone().addScaledVector(forward, -10.5).add(new THREE.Vector3(0, 6.8, 0));
  const desiredLook = world.player.position.clone().addScaledVector(forward, 4).add(new THREE.Vector3(0, 1.1, 0));
  world.camera.position.lerp(desiredCamera, 1 - Math.pow(.001, dt));
  world.cameraLook.lerp(desiredLook, 1 - Math.pow(.001, dt));
  world.camera.lookAt(world.cameraLook);

  const displaySpeed = Math.round(Math.abs(world.speed) * 5.2);
  els.speedValue.textContent = displaySpeed;
  els.speedFill.style.width = `${Math.min(100, displaySpeed / 60 * 100)}%`;
  els.speedFill.style.background = displaySpeed > 45 ? '#f47477' : '#ffd84d';

  updateAI(dt);
  updateEpisodeLogic(time);
}

function updateAI(dt) {
  world.ai.forEach((ai) => {
    if (ai.paused > 0) { ai.paused -= dt; return; }
    const target = ai.path[ai.index];
    if (!target) return;
    const delta = target.clone().sub(ai.object.position); delta.y = 0;
    if (delta.length() < .8) {
      ai.index++;
      if (ai.index >= ai.path.length) ai.index = ai.loop ? 0 : ai.path.length - 1;
      return;
    }
    delta.normalize();
    ai.object.position.addScaledVector(delta, ai.speed * dt);
    ai.object.rotation.y = Math.atan2(delta.x, delta.z);
    ai.object.userData.wheels?.forEach((wheel) => wheel.rotation.x += ai.speed * dt * 1.2);
  });
}

function near(object, radius) {
  if (!object || !world.player) return false;
  const dx = object.position.x - world.player.position.x;
  const dz = object.position.z - world.player.position.z;
  return Math.hypot(dx, dz) < radius;
}

function updateEpisodeLogic() {
  if (state.currentEpisode === 0) updateEpisodeOne();
  if (state.currentEpisode === 1) updateEpisodeTwo();
  if (state.currentEpisode === 2) updateEpisodeThree();
  if (state.currentEpisode === 3) updateEpisodeFour();
  if (state.currentEpisode === 4) updateEpisodeFive();
}

function updateEpisodeOne() {
  if (!state.target || !near(state.target, state.target.userData.radius)) return;
  removeMarker(state.target);
  if (state.stage === 0) {
    learnWord('HELLO');
    completeStep(0);
    showSpeech('Eddy · 艾迪', 'Hello, Tire Town!', '你好，轮胎小镇！', 'E', '#f39a45');
    state.stage = 1;
    state.target = createMarker(0, 5, 'SCHOOL', '#69d2e4', 2.7);
  } else if (state.stage === 1) {
    learnWord('SCHOOL');
    completeStep(1);
    showSpeech('Guide · 小向导', 'This is your school.', '这就是你的学校。', '★', '#55b76e');
    state.stage = 2;
    state.target = createMarker(0, 13, 'PARK & STOP', '#ff7f6e', 2.5);
  } else if (state.stage === 2 && Math.abs(world.speed) < 1.2) {
    learnWord('STOP');
    completeStep(2);
    finishEpisode();
  }
}

function updateEpisodeTwo() {
  for (const marker of state.activeMarkers) {
    if (!marker.userData.active || !marker.userData.friend || state.found.has(marker.userData.friend.id)) continue;
    if (!near(marker, marker.userData.radius)) continue;
    const friend = marker.userData.friend;
    state.found.add(friend.id);
    removeMarker(marker);
    learnWord(friend.word);
    completeStep(['Poppy','Dipper','Jeb'].indexOf(friend.id));
    const lines = {
      Poppy: ["I'm Poppy. I like jokes!", '我是波比，我喜欢讲笑话！', 'P', '#f884aa'],
      Dipper: ["I'm Dipper. I play music!", '我是迪珀，我会播放音乐！', 'D', '#55bfe0'],
      Jeb: ["I'm Jeb. I move dirt!", '我是杰布，我会搬运泥土！', 'J', '#e5b848']
    }[friend.id];
    showSpeech(`${friend.id} · 新朋友`, ...lines);
    playChime('collect');
    if (state.found.size === 3) state.completionTimer = setTimeout(finishEpisode, 1400);
    break;
  }
}

function updateEpisodeThree() {
  if (!state.target || !near(state.target, state.target.userData.radius)) return;
  removeMarker(state.target);
  const index = state.raceMarkerIndex;
  if (index === 0) { learnWord('READY'); completeStep(0); }
  if (index === 1) learnWord('FAST');
  if (index === 2) learnWord('SLOW');
  if (index >= 1 && index <= 4) {
    const count = index;
    updateStepLabel(1, `通过 ${count} / 4 个检查点`);
    if (index === 4) completeStep(1);
  }
  if (index === 2 && Math.abs(world.speed) > 8.5) {
    showSpeech('Guide · 安全提示', 'Slow down for the turn!', '转弯要慢下来！', '!', '#f47477');
  } else if (index < 5) {
    showSpeech('Poppy · 波比', ['Ready!','Go fast on the straight!','Slow for the turn!','Nice turn!','Almost there!'][index], ['准备！','直道可以加速！','转弯慢下来！','转得真稳！','马上到终点！'][index], 'P', '#f884aa');
  }
  state.raceMarkerIndex++;
  if (state.raceMarkerIndex >= state.racePoints.length) {
    completeStep(2);
    finishEpisode();
  } else {
    const p = state.racePoints[state.raceMarkerIndex];
    const source = [[0,-9,'READY','#ffd84d'], [15,0,'FAST','#65d3ee'], [9,15,'SLOW','#f57d73'], [-12,13,'TURN','#ffd84d'], [-15,-5,'GO!','#65d38a'], [0,-14,'FINISH','#ffffff']][state.raceMarkerIndex];
    state.target = createMarker(p.x, p.z, source[2], source[3], 2.3);
  }
}

function updateEpisodeFour() {
  if (!state.target || !near(state.target, state.target.userData.radius)) return;
  removeMarker(state.target);
  if (state.stage === 0) {
    learnWord('WHEEL'); completeStep(0);
    world.root.remove(state.looseWheel, state.looseHub);
    const carried = mesh(new THREE.TorusGeometry(.75,.25,10,20), world.materials.dark, { y: 3.35, z: -1.2, rx: Math.PI / 2 });
    world.player.add(carried); state.carriedWheel = carried;
    showSpeech('Eddy · 艾迪', "I'll carry the wheel!", '我来运送车轮！', 'E', '#f39a45');
    learnWord('CARRY'); completeStep(1);
    state.stage = 1;
    state.target = createMarker(2.5, 7.5, 'HELP ZIPPY', '#65d38a', 2.8);
  } else {
    world.player.remove(state.carriedWheel);
    const repaired = mesh(new THREE.TorusGeometry(.75,.25,10,20), world.materials.dark, { x: -1.72, y: .68, z: -1.42, ry: Math.PI / 2 });
    state.zippy.add(repaired);
    learnWord('HELP'); completeStep(2);
    showSpeech('Zippy · 齐比', 'Thank you, Eddy!', '谢谢你，艾迪！', 'Z', '#657ee4');
    state.stage = 2;
    state.completionTimer = setTimeout(finishEpisode, 1400);
  }
}

function updateEpisodeFive() {
  if (!state.target || !near(state.target, state.target.userData.radius)) return;
  const index = state.tripMarkerIndex;
  if (index === 0 && Math.abs(world.speed) > 2.5) {
    showSpeech('Mr. Grill · 格里尔老师', 'Slow down. Stop here!', '慢下来，在这里停车！', 'M', '#2f7596');
    return;
  }
  removeMarker(state.target);
  if (index === 0) { learnWord('STOP'); completeStep(0); }
  if (index === 1) { learnWord('FOLLOW'); completeStep(1); }
  if (index === 2) { learnWord('CAR WASH'); completeStep(2); createWashBubbles(); finishEpisode(); return; }
  showSpeech('Mr. Grill · 格里尔老师', index === 0 ? 'Good stop! Follow me.' : "We're almost there!", index === 0 ? '停得很好！跟我来。' : '我们快到了！', 'M', '#2f7596');
  state.tripMarkerIndex++;
  state.target = createMarker(...state.tripPoints[state.tripMarkerIndex], 2.7);
}

function createWashBubbles() {
  const group = new THREE.Group();
  for (let i = 0; i < 38; i++) {
    const bubble = mesh(new THREE.SphereGeometry(.18 + Math.random() * .34, 10, 8), mat(0xc7f6ff, { transparent: true, opacity: .62, roughness: .15 }), {
      x: 4 + (Math.random() - .5) * 10,
      y: Math.random() * 5,
      z: 23 + Math.random() * 9,
      cast: false
    });
    bubble.userData.speed = .4 + Math.random();
    group.add(bubble);
  }
  world.root.add(group); world.bubbles = group;
}

function completeStep(index) {
  const nodes = [...els.missionSteps.children];
  if (nodes[index]) { nodes[index].classList.remove('active'); nodes[index].classList.add('done'); nodes[index].querySelector('i').textContent = '✓'; }
  const next = nodes.find((node) => !node.classList.contains('done'));
  next?.classList.add('active');
  playChime('collect');
}

function updateStepLabel(index, text) {
  const node = els.missionSteps.children[index];
  if (node) node.querySelector('span').textContent = text;
}

function learnWord(word) {
  state.learned.add(word);
  [...els.wordChips.children].find((chip) => chip.dataset.word === word)?.classList.add('learned');
  speak(word.toLowerCase(), true);
}

function finishEpisode() {
  if (state.finished) return;
  state.finished = true;
  world.speed = 0;
  const episode = EPISODES[state.currentEpisode];
  state.completed.add(state.currentEpisode);
  localStorage.setItem('tts-completed', JSON.stringify([...state.completed]));
  updatePersistentUI();
  playChime('complete');
  state.completionTimer = setTimeout(() => {
    hideSpeech();
    els.resultTitle.textContent = state.currentEpisode === 4 ? 'Adventure complete!' : 'Great job!';
    els.resultCopy.textContent = episode.result;
    els.resultWords.innerHTML = episode.words.map((word) => `<span>${word}</span>`).join('');
    $('#nextButton').querySelector('span').textContent = state.currentEpisode === 4 ? '故事地图' : '下一站';
    $('#nextButton').querySelector('small').textContent = state.currentEpisode === 4 ? 'STORY MAP' : 'NEXT STORY';
    els.result.classList.remove('hidden');
  }, state.currentEpisode === 4 ? 1100 : 600);
}

function updateMissionUI() {
  const ep = EPISODES[state.currentEpisode];
  els.episodePill.textContent = `EPISODE ${ep.number}`;
  els.missionTitle.textContent = ep.title;
  els.missionSubtitle.textContent = ep.zh;
  els.missionPrompt.textContent = ep.prompt;
  els.missionSteps.innerHTML = ep.steps.map((step, i) => `<div class="mission-step ${i === 0 ? 'active' : ''}"><i>${i + 1}</i><span>${step}</span></div>`).join('');
  els.wordChips.innerHTML = ep.words.map((word) => `<span class="word-chip" data-word="${word}">${word}</span>`).join('');
}

function showSpeech(name, english, chinese, avatar = 'E', color = '#f39a45') {
  clearTimeout(state.speechTimer);
  els.speakerName.textContent = name;
  els.speechEnglish.textContent = english;
  els.speechChinese.textContent = chinese;
  els.speakerAvatar.textContent = avatar;
  els.speakerAvatar.style.background = color;
  els.speech.classList.remove('hidden');
  speak(english);
  state.speechTimer = setTimeout(hideSpeech, 3600);
}

function hideSpeech() { els.speech.classList.add('hidden'); }

function speak(text, wordOnly = false) {
  if (!state.sound || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = wordOnly ? .72 : .82;
  utterance.pitch = 1.12;
  utterance.volume = .78;
  speechSynthesis.speak(utterance);
}

function ensureAudio() {
  if (!world.audio) world.audio = new (window.AudioContext || window.webkitAudioContext)();
  if (world.audio.state === 'suspended') world.audio.resume();
}

function playChime(type = 'collect') {
  if (!state.sound) return;
  ensureAudio();
  const ctx = world.audio;
  const notes = type === 'complete' ? [523,659,784,1047] : type === 'start' ? [392,523,659] : type === 'horn' ? [294,247] : [659,880];
  notes.forEach((frequency, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type === 'horn' ? 'square' : 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, ctx.currentTime + i * .1);
    gain.gain.linearRampToValueAtTime(type === 'horn' ? .07 : .05, ctx.currentTime + i * .1 + .015);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + i * .1 + (type === 'horn' ? .22 : .38));
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * .1);
    osc.stop(ctx.currentTime + i * .1 + .42);
  });
}

function horn() {
  if (state.mode !== 'game') return;
  playChime('horn');
  const old = els.missionPrompt.textContent;
  els.missionPrompt.textContent = 'Honk, honk! · 嘟嘟！';
  setTimeout(() => { if (state.mode === 'game') els.missionPrompt.textContent = EPISODES[state.currentEpisode].prompt; }, 800);
}

function buildEpisodeCards() {
  els.cards.innerHTML = EPISODES.map((ep, i) => `
    <button class="episode-card" data-episode="${i}" style="--card-light:${ep.colors[0]};--card-dark:${ep.colors[1]}">
      <span class="card-number">EP ${ep.number}</span>
      <span class="card-status" data-card-status="${i}">○</span>
      <span class="card-art" aria-hidden="true">${ep.art}</span>
      <span class="card-tag">${ep.tag}</span>
      <h3>${ep.title}</h3>
      <p>${ep.zh}</p>
      <span class="card-go">PLAY STORY <b>→</b></span>
    </button>
  `).join('');
  els.cards.querySelectorAll('.episode-card').forEach((card) => card.addEventListener('click', () => startEpisode(Number(card.dataset.episode))));
}

function updatePersistentUI() {
  els.stars.textContent = state.completed.size;
  els.sound.textContent = state.sound ? '🔊' : '🔇';
  document.querySelectorAll('[data-card-status]').forEach((node) => {
    node.textContent = state.completed.has(Number(node.dataset.cardStatus)) ? '★' : '○';
  });
}

function openMap() {
  els.home.classList.add('hidden');
  els.result.classList.add('hidden');
  els.help.classList.add('hidden');
  els.map.classList.remove('hidden');
  if (state.mode === 'game') {
    state.mode = 'paused';
    world.speed = 0;
  }
  hideGameUI();
}

function closeMap() {
  els.map.classList.add('hidden');
  if (world.player && !state.finished) {
    state.mode = 'game';
    showGameUI();
  } else {
    if (state.finished || !world.player) buildHomeWorld();
    else state.mode = 'home';
    els.home.classList.remove('hidden');
  }
}

function showGameUI() {
  els.mission.classList.remove('hidden');
  els.speedometer.classList.remove('hidden');
  els.desktopHint.classList.add('game-active');
  els.touchControls.classList.add('game-active');
}

function hideGameUI() {
  els.mission.classList.add('hidden');
  els.speedometer.classList.add('hidden');
  els.desktopHint.classList.remove('game-active');
  els.touchControls.classList.remove('game-active');
  hideSpeech();
}

function goHome() {
  clearTimeout(state.completionTimer);
  els.map.classList.add('hidden');
  els.result.classList.add('hidden');
  els.help.classList.add('hidden');
  hideGameUI();
  buildHomeWorld();
  els.home.classList.remove('hidden');
}

function bindUI() {
  $('#startButton').addEventListener('click', () => startEpisode(0));
  $('#mapPreview').addEventListener('click', openMap);
  $('#brandButton').addEventListener('click', openMap);
  $('#closeMapButton').addEventListener('click', closeMap);
  $('#continueButton').addEventListener('click', () => startEpisode(state.currentEpisode));
  $('#helpButton').addEventListener('click', () => {
    els.help.classList.remove('hidden');
    if (state.mode === 'game') { state.mode = 'paused'; world.speed = 0; }
  });
  const closeHelp = () => {
    els.help.classList.add('hidden');
    if (world.player && !state.finished) state.mode = 'game';
  };
  $('#closeHelpButton').addEventListener('click', closeHelp);
  $('#gotItButton').addEventListener('click', closeHelp);
  els.sound.addEventListener('click', () => {
    state.sound = !state.sound;
    localStorage.setItem('tts-sound', state.sound ? 'on' : 'off');
    if (!state.sound && 'speechSynthesis' in window) speechSynthesis.cancel();
    updatePersistentUI();
    if (state.sound) playChime('collect');
  });
  $('#replayButton').addEventListener('click', () => startEpisode(state.currentEpisode));
  $('#nextButton').addEventListener('click', () => {
    if (state.currentEpisode < EPISODES.length - 1) startEpisode(state.currentEpisode + 1);
    else openMap();
  });
  $('#hornButton').addEventListener('pointerdown', horn);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.mode === 'game') { state.mode = 'paused'; world.speed = 0; }
    else if (!document.hidden && world.player && !state.finished && !els.map.classList.contains('hidden')) state.mode = 'paused';
    else if (!document.hidden && world.player && !state.finished) state.mode = 'game';
  });
}

function bindControls() {
  const keyMap = {
    KeyW: 'forward', ArrowUp: 'forward', KeyS: 'back', ArrowDown: 'back',
    KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right'
  };
  window.addEventListener('keydown', (event) => {
    if (keyMap[event.code]) { input[keyMap[event.code]] = true; event.preventDefault(); }
    if (event.code === 'Space' && !event.repeat) { horn(); event.preventDefault(); }
    if (event.code === 'Escape') openMap();
  });
  window.addEventListener('keyup', (event) => { if (keyMap[event.code]) input[keyMap[event.code]] = false; });
  document.querySelectorAll('[data-control]').forEach((button) => {
    const control = button.dataset.control;
    const on = (event) => { event.preventDefault(); input[control] = true; button.classList.add('pressed'); };
    const off = (event) => { event.preventDefault(); input[control] = false; button.classList.remove('pressed'); };
    button.addEventListener('pointerdown', on);
    button.addEventListener('pointerup', off);
    button.addEventListener('pointercancel', off);
    button.addEventListener('pointerleave', off);
  });
  window.addEventListener('blur', () => Object.keys(input).forEach((key) => input[key] = false));
}

function animate(time = 0) {
  requestAnimationFrame(animate);
  const dt = Math.min(world.clock.getDelta(), .05);

  if (state.mode === 'home') {
    const t = time * .00008;
    const target = new THREE.Vector3(4, 2.2, 3);
    const baseAngle = .74 + Math.sin(t) * .04;
    world.camera.position.x = target.x + Math.sin(baseAngle) * 33;
    world.camera.position.z = target.z + Math.cos(baseAngle) * 33;
    world.camera.position.y = 15 + Math.sin(t * 1.7) * .5;
    world.camera.lookAt(target);
  }

  world.animated.forEach((item) => {
    if (!item.object?.parent) return;
    if (item.type === 'marker') {
      item.object.rotation.y += dt * .55;
      item.object.userData.text.position.y = item.object.userData.baseY + Math.sin(time * .003) * .18;
      item.object.userData.ring.material.opacity = .55 + Math.sin(time * .004) * .22;
    } else if (item.type === 'spin') {
      item.object.rotation[item.axis] += dt * item.speed;
    } else if (item.type === 'idleCar') {
      item.object.position.y = Math.sin(time * .002 + item.phase) * .035;
    } else if (item.type === 'float') {
      item.object.position.y += Math.sin(time * .003 + item.phase) * .002;
    } else if (item.type === 'rollWheel') {
      item.object.rotation.x = Math.sin(time * .002) * .15;
    }
  });

  if (world.bubbles) {
    world.bubbles.children.forEach((bubble) => {
      bubble.position.y += bubble.userData.speed * dt;
      if (bubble.position.y > 7) bubble.position.y = 0;
    });
  }
  updateGame(dt, time);
  world.renderer.render(world.scene, world.camera);
}
