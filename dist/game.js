import * as THREE from "./vendor/three.module.min.js";

const size = 6;
const levels = [
  { name: 'Flywheel', view: [42, 50], action: 'spinning', source: [0, 4], destination: [5, 1],
    obstacles: [[3, 4], [3, 2], [4, 3]], build: buildFlywheel },
  { name: 'Ventilation fan', view: [-39, 54], action: 'ventilating', source: [0, 1], destination: [5, 4],
    obstacles: [[3, 0], [3, 1], [3, 2], [3, 3], [3, 5], [1, 3]], build: buildFan },
  { name: 'Steam press', view: [44, 53], action: 'stamping', source: [0, 5], destination: [5, 0],
    obstacles: [[3, 5], [2, 3], [2, 2], [4, 4], [4, 3], [4, 2], [4, 1]], build: buildPress },
  {
    name: 'Split shift', view: [-42, 57], source: [0, 2], junctions: ['tee'],
    obstacles: [[2, 1], [3, 3], [4, 3], [1, 4], [3, 5]],
    fixed: [[3, 2, 'straight', 0], [2, 4, 'elbow', 3]],
    receivers: [
      { position: [5, 2], build: buildFlywheel },
      { position: [5, 4], build: buildFan },
    ],
  },
  {
    name: 'Cross pressure', view: [40, 59], source: [0, 2], junctions: ['tee', 'cross'],
    obstacles: [[1, 1], [1, 3], [3, 0], [3, 3], [4, 3], [3, 5]],
    fixed: [[2, 1, 'elbow', 0], [3, 2, 'straight', 0], [2, 3, 'straight', 1], [3, 4, 'straight', 0]],
    receivers: [
      { position: [5, 1], build: buildFan },
      { position: [5, 2], build: buildFlywheel },
      { position: [5, 4], build: buildPress },
    ],
  },
  {
    name: 'Factory manifold', view: [-44, 61], source: [0, 3], junctions: ['tee', 'cross'],
    obstacles: [[1, 2], [1, 4], [3, 2], [4, 2], [4, 4], [2, 0], [4, 0]],
    fixed: [[2, 2, 'straight', 1], [3, 1, 'straight', 0], [4, 3, 'straight', 0],
      [3, 5, 'elbow', 3], [2, 4, 'straight', 1]],
    receivers: [
      { position: [5, 1], build: buildFan },
      { position: [5, 3], build: buildFlywheel },
      { position: [5, 5], build: buildPress },
      { position: [2, 5], port: 3, build: buildFan },
    ],
  },
  {
    name: 'First rise', view: [-34, 55], source: [0, 3], destination: [5, 3],
    machineName: 'Flywheel', action: 'spinning', build: buildFlywheel, obstacles: [],
    terrain: wallColumn(3, 1), fixed: [[3, 3, 'straight', 0]],
  },
  {
    name: 'Upper gallery', view: [-36, 57], source: [0, 2], destination: [5, 2],
    machineName: 'Twin compressor', action: 'compressing', build: buildCompressor, obstacles: [],
    terrain: [...wallColumn(3, 1), ...wallColumn(4, 2), [5, 2, 2, 'wall']],
    fixed: [[4, 2, 'straight', 0]],
  },
  {
    name: 'Casting yard', view: [38, 56], source: [0, 4], destination: [5, 3],
    machineName: 'Steam press', action: 'stamping', build: buildPress, bendRisers: true,
    terrain: [[2, 3, 1], [3, 3, 1]], fixed: [[3, 3, 'straight', 0]],
    obstacles: [[3, 0], [3, 1], [3, 2], [3, 4], [3, 5]],
  },
  {
    name: 'Foundry steps', view: [-35, 60], source: [0, 4], destination: [5, 2],
    machineName: 'Beam pump', action: 'pumping', build: buildBeamPump, bendRisers: true,
    terrain: [[2, 3, 1], [2, 2, 2], [3, 2, 2], [4, 2, 1], [5, 2, 1]],
    obstacles: [[3, 3], [3, 4], [2, 1], [3, 1], [4, 1]],
    fixed: [[4, 2, 'riser', 2]],
  },
  {
    name: 'Over the parapet', view: [-40, 61], source: [0, 4], destination: [5, 3],
    machineName: 'Centrifugal governor', action: 'regulating', build: buildGovernor, bendRisers: true,
    terrain: [...wallColumn(3, 1).filter(([, z]) => z !== 3),
      [3, 3, 2], [4, 3, 1], [5, 3, 1, 'wall']],
    obstacles: [[2, 2], [4, 2], [4, 4]],
    fixed: [[3, 3, 'elbow', 0], [4, 3, 'riser', 2]],
  },
  {
    name: 'Terraced works', view: [-43, 62], source: [0, 3], junctions: ['tee', 'cross'], bendRisers: true,
    terrain: [...wallColumn(3, 1).slice(0, 5), [3, 5, 2], [4, 5, 2], [5, 5, 2]],
    obstacles: [[2, 2], [2, 4], [4, 2], [4, 4]],
    fixed: [[3, 5, 'elbow', 3], [4, 5, 'straight', 0]],
    receivers: [
      { position: [5, 3], build: buildFlywheel },
      { position: [5, 5], build: buildPress },
    ],
  },
  {
    name: 'First fitting', tutorial: true, view: [42, 50], source: [0, 4], destination: [5, 1],
    machineName: 'Flywheel', action: 'spinning', build: buildFlywheel, obstacles: [[3, 2], [3, 4]],
    fixed: [[2, 3, 'straight', 1], [2, 2, 'straight', 1],
      [2, 1, 'elbow', 0], [3, 1, 'straight', 0], [4, 1, 'straight', 0]],
  },
];
function wallColumn(x, height) {
  return Array.from({ length: size }, (_, z) => [x, z, height, 'wall']);
}

const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const pipePorts = {
  straight: [0, 2], elbow: [0, 1], tee: [0, 1, 2], cross: [0, 1, 2, 3],
  riser: [2, 0], 'riser-elbow': [2, 3],
};
const rotationCount = { straight: 2, elbow: 4, tee: 4, cross: 1, riser: 4, 'riser-elbow': 4 };
const riseByPort = { riser: [0, 1], 'riser-elbow': [0, 1] };
const key = (x, z) => z * size + x;
const inside = (x, z) => x >= 0 && z >= 0 && x < size && z < size;
const world = n => n - (size - 1) / 2;
let level;
const pipeHeight = 0.27;
const heightStep = 0.68;
const maxHeight = 2;
const stage = document.querySelector('#stage');
const giftCase = document.querySelector('.gift-case');
const openBoxButton = document.querySelector('#open-box');
const drawerLatch = document.querySelector('#drawer-latch');
const drawerPanel = document.querySelector('#drawer-panel');
const drawerLabel = document.querySelector('#drawer-label');
const selectedTool = document.querySelector('#selected-tool');
const turnPiece = document.querySelector('#turn-piece');
const undoButton = document.querySelector('#undo');
const redoButton = document.querySelector('#redo');
const soundButton = document.querySelector('#sound');
const rewardPlate = document.querySelector('#reward-plate');
const rewardLabel = document.querySelector('#reward-label');
const rewardLatch = document.querySelector('#reward-latch');
let drawerOpen = false;
let drawerDiscovered = false;
const status = document.querySelector('#status');
const pressureMeter = document.querySelector('#pressure');
const pressureReadout = document.querySelector('#pressure-value');
const pressureHand = document.querySelector('#pressure-hand');

const scene = new THREE.Scene();
const tray = new THREE.Group();
scene.add(tray);
const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 40);
const viewDistance = 17;
let viewTurns = 0;
let overhead = false;

let inspectingLid = false;
function aimCamera() {
  if (inspectingLid) {
    camera.position.set(0, 4.25, 0.12);
    camera.lookAt(0, 0.77, -4.31);
    camera.updateMatrixWorld();
    return;
  }
  const [heading, tilt] = level.view;
  const azimuth = THREE.MathUtils.degToRad(overhead ? 0 : heading);
  const elevation = THREE.MathUtils.degToRad(overhead ? 89.99 : tilt);
  camera.position.set(
    Math.sin(azimuth) * Math.cos(elevation) * viewDistance,
    Math.sin(elevation) * viewDistance,
    Math.cos(azimuth) * Math.cos(elevation) * viewDistance,
  );
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
stage.append(renderer.domElement);

const reflectionCanvas = document.createElement('canvas');
reflectionCanvas.width = 256;
reflectionCanvas.height = 128;
const reflectionPaint = reflectionCanvas.getContext('2d');
reflectionPaint.fillStyle = '#373b39';
reflectionPaint.fillRect(0, 0, 256, 128);
for (const [x, y, radius, color] of [
  [54, 30, 57, '#ffd6ad'], [169, 36, 41, '#79a3b4'], [226, 42, 28, '#b7c5be'],
]) {
  const light = reflectionPaint.createRadialGradient(x, y, 2, x, y, radius);
  light.addColorStop(0, color);
  light.addColorStop(1, 'transparent');
  reflectionPaint.fillStyle = light;
  reflectionPaint.fillRect(0, 0, 256, 128);
}
const reflection = new THREE.CanvasTexture(reflectionCanvas);
reflection.colorSpace = THREE.SRGBColorSpace;
reflection.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = reflection;
scene.environmentIntensity = 0.72;

scene.add(new THREE.HemisphereLight(0xc5cbea, 0x665043, 1.42));
const sun = new THREE.DirectionalLight(0xffc894, 3.38);
sun.position.set(-4, 7, 2);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 20 });
sun.shadow.normalBias = 0.022;
sun.shadow.bias = -0.0002;
scene.add(sun);
const rim = new THREE.DirectionalLight(0x9ca9f8, 1.25);
rim.position.set(3, 4, -6);
scene.add(rim);

function material(color, metalness = 0.35, roughness = 0.48) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

const iron = material(0x51575a, 0.69, 0.39);
const pipeSteel = material(0x767c84, 0.77, 0.30);
const gasket = material(0x30241e, 0.32, 0.62);
const boilerCopper = material(0x9e532e, 0.72, 0.43);
const castSteel = material(0x635e58, 0.5, 0.67);
const bronze = material(0x946134, 0.69, 0.46);
const gaugeRed = new THREE.MeshStandardMaterial({
  color: 0xc62916, emissive: 0x7b180a, emissiveIntensity: 0.38, roughness: 0.55,
});
const frame = material(0x553423, 0.14, 0.57);
const velvet = material(0x141e47, 0.06, 0.96);
const enamelBlue = material(0x203866, 0.53, 0.36);
const dark = material(0x171c1b, 0.2);
const brass = material(0xd6a05b, 0.76, 0.28);
const machineEnamel = material(0x273c60, 0.48, 0.40);
const wallFinish = material(0x534b43, 0.42, 0.7);
const platformFinish = material(0x475d59, 0.42, 0.62);
const deckFinish = material(0x776655, 0.38, 0.72);
const riserFinish = material(0x995d38, 0.62, 0.43);
const fixedPipeFinish = material(0x468e9f, 0.48, 0.4);
const collarActive = brass.clone();
collarActive.emissive.setHex(0x9c470c);
collarActive.emissiveIntensity = 0.58;
const machineryRed = material(0x98412d, 0.48, 0.48);
const rivetGeometry = new THREE.SphereGeometry(0.022, 8, 6);
const boltGeometry = new THREE.CylinderGeometry(0.047, 0.047, 0.035, 6);

function mesh(geometry, finish, parent, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, finish);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function box(parent, finish, w, h, d, x, y, z) {
  return mesh(new THREE.BoxGeometry(w, h, d), finish, parent, x, y, z);
}

const beveledParts = new Map();

function castBlock(parent, finish, w, h, d, x, y, z, bevel) {
  const dimensions = [w, h, d, bevel].join(',');
  if (!beveledParts.has(dimensions)) {
    const halfWidth = w / 2 - bevel;
    const halfDepth = d / 2 - bevel;
    const shape = new THREE.Shape().moveTo(-halfWidth, -halfDepth).lineTo(halfWidth, -halfDepth)
      .lineTo(halfWidth, halfDepth).lineTo(-halfWidth, halfDepth).closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: h - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.center();
    beveledParts.set(dimensions, geometry);
  }
  return mesh(beveledParts.get(dimensions), finish, parent, x, y, z);
}

function cylinder(parent, finish, radius, length, x, y, z, axis = 'y') {
  const object = mesh(new THREE.CylinderGeometry(radius, radius, length, 24), finish, parent, x, y, z);
  if (axis === 'x') object.rotation.z = Math.PI / 2;
  if (axis === 'z') object.rotation.x = Math.PI / 2;
  return object;
}

function atTile(x, z, parent, height = 0) {
  const group = new THREE.Group();
  group.position.set(world(x), height * heightStep, world(z));
  group.userData.position = [x, z];
  parent.add(group);
  return group;
}

function bolts(parent, spread, height) {
  for (const x of [-spread, spread]) {
    for (const z of [-spread, spread]) mesh(boltGeometry, brass, parent, x, height, z);
  }
}

const floor = mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.29 }), scene, 0, -1.71, 0);
floor.rotation.x = -Math.PI / 2;
floor.castShadow = false;
const boxWidth = 7.24;
const plinth = material(0x281a17, 0.17, 0.58);
castBlock(tray, plinth, boxWidth + 0.13, 0.15, boxWidth + 0.13, 0, -0.71, 0, 0.046);
castBlock(tray, frame, boxWidth, 0.59, boxWidth, 0, -0.37, 0, 0.066);
castBlock(tray, velvet, 6.87, 0.16, 6.87, 0, -0.122, 0, 0.036);

const filigree = new THREE.Shape();
filigree.moveTo(0, -0.094);
filigree.quadraticCurveTo(-0.024, -0.064, -0.017, -0.027);
filigree.bezierCurveTo(-0.06, -0.103, -0.098, -0.002, -0.045, 0.014);
filigree.quadraticCurveTo(-0.063, -0.031, -0.015, -0.002);
filigree.bezierCurveTo(-0.026, 0.033, -0.019, 0.052, 0, 0.09);
filigree.bezierCurveTo(0.019, 0.052, 0.026, 0.033, 0.015, -0.002);
filigree.quadraticCurveTo(0.063, -0.031, 0.045, 0.014);
filigree.bezierCurveTo(0.098, -0.002, 0.06, -0.103, 0.017, -0.027);
filigree.quadraticCurveTo(0.024, -0.064, 0, -0.094);
filigree.closePath();
const crestGeometry = new THREE.ExtrudeGeometry(filigree, {
  depth: 0.009, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 1,
});
const lidHinge = new THREE.CylinderGeometry(0.048, 0.048, 0.17, 16);
const inlay = material(0xc99755, 0.63, 0.34);
for (let side = 0; side < 4; side++) {
  const rail = new THREE.Group();
  rail.rotation.y = side * Math.PI / 2;
  tray.add(rail);
  castBlock(rail, frame, boxWidth, 0.30, 0.24, 0, -0.105, 3.496, 0.042);
  castBlock(rail, velvet, 6.83, 0.085, 0.26, 0, -0.031, 3.238, 0.024);
  for (const z of [3.39, 3.567]) {
    box(rail, inlay, 6.83, 0.014, 0.020, 0, 0.048, z);
  }
  for (const y of [-0.265, -0.548]) {
    box(rail, bronze, 6.98, 0.017, 0.018, 0, y, 3.627);
  }
  for (const x of [-1.35, 1.35]) {
    castBlock(rail, brass, 0.37, 0.17, 0.049, x, -0.206, 3.636, 0.022);
    const knuckle = mesh(lidHinge, bronze, rail, x, -0.121, 3.649);
    knuckle.rotation.z = Math.PI / 2;
    for (const dx of [-0.115, 0.115]) mesh(rivetGeometry, bronze, rail, x + dx, -0.22, 3.664);
  }
  const badge = new THREE.Group();
  badge.position.set(0, -0.395, 3.635);
  rail.add(badge);
  const escutcheon = castBlock(badge, bronze, 0.36, 0.216, 0.046, 0, 0, 0, 0.018);
  escutcheon.rotation.z = Math.PI / 4;
  mesh(new THREE.CircleGeometry(0.142, 32), brass, badge, 0, 0, 0.027);
  mesh(new THREE.CircleGeometry(0.119, 32), enamelBlue, badge, 0, 0, 0.030);
  mesh(crestGeometry, inlay, badge, 0, 0.005, 0.034);
}
for (const x of [-3.49, 3.49]) {
  for (const z of [-3.49, 3.49]) {
    castBlock(tray, frame, 0.50, 0.17, 0.50, x * 0.86, -0.827, z * 0.86, 0.066);
    castBlock(tray, bronze, 0.52, 0.052, 0.52, x * 0.86, -0.87, z * 0.86, 0.022);
    castBlock(tray, brass, 0.34, 0.076, 0.34, x, 0.041, z, 0.028).rotation.y = Math.PI / 4;
    const crest = mesh(crestGeometry, enamelBlue, tray, x, 0.082, z);
    crest.rotation.set(-Math.PI / 2, 0, Math.atan2(x, z));
  }
}

const tiles = [];
const textureSize = 128;

function randomTextureSample() {
  let seed = 1837;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// A repeating noise field gives the castings uneven wear even when the UVs span several tiles.
function noiseField(columns, rows, random) {
  const grid = Array.from({ length: columns * rows }, random);
  return (u, v) => {
    const x = u * columns;
    const y = v * rows;
    const col = Math.floor(x);
    const row = Math.floor(y);
    const fx = x - col;
    const fy = y - row;
    const tx = fx * fx * (3 - 2 * fx);
    const ty = fy * fy * (3 - 2 * fy);
    const a = grid[row * columns + col];
    const b = grid[row * columns + (col + 1) % columns];
    const c = grid[((row + 1) % rows) * columns + col];
    const d = grid[((row + 1) % rows) * columns + (col + 1) % columns];
    return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, tx), THREE.MathUtils.lerp(c, d, tx), ty);
  };
}

function surfaceTexture(kind) {
  const random = randomTextureSample();
  const wear = noiseField(7, 7, random);
  const grain = kind === 'brushed' ? noiseField(3, 53, random) : noiseField(42, 42, random);
  const pixels = new Uint8Array(textureSize * textureSize * 4);
  for (let y = 0; y < textureSize; y++) {
    for (let x = 0; x < textureSize; x++) {
      const u = x / textureSize;
      const v = y / textureSize;
      const tarnish = wear(u, v);
      const tooth = grain(u, v);
      const speck = random();
      const shade = kind === 'enamel'
        ? 211 + 31 * tarnish + 10 * tooth - (speck < 0.018 ? 70 : 0)
        : 195 + 36 * tarnish + 20 * tooth - (speck < 0.05 ? 47 : 0);
      const warmth = (1 - tarnish) * 11;
      const i = (y * textureSize + x) * 4;
      pixels.set([Math.min(255, shade + warmth), shade, shade - warmth, 255], i);
    }
  }
  // Offset paired dark and bright strokes give scratches a lip that also catches the normal lighting.
  const brushed = kind === 'brushed';
  const scratchCount = brushed ? 105 : 37;
  for (let i = 0; i < scratchCount; i++) {
    const x = Math.floor(random() * textureSize);
    const y = Math.floor(random() * textureSize);
    const length = 3 + Math.floor(random() * (brushed ? 23 : 13));
    const slope = (random() - 0.5) * (brushed ? 0.08 : 1.2);
    for (let step = 0; step < length; step++) {
      const row = y + Math.round(step * slope);
      const col = (x + step) & (textureSize - 1);
      const wear = Math.sin(Math.PI * step / length) * (brushed ? 19 : 32);
      for (const [offset, amount] of [[0, -wear], [1, wear * 0.48]]) {
        const base = (((row + offset) & (textureSize - 1)) * textureSize + col) * 4;
        for (let channel = 0; channel < 3; channel++) {
          pixels[base + channel] = THREE.MathUtils.clamp(pixels[base + channel] + amount, 0, 255);
        }
      }
    }
  }
  const albedo = new THREE.DataTexture(pixels, textureSize, textureSize);
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping;
  albedo.magFilter = THREE.LinearFilter;
  albedo.minFilter = THREE.LinearMipmapLinearFilter;
  albedo.generateMipmaps = true;
  albedo.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const relief = albedo.clone();
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.needsUpdate = relief.needsUpdate = true;
  return { map: albedo, bumpMap: relief, roughnessMap: relief };
}

const castTexture = surfaceTexture('cast');
const brushedTexture = surfaceTexture('brushed');
const enamelTexture = surfaceTexture('enamel');
const tileFinishes = [0xe1cfb4, 0xd3bea2, 0xd9c6aa, 0xdecaad].map(color => material(color, 0.06, 0.70));

function makeWoodTexture() {
  const random = randomTextureSample();
  const rings = noiseField(7, 53, random);
  const shade = noiseField(4, 7, random);
  const pixels = new Uint8Array(textureSize * textureSize * 4);
  for (let y = 0; y < textureSize; y++) {
    for (let x = 0; x < textureSize; x++) {
      const u = x / textureSize;
      const v = y / textureSize;
      const grain = rings(u, (v + 0.026 * Math.sin(u * Math.PI * 2) + 1) % 1);
      const light = 145 + 62 * grain + 31 * shade(u, v);
      pixels.set([light, light * 0.85, light * 0.73, 255], (y * textureSize + x) * 4);
    }
  }
  const wood = new THREE.DataTexture(pixels, textureSize, textureSize);
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.colorSpace = THREE.SRGBColorSpace;
  wood.minFilter = THREE.LinearMipmapLinearFilter;
  wood.magFilter = THREE.LinearFilter;
  wood.generateMipmaps = true;
  wood.needsUpdate = true;
  return wood;
}

function makeTileTexture() {
  const tile = document.createElement('canvas');
  tile.width = tile.height = 256;
  const ctx = tile.getContext('2d');
  const wash = ctx.createLinearGradient(11, 5, 242, 257);
  wash.addColorStop(0, '#f7ebd1');
  wash.addColorStop(0.55, '#ebdcc4');
  wash.addColorStop(1, '#d5bda0');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 256, 256);
  const random = randomTextureSample();
  for (let i = 0; i < 40; i++) {
    const x = random() * 256;
    const y = random() * 256;
    const radius = 12 + random() * 29;
    const stain = ctx.createRadialGradient(x, y, 0, x, y, radius);
    stain.addColorStop(0, `rgba(94, 66, 44, ${random() * 0.12})`);
    stain.addColorStop(1, 'transparent');
    ctx.fillStyle = stain;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  for (let i = 0; i < 3500; i++) {
    ctx.fillStyle = `rgba(102, 71, 47, ${random() * 0.12})`;
    ctx.fillRect(random() * 256, random() * 256, 2, 2);
  }
  ctx.strokeStyle = '#8b694eac';
  ctx.lineWidth = 2;
  ctx.strokeRect(13, 13, 230, 230);
  ctx.strokeStyle = '#9e765072';
  ctx.strokeRect(19, 19, 218, 218);
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.translate(128, 128);
    ctx.rotate(i * Math.PI / 2);
    ctx.translate(-128, -128);
    ctx.strokeStyle = '#99744e9c';
    ctx.beginPath();
    ctx.moveTo(14, 57);
    ctx.bezierCurveTo(29, 45, 27, 26, 56, 15);
    ctx.moveTo(18, 46);
    ctx.bezierCurveTo(34, 39, 39, 35, 40, 18);
    ctx.moveTo(21, 36);
    ctx.bezierCurveTo(40, 30, 32, 21, 25, 24);
    ctx.stroke();
    ctx.fillStyle = '#99744e78';
    ctx.beginPath();
    ctx.ellipse(29, 40, 2, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.translate(128, 127);
  ctx.fillStyle = '#916b4696';
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.bezierCurveTo(-13, 7, -21, -7, -12, -25);
  ctx.quadraticCurveTo(0, -40, 12, -25);
  ctx.bezierCurveTo(21, -7, 13, 7, 0, 20);
  ctx.moveTo(-4, 12);
  ctx.bezierCurveTo(-12, -1, -37, -17, -35, 3);
  ctx.quadraticCurveTo(-33, 16, -22, 11);
  ctx.quadraticCurveTo(-28, 2, -4, 12);
  ctx.moveTo(4, 12);
  ctx.bezierCurveTo(12, -1, 37, -17, 35, 3);
  ctx.quadraticCurveTo(33, 16, 22, 11);
  ctx.quadraticCurveTo(28, 2, 4, 12);
  ctx.fill();
  ctx.fillRect(-13, 14, 26, 4);
  ctx.beginPath();
  ctx.moveTo(0, 15);
  ctx.quadraticCurveTo(12, 25, 7, 29);
  ctx.quadraticCurveTo(1, 28, 0, 34);
  ctx.quadraticCurveTo(-1, 28, -7, 29);
  ctx.quadraticCurveTo(-12, 25, 0, 15);
  ctx.fill();
  const texture = new THREE.CanvasTexture(tile);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

const tileTexture = makeTileTexture();
for (const finish of tileFinishes) {
  Object.assign(finish, castTexture, { map: tileTexture, bumpScale: 0.013 });
}
for (const finish of [deckFinish, wallFinish, platformFinish, castSteel]) {
  Object.assign(finish, castTexture, { bumpScale: 0.022 });
}
Object.assign(frame, brushedTexture, { map: makeWoodTexture(), bumpScale: 0.012 });
Object.assign(velvet, enamelTexture, { bumpScale: 0.024 });
Object.assign(boilerCopper, castTexture, { bumpScale: 0.020 });
for (const finish of [iron, pipeSteel, bronze, brass, collarActive, riserFinish]) {
  Object.assign(finish, brushedTexture, { bumpScale: 0.009 });
}
for (const finish of [machineEnamel, enamelBlue, machineryRed, fixedPipeFinish]) {
  Object.assign(finish, enamelTexture, { bumpScale: 0.012 });
}
const tileShape = new THREE.Shape().moveTo(-0.46, -0.46).lineTo(0.46, -0.46)
  .lineTo(0.46, 0.46).lineTo(-0.46, 0.46).closePath();
const tileGeometry = new THREE.ExtrudeGeometry(tileShape, {
  depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.024, bevelSegments: 2,
});
tileGeometry.rotateX(-Math.PI / 2);
const tilePositions = tileGeometry.attributes.position;
const tileUvs = tileGeometry.attributes.uv;
for (let i = 0; i < tilePositions.count; i++) {
  tileUvs.setXY(i, tilePositions.getX(i) + 0.5, tilePositions.getZ(i) + 0.5);
}
for (let z = 0; z < size; z++) {
  for (let x = 0; x < size; x++) {
    const tile = mesh(tileGeometry, tileFinishes[(x * 7 + z * 11 + x * z) % 4], tray, world(x), -0.101, world(z));
    tile.userData.position = [x, z];
    tiles.push(tile);
  }
}
function markBoardEdge(labels, x, z, angle) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'italic 42px Georgia';
  ctx.fillStyle = '#edc68b';
  ctx.shadowColor = '#100b16';
  ctx.shadowOffsetY = 2;
  for (const [i, text] of [...labels].entries()) {
    ctx.fillText(text, (i + 0.5) * 128, 32);
  }
  const goldPrint = new THREE.CanvasTexture(canvas);
  goldPrint.colorSpace = THREE.SRGBColorSpace;
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.29),
    new THREE.MeshBasicMaterial({ map: goldPrint, transparent: true, depthWrite: false, toneMapped: false }));
  strip.position.set(x, 0.024, z);
  strip.rotation.x = -Math.PI / 2;
  strip.rotateZ(angle);
  tray.add(strip);
}

markBoardEdge('123456', 0, -3.23, 0);
markBoardEdge('654321', 0, 3.23, Math.PI);
markBoardEdge('ABCDEF', -3.23, 0, -Math.PI / 2);
markBoardEdge('FEDCBA', 3.23, 0, Math.PI / 2);

function buildTerrain(group, terrain) {
  for (const [x, z, height, kind] of terrain) {
    const support = atTile(x, z, group, height);
    const wall = kind === 'wall';
    const width = wall ? 0.99 : 0.88;
    for (let step = 0; step < height; step++) {
      const y = -(step + 0.5) * heightStep;
      castBlock(support, wall ? wallFinish : platformFinish,
        width, heightStep, width, 0, y, 0, 0.028);
      castBlock(support, bronze, width + 0.006, 0.04, width + 0.006,
        0, y - heightStep * 0.29, 0, 0.011);
    }
    castBlock(support, deckFinish, 0.91, 0.074, 0.91, 0, -0.036, 0, 0.018);
    bolts(support, 0.37, 0.018);
  }
}

function buildLevel(definition) {
  const group = new THREE.Group();
  group.visible = false;
  tray.add(group);
  const terrain = definition.terrain ?? [];
  const heights = new Map(terrain.map(([x, z, height]) => [key(x, z), height]));
  buildTerrain(group, terrain);
  for (const [x, z] of definition.obstacles) {
    const block = atTile(x, z, group);
    castBlock(block, dark, 0.85, 0.10, 0.85, 0, 0.05, 0, 0.025);
    castBlock(block, castSteel, 0.77, 0.38, 0.77, 0, 0.25, 0, 0.043);
    castBlock(block, bronze, 0.805, 0.025, 0.805, 0, 0.361, 0, 0.009);
    castBlock(block, iron, 0.81, 0.075, 0.81, 0, 0.407, 0, 0.019);
    bolts(block, 0.294, 0.459);
  }

  const boiler = atTile(...definition.source, group, heights.get(key(...definition.source)) ?? 0);
  const gaugeNeedle = buildBoiler(boiler, definition.view[0]);

  const receivers = definition.receivers ?? [{ position: definition.destination, build: definition.build }];
  return {
    ...definition, group, gaugeNeedle, pressure: 0, targetPressure: 0, pressureVelocity: 0,
    completionTime: 0, rewardShown: false, solved: false, past: [], future: [],
    machines: new Map(receivers.map(({ position, port = 2, build }) => [
      key(...position), buildReceiver(group, position, port, build, heights.get(key(...position)) ?? 0),
    ])),
    heights,
    sourceKey: key(...definition.source),
    blocked: new Set(definition.obstacles.map(position => key(...position))),
    pipes: new Map(),
    fixtureBounds: group.children.flatMap(fixture => boxCorners(new THREE.Box3().setFromObject(fixture))),
  };
}

function buildBoiler(boiler, heading) {
  castBlock(boiler, frame, 0.94, 0.10, 0.89, 0, 0.051, 0, 0.025);
  castBlock(boiler, bronze, 0.89, 0.033, 0.84, 0, 0.109, 0, 0.010);
  castBlock(boiler, machineEnamel, 0.845, 0.04, 0.79, 0, 0.131, 0, 0.010);
  bolts(boiler, 0.34, 0.145);

  const centerY = 0.43;
  cylinder(boiler, boilerCopper, 0.284, 0.61, -0.033, centerY, 0, 'x');
  for (const x of [-0.318, 0.252]) {
    for (const z of [-0.158, 0.158]) {
      castBlock(boiler, brass, 0.138, 0.19, 0.14, x + 0.036, 0.212, z, 0.028);
    }
    const dome = mesh(new THREE.SphereGeometry(0.279, 28, 16), boilerCopper, boiler, x, centerY, 0);
    dome.scale.x = 0.30;
    cylinder(boiler, bronze, 0.298, 0.072, x, centerY, 0, 'x');
    for (const offset of [-0.029, 0.029]) {
      mesh(new THREE.TorusGeometry(0.292, 0.012, 8, 32), brass, boiler, x + offset, centerY, 0)
        .rotation.y = Math.PI / 2;
    }
    for (let i = 0; i < 14; i++) {
      const angle = (i + 0.5) * Math.PI / 7;
      mesh(rivetGeometry, brass, boiler, x, centerY + 0.296 * Math.cos(angle), 0.296 * Math.sin(angle))
        .scale.setScalar(0.76);
    }
  }

  cylinder(boiler, bronze, 0.132, 0.19, 0.39, pipeHeight, 0, 'x');
  cylinder(boiler, brass, 0.157, 0.072, 0.452, pipeHeight, 0, 'x');
  cylinder(boiler, bronze, 0.074, 0.18, -0.22, 0.75, -0.126);
  cylinder(boiler, brass, 0.091, 0.04, -0.22, 0.84, -0.126);
  cylinder(boiler, gasket, 0.054, 0.006, -0.22, 0.861, -0.126);
  cylinder(boiler, brass, 0.044, 0.198, 0.18, 0.778, 0.012);
  cylinder(boiler, bronze, 0.079, 0.055, 0.18, 0.713, 0.012);
  const valve = new THREE.Group();
  valve.position.set(0.18, 0.89, 0.012);
  valve.rotation.x = -0.31;
  boiler.add(valve);
  mesh(new THREE.TorusGeometry(0.102, 0.014, 10, 28), brass, valve);
  for (let i = 0; i < 4; i++) {
    box(valve, bronze, 0.011, 0.181, 0.015, 0, 0, 0).rotation.z = i * Math.PI / 4;
  }
  cylinder(valve, brass, 0.032, 0.027, 0, 0, 0, 'z');

  const badge = new THREE.Group();
  badge.position.set(-0.024, 0.445, 0.283);
  boiler.add(badge);
  mesh(new THREE.CircleGeometry(0.119, 32), bronze, badge);
  mesh(new THREE.CircleGeometry(0.103, 32), enamelBlue, badge, 0, 0, 0.004);
  mesh(crestGeometry, brass, badge, 0, 0.005, 0.008).scale.setScalar(0.84);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const angle = -1.05 + i * 0.27;
      const leaf = mesh(rivetGeometry, brass, badge, side * Math.cos(angle) * 0.154, Math.sin(angle) * 0.134, -0.009);
      leaf.scale.set(0.43, 1.0, 0.48);
      leaf.rotation.z = side * (0.64 - i * 0.23);
    }
  }
  return mountBoilerGauge(boiler, heading);
}

function makeGaugeFace() {
  const dial = document.createElement('canvas');
  dial.width = dial.height = 256;
  const ctx = dial.getContext('2d');
  const paper = ctx.createRadialGradient(102, 90, 12, 128, 128, 128);
  paper.addColorStop(0, '#fff0cd');
  paper.addColorStop(1, '#c9a777');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 256, 256);
  const random = randomTextureSample();
  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = `rgba(86, 57, 33, ${random() * 0.14})`;
    ctx.fillRect(random() * 256, random() * 256, 1.4, 1.4);
  }
  ctx.strokeStyle = '#473021';
  for (let i = 0; i <= 20; i++) {
    const angle = THREE.MathUtils.degToRad(-210 + i * 12);
    const inner = i % 5 === 0 ? 88 : 99;
    ctx.lineWidth = i % 5 === 0 ? 3 : 1.6;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(angle) * inner, 128 + Math.sin(angle) * inner);
    ctx.lineTo(128 + Math.cos(angle) * 110, 128 + Math.sin(angle) * 110);
    ctx.stroke();
  }
  ctx.fillStyle = '#493524';
  ctx.textAlign = 'center';
  ctx.font = '600 20px Georgia';
  ctx.fillText('0', 62, 174);
  ctx.fillText('50', 128, 65);
  ctx.fillText('100', 194, 174);
  ctx.font = '600 16px Georgia';
  ctx.fillText('STEAM', 128, 190);
  const face = new THREE.CanvasTexture(dial);
  face.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: face, roughness: 0.78 });
}

const gaugeFace = makeGaugeFace();

function mountBoilerGauge(boiler, heading) {
  const gauge = new THREE.Group();
  gauge.position.set(-0.193, 0.984, 0.211);
  gauge.rotation.set(-0.57, THREE.MathUtils.degToRad(heading * 0.47), 0, 'YXZ');
  gauge.scale.setScalar(0.92);
  boiler.add(gauge);

  // The pressure tap starts inside the boiler and the union meets the back of the dial.
  cylinder(boiler, bronze, 0.061, 0.086, -0.193, 0.689, 0.145);
  const stem = cylinder(boiler, brass, 0.027, 0.265, -0.193, 0.813, 0.157);
  stem.rotation.x = 0.12;
  cylinder(boiler, brass, 0.042, 0.033, -0.193, 0.752, 0.149);
  cylinder(gauge, iron, 0.107, 0.098, 0, 0, -0.039, 'z');
  cylinder(gauge, bronze, 0.226, 0.074, 0, 0, 0, 'z');
  mesh(new THREE.CircleGeometry(0.205, 40), gaugeFace, gauge, 0, 0, 0.039);
  mesh(new THREE.TorusGeometry(0.213, 0.014, 8, 32), brass, gauge, 0, 0, 0.044);
  for (const x of [-0.172, 0.172]) {
    const screw = cylinder(gauge, bronze, 0.011, 0.006, x, -0.025, 0.043, 'z');
    screw.castShadow = false;
  }
  const needle = new THREE.Group();
  gauge.add(needle);
  const pointer = new THREE.Shape().moveTo(-0.018, -0.032)
    .lineTo(0.018, -0.032).lineTo(0.014, 0.127).lineTo(0, 0.176)
    .lineTo(-0.014, 0.127).closePath();
  const hand = mesh(new THREE.ShapeGeometry(pointer), gaugeRed, needle, 0, 0, 0.058);
  hand.castShadow = false;
  cylinder(gauge, brass, 0.018, 0.014, 0, 0, 0.061, 'z');
  return needle;
}

function buildReceiver(group, position, port, build, height) {
  const receiver = atTile(...position, group, height);
  receiver.rotation.y = -(port - 2) * Math.PI / 2;
  castBlock(receiver, dark, 0.97, 0.075, 0.98, 0, 0.0375, 0, 0.019);
  castBlock(receiver, bronze, 0.951, 0.035, 0.95, 0, 0.076, 0, 0.011);
  castBlock(receiver, machineEnamel, 0.91, 0.12, 0.91, 0, 0.124, 0, 0.027);
  bolts(receiver, 0.36, 0.19);
  for (const z of [-0.447, 0.447]) {
    castBlock(receiver, inlay, 0.723, 0.030, 0.022, 0, 0.122, z, 0.006);
  }
  const insignia = mesh(crestGeometry, brass, receiver, 0, 0.153, 0.466);
  insignia.scale.setScalar(0.63);
  const plate = castBlock(receiver, enamelBlue, 0.22, 0.093, 0.029, 0, 0.132, 0.446, 0.010);
  plate.castShadow = false;
  cylinder(receiver, iron, 0.11, 0.36, -0.32, pipeHeight, 0, 'x');
  cylinder(receiver, brass, 0.146, 0.085, -0.44, pipeHeight, 0, 'x');
  cylinder(receiver, brass, 0.05, 0.38, -0.29, 0.39, -0.32);
  cylinder(receiver, iron, 0.065, 0.045, -0.29, 0.58, -0.32);
  const lampMaterial = material(0x5c351c, 0.1);
  const lamp = mesh(new THREE.SphereGeometry(0.056, 16, 10), lampMaterial, receiver, -0.29, 0.36, 0.32);
  const lampLight = new THREE.PointLight(0xffa33e, 0, 1.35);
  lampLight.position.copy(lamp.position);
  receiver.add(lampLight);

  const ventPosition = new THREE.Vector3(-0.29, 0.61, -0.32)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), receiver.rotation.y)
    .add(receiver.position);
  const mechanism = new THREE.Group();
  receiver.add(mechanism);
  // Leave the inlet and mounting plate at their exact tile height.
  if ([buildFlywheel, buildFan, buildPress].includes(build)) {
    mechanism.scale.y = 1.23;
    mechanism.position.y = -0.037;
  }
  return {
    port, lampMaterial, lampLight,
    vent: { ...ventPosition, dx: 0, dz: 0 },
    animate: build(mechanism), powered: false, speed: 0, phase: 0, startup: 0,
  };
}

function buildFlywheel(receiver) {
  cylinder(receiver, pipeSteel, 0.142, 0.33, -0.18, 0.39, 0.08, 'x');
  for (const x of [-0.34, -0.018]) {
    cylinder(receiver, brass, 0.157, 0.049, x, 0.39, 0.08, 'x');
    mesh(new THREE.TorusGeometry(0.101, 0.01, 8, 24), bronze, receiver, x - 0.024, 0.39, 0.08)
      .rotation.y = Math.PI / 2;
  }
  castBlock(receiver, bronze, 0.29, 0.32, 0.28, 0.213, 0.30, -0.048, 0.045);
  const stand = new THREE.Group();
  stand.position.set(0.213, 0.30, -0.042);
  receiver.add(stand);
  for (const x of [-0.083, 0.083]) {
    const leg = castBlock(stand, brass, 0.086, 0.427, 0.099, x, 0.085, 0.027, 0.019);
    leg.rotation.z = x < 0 ? -0.32 : 0.32;
  }
  cylinder(receiver, iron, 0.072, 0.31, 0.213, 0.556, 0.06, 'z');

  const wheel = new THREE.Group();
  wheel.position.set(0.213, 0.556, 0.188);
  receiver.add(wheel);
  mesh(new THREE.TorusGeometry(0.323, 0.047, 12, 44), bronze, wheel);
  mesh(new THREE.TorusGeometry(0.333, 0.019, 8, 44), brass, wheel, 0, 0, 0.043);
  mesh(new THREE.TorusGeometry(0.333, 0.019, 8, 44), brass, wheel, 0, 0, -0.043);
  cylinder(wheel, brass, 0.08, 0.105, 0, 0, 0, 'z');
  for (let spoke = 0; spoke < 6; spoke++) {
    const angle = spoke * Math.PI / 3;
    const bar = castBlock(wheel, brass, 0.043, 0.28, 0.050, -Math.sin(angle) * 0.169, Math.cos(angle) * 0.169, 0, 0.012);
    bar.rotation.z = angle;
  }
  cylinder(wheel, bronze, 0.064, 0.043, 0, 0, 0.054, 'z');
  cylinder(wheel, brass, 0.042, 0.022, 0, 0, 0.086, 'z');
  cylinder(wheel, brass, 0.035, 0.067, 0.147, 0, 0.042, 'z');
  const crank = castBlock(receiver, brass, 1, 0.045, 0.037, 0, 0, 0, 0.012);
  const piston = cylinder(receiver, iron, 0.041, 0.23, -0.19, 0.38, 0.2, 'x');
  return phase => {
    wheel.rotation.z = -phase;
    const pinX = wheel.position.x + Math.cos(wheel.rotation.z) * 0.147;
    const pinY = wheel.position.y + Math.sin(wheel.rotation.z) * 0.147;
    piston.position.x = -0.15 + Math.cos(wheel.rotation.z) * 0.065;
    const pistonX = piston.position.x + 0.09;
    const pistonY = piston.position.y;
    crank.position.set((pinX + pistonX) / 2, (pinY + pistonY) / 2, 0.256);
    crank.scale.x = Math.hypot(pinX - pistonX, pinY - pistonY);
    crank.rotation.z = Math.atan2(pinY - pistonY, pinX - pistonX);
  };
}

function buildFan(receiver) {
  box(receiver, machineEnamel, 0.48, 0.42, 0.40, 0.08, 0.31, -0.04);
  cylinder(receiver, iron, 0.34, 0.12, 0.08, 0.64, 0.02, 'z');
  cylinder(receiver, dark, 0.29, 0.024, 0.08, 0.64, 0.085, 'z');
  mesh(new THREE.TorusGeometry(0.323, 0.022, 8, 40), bronze, receiver, 0.08, 0.64, -0.053);
  const rotor = new THREE.Group();
  rotor.position.set(0.08, 0.64, 0.15);
  receiver.add(rotor);
  cylinder(rotor, brass, 0.084, 0.09, 0, 0, 0, 'z');
  for (let i = 0; i < 5; i++) {
    const blade = new THREE.Group();
    blade.rotation.z = i * Math.PI * 2 / 5;
    rotor.add(blade);
    box(blade, machineEnamel, 0.115, 0.23, 0.035, 0.027, 0.16, 0).rotation.z = -0.26;
  }
  mesh(new THREE.TorusGeometry(0.32, 0.031, 10, 40), brass, receiver, 0.08, 0.64, 0.18);
  return phase => { rotor.rotation.z = phase * 1.5; };
}

function buildPress(receiver) {
  const enamel = Object.assign(material(0x692b3c, 0.40), enamelTexture, { bumpScale: 0.012 });
  box(receiver, iron, 0.55, 0.12, 0.46, 0.08, 0.20, 0.07);
  for (const x of [-0.19, 0.35]) {
    box(receiver, enamel, 0.09, 0.69, 0.20, x, 0.49, 0.03);
    cylinder(receiver, brass, 0.036, 0.48, x, 0.47, 0.20);
  }
  castBlock(receiver, enamel, 0.68, 0.16, 0.42, 0.08, 0.85, 0.05, 0.028);
  castBlock(receiver, bronze, 0.61, 0.030, 0.385, 0.08, 0.789, 0.05, 0.010);
  cylinder(receiver, iron, 0.15, 0.23, 0.08, 0.87, 0.07);
  cylinder(receiver, brass, 0.17, 0.045, 0.08, 0.99, 0.07);
  const ram = new THREE.Group();
  receiver.add(ram);
  cylinder(ram, brass, 0.06, 0.38, 0.08, 0.71, 0.07);
  box(ram, iron, 0.31, 0.11, 0.29, 0.08, 0.52, 0.07);
  box(receiver, brass, 0.24, 0.038, 0.23, 0.08, 0.28, 0.07);
  return phase => {
    ram.position.y = -0.156 * Math.pow((1 - Math.cos(phase * 0.52)) * 0.5, 2);
  };
}

function positionRod(rod, a, b) {
  const axis = new THREE.Vector3().subVectors(b, a);
  rod.position.copy(a).addScaledVector(axis, 0.5);
  rod.scale.y = axis.length();
  rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
}

function buildCompressor(machine) {
  castBlock(machine, machineEnamel, 0.78, 0.19, 0.56, 0, 0.26, 0, 0.04);
  box(machine, castSteel, 0.75, 0.44, 0.14, 0, 1.01, -0.20);
  const crankshaft = cylinder(machine, iron, 0.072, 0.77, 0, 0.50, 0.16, 'x');
  const eccentrics = [-0.22, 0.22].map((x, index) => {
    cylinder(machine, machineryRed, 0.158, 0.34, x, 1.08, 0.12);
    for (let fin = 0; fin < 5; fin++) {
      cylinder(machine, castSteel, 0.182, 0.024, x, 0.96 + fin * 0.059, 0.12);
    }
    cylinder(machine, brass, 0.108, 0.07, x, 1.27, 0.12);
    const cam = new THREE.Group();
    cam.position.set(x, 0.50, 0.16);
    machine.add(cam);
    cylinder(cam, bronze, 0.15, 0.061, 0, 0, 0, 'x');
    cylinder(cam, brass, 0.043, 0.13, 0.015, 0.10, 0, 'x');
    const piston = cylinder(machine, iron, 0.052, 0.24, x, 0.87, 0.12);
    const rod = cylinder(machine, brass, 0.023, 1, x, 0.7, 0.12);
    const a = new THREE.Vector3(x, 0, 0);
    const b = new THREE.Vector3(x, 0, 0.12);
    return phase => {
      const angle = phase + index * Math.PI;
      const lift = Math.cos(angle) * 0.088;
      cam.rotation.x = angle;
      a.set(x, 0.50 + Math.cos(angle) * 0.10, 0.16 + Math.sin(angle) * 0.10);
      piston.position.y = 0.88 + lift;
      b.y = piston.position.y - 0.11;
      positionRod(rod, a, b);
    };
  });
  cylinder(machine, bronze, 0.049, 0.49, 0, 1.34, 0.12, 'x');
  return phase => {
    crankshaft.rotation.set(phase, 0, Math.PI / 2);
    for (const move of eccentrics) move(phase);
  };
}

function buildBeamPump(machine) {
  castBlock(machine, machineEnamel, 0.78, 0.14, 0.62, 0, 0.23, 0, 0.03);
  castBlock(machine, castSteel, 0.23, 0.99, 0.31, 0, 0.77, -0.16, 0.037);
  const beam = new THREE.Group();
  beam.position.set(0, 1.28, 0.07);
  machine.add(beam);
  castBlock(beam, machineryRed, 0.92, 0.14, 0.17, 0, 0, 0, 0.028);
  cylinder(beam, brass, 0.085, 0.20, 0, 0, 0, 'z');
  const pumps = [-0.33, 0.33].map(x => {
    cylinder(machine, bronze, 0.118, 0.40, x, 0.49, 0.09);
    cylinder(machine, brass, 0.14, 0.055, x, 0.69, 0.09);
    const plunger = cylinder(machine, iron, 0.051, 0.33, x, 0.79, 0.09);
    const rod = cylinder(machine, brass, 0.029, 1, x, 1, 0.09);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3(x, 0, 0.09);
    return angle => {
      a.set(x * Math.cos(angle), 1.28 + x * Math.sin(angle), 0.09);
      plunger.position.y = 0.80 + x * Math.sin(angle);
      b.y = plunger.position.y + 0.15;
      positionRod(rod, a, b);
    };
  });
  const wheel = new THREE.Group();
  wheel.position.set(0, 0.56, 0.26);
  machine.add(wheel);
  mesh(new THREE.TorusGeometry(0.225, 0.032, 8, 28), brass, wheel);
  for (let i = 0; i < 3; i++) {
    box(wheel, castSteel, 0.024, 0.42, 0.035, 0, 0, 0).rotation.z = i * Math.PI / 3;
  }
  return phase => {
    const angle = Math.sin(phase * 0.67) * 0.28;
    beam.rotation.z = angle;
    wheel.rotation.z = -phase * 0.67;
    for (const move of pumps) move(angle);
  };
}

function buildGovernor(machine) {
  castBlock(machine, machineryRed, 0.74, 0.24, 0.63, 0, 0.29, 0, 0.044);
  cylinder(machine, castSteel, 0.095, 0.96, 0, 0.82, -0.23);
  cylinder(machine, brass, 0.105, 0.055, 0, 1.32, -0.23);
  cylinder(machine, bronze, 0.065, 0.27, 0, 1.27, -0.115, 'z');
  const spindle = new THREE.Group();
  spindle.position.y = 1.27;
  machine.add(spindle);
  cylinder(spindle, bronze, 0.041, 0.60, 0, -0.24, 0);
  const sleeve = cylinder(spindle, brass, 0.089, 0.128, 0, -0.36, 0);
  const arms = [-1, 1].map(sign => {
    const arm = new THREE.Group();
    spindle.add(arm);
    cylinder(arm, brass, 0.024, 0.44, 0, -0.21, 0);
    mesh(new THREE.SphereGeometry(0.105, 14, 9), bronze, arm, 0, -0.43, 0);
    const link = cylinder(spindle, castSteel, 0.019, 1, 0, -0.35, 0);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    return spread => {
      arm.rotation.z = sign * spread;
      a.set(sign * Math.sin(spread) * 0.34, -Math.cos(spread) * 0.34, 0);
      b.set(0, sleeve.position.y, 0);
      positionRod(link, a, b);
    };
  });
  const pulley = cylinder(machine, bronze, 0.25, 0.08, 0, 0.44, 0);
  for (let i = 0; i < 4; i++) {
    mesh(boltGeometry, brass, pulley, Math.cos(i * Math.PI / 2) * 0.18, 0.051, Math.sin(i * Math.PI / 2) * 0.18);
  }
  return (phase, speed) => {
    const spread = 0.53 + 0.45 * Math.min(1, speed / 10) + Math.sin(phase) * 0.02;
    spindle.rotation.y = phase * 1.12;
    pulley.rotation.y = phase * 1.12;
    sleeve.position.y = -0.41 + Math.sin(spread) * 0.18;
    for (const move of arms) move(spread);
  };
}

function pipeGeometry(type) {
  const radius = 0.126;
  const start = new THREE.Vector3(0.5, 0, 0);
  const path = type === 'straight'
    ? new THREE.LineCurve3(start, new THREE.Vector3(-0.5, 0, 0))
    : new THREE.CubicBezierCurve3(start, new THREE.Vector3(0.224, 0, 0), new THREE.Vector3(0, 0, 0.224), new THREE.Vector3(0, 0, 0.5));
  return new THREE.TubeGeometry(path, type === 'elbow' ? 24 : 1, radius, 24, false);
}

function riserGeometry(type) {
  const [low, high] = pipePorts[type].map(port => {
    const [x, z] = directions[port];
    return new THREE.Vector3(x * 0.5, 0, z * 0.5);
  });
  const lowTurn = low.clone().multiplyScalar(0.30);
  const highTurn = high.clone().multiplyScalar(0.30);
  high.y = highTurn.y = heightStep;
  return new THREE.TubeGeometry(new THREE.CubicBezierCurve3(low, lowTurn, highTurn, high), 28, 0.126, 24, false);
}

const bodies = {
  straight: pipeGeometry('straight'), elbow: pipeGeometry('elbow'),
  riser: riserGeometry('riser'), 'riser-elbow': riserGeometry('riser-elbow'),
};
const junctionHub = new THREE.SphereGeometry(0.155, 20, 12);
const junctionArm = new THREE.TubeGeometry(
  new THREE.LineCurve3(new THREE.Vector3(), new THREE.Vector3(0.5, 0, 0)), 1, 0.126, 24, false,
);
const collarGeometry = new THREE.LatheGeometry([
  [0.094, -0.043], [0.138, -0.043], [0.156, -0.034],
  [0.156, -0.022], [0.146, -0.018], [0.146, 0.018],
  [0.156, 0.022], [0.156, 0.034], [0.138, 0.043], [0.094, 0.043], [0.094, -0.043],
].map(([radius, height]) => new THREE.Vector2(radius, height)), 32);
const gasketGeometry = new THREE.CylinderGeometry(0.144, 0.144, 0.017, 28, 1, true);
const boards = [];
let tool = 'straight';
let previewRotation = 0;
let touchPreview = null;
let powered = false;
let outlets = [];
let warmJoints = [];

function heightAt(index) {
  return level.heights.get(index) ?? 0;
}

function addPipe(x, z, type, rotation, fixed = false) {
  const group = atTile(x, z, level.group, heightAt(key(x, z)));
  group.position.y += pipeHeight;
  const body = fixed ? fixedPipeFinish : riseByPort[type] ? riserFinish : pipeSteel;
  const collars = buildPipeModel(group, type, { body, collar: brass, rivet: bronze }, fixed);
  group.rotation.y = -rotation * Math.PI / 2;
  level.pipes.set(key(x, z), { type, rotation, fixed, group, collars });
}

function buildPipeModel(group, type, finish, fixed = false) {
  const elevations = riseByPort[type];
  const body = finish.body;
  if (bodies[type]) {
    mesh(bodies[type], body, group);
  } else {
    mesh(junctionHub, body, group);
    for (const port of pipePorts[type]) {
      mesh(junctionArm, body, group).rotation.y = -port * Math.PI / 2;
    }
  }
  if (fixed) {
    const bracket = castBlock(group, bronze, 0.35, 0.065, 0.35, 0, -0.223, 0, 0.012);
    bolts(bracket, 0.132, 0.035);
  }
  return pipePorts[type].map((port, i) => {
    const [dx, dz] = directions[port];
    const flange = new THREE.Group();
    flange.position.set(dx * 0.451, (elevations?.[i] ?? 0) * heightStep, dz * 0.451);
    if (dx) flange.rotation.z = Math.PI / 2;
    else flange.rotation.x = Math.PI / 2;
    group.add(flange);
    const collar = mesh(collarGeometry, finish.collar, flange);
    mesh(gasketGeometry, finish.gasket ?? gasket, flange, 0, -0.041, 0);
    for (let i = 0; i < 4; i++) {
      const angle = (i + 0.5) * Math.PI / 2;
      mesh(rivetGeometry, finish.rivet, flange, Math.cos(angle) * 0.128, 0.025, Math.sin(angle) * 0.128);
    }
    return collar;
  });
}

function portsAt(index) {
  const height = heightAt(index);
  if (index === level.sourceKey) return [{ direction: 0, height }];
  const machine = level.machines.get(index);
  if (machine) return [{ direction: machine.port, height }];
  const pipe = level.pipes.get(index);
  return pipe ? piecePorts(pipe.type, pipe.rotation, height) : [];
}

function piecePorts(type, rotation, height) {
  return pipePorts[type].map((port, i) => ({
    direction: (port + rotation) % 4,
    height: height + (riseByPort[type]?.[i] ?? 0),
    raised: Boolean(riseByPort[type]?.[i]),
  }));
}

function matchingPort(x, z, direction, height) {
  return inside(x, z) && portsAt(key(x, z)).some(port =>
    port.direction === (direction + 2) % 4 && port.height === height);
}

function updateFlow() {
  const active = new Set([level.sourceKey]);
  const queue = [level.sourceKey];
  const leaks = [];
  const joints = [];
  for (const index of queue) {
    if (level.machines.has(index)) continue;
    const x = index % size;
    const z = Math.floor(index / size);
    for (const { direction, height } of portsAt(index)) {
      const [dx, dz] = directions[direction];
      const next = key(x + dx, z + dz);
      const matched = matchingPort(x + dx, z + dz, direction, height);
      if (!matched) {
        leaks.push({
          x: world(x) + 0.49 * dx, y: pipeHeight + height * heightStep,
          z: world(z) + 0.49 * dz, dx, dz,
        });
      } else if (!active.has(next)) {
        active.add(next);
        queue.push(next);
        if (level.pipes.has(index) && level.pipes.has(next)) {
          joints.push({
            x: world(x) + 0.49 * dx, y: pipeHeight + height * heightStep + 0.13,
            z: world(z) + 0.49 * dz, dx: dz * 0.20, dz: -dx * 0.20,
          });
        }
      }
    }
  }
  const leakCount = leaks.length;
  let supplied = 0;
  for (const [index, machine] of level.machines) {
    const wasPowered = machine.powered;
    machine.powered = active.has(index);
    if (machine.powered && !wasPowered) {
      machine.startup = 0;
      playSound('hiss');
    }
    if (machine.powered) {
      supplied++;
      leaks.push(machine.vent);
    }
    machine.lampMaterial.emissive.setHex(machine.powered ? 0xff9b28 : 0x000000);
    if (!machine.powered) machine.lampLight.intensity = 0;
  }
  powered = supplied === level.machines.size && leakCount === 0;
  if (!powered) level.completionTime = 0;
  const supply = supplied / level.machines.size;
  level.targetPressure = Math.round((35 + 65 * supply) / (1 + 0.85 * leakCount));
  pressureMeter.setAttribute('aria-valuenow', String(level.targetPressure));
  pressureReadout.textContent = `${level.targetPressure}%`;
  outlets = leaks;
  warmJoints = joints;
  for (const [index, pipe] of level.pipes) {
    for (const collar of pipe.collars) collar.material = active.has(index) ? collarActive : brass;
  }
  giftCase.classList.toggle('powered', powered);
  const leakStatus = leakCount === 1 ? '1 leak' : `${leakCount} leaks`;
  const machineName = level.machineName ?? level.name;
  const message = level.machines.size === 1
    ? (powered ? `Steam delivered · ${machineName} ${level.action}` : `Boiler on · ${machineName} idle`)
    : (powered ? `Board complete · ${supplied}/${level.machines.size} machines powered`
      : `${supplied}/${level.machines.size} machines powered · ${leakStatus}`);
  if (status.textContent !== message) status.textContent = message;
  if (powered) level.solved = true;
  recordProgress();
}

function removePipe(index) {
  const pipe = level.pipes.get(index);
  if (pipe) pipe.group.removeFromParent();
  level.pipes.delete(index);
}

function pieceState(pipe) {
  return pipe ? { type: pipe.type, rotation: pipe.rotation } : null;
}

function applyPipeState(index, state) {
  const pipe = level.pipes.get(index);
  if (pipe && state && pipe.type === state.type) {
    pipe.rotation = state.rotation;
    pipe.group.rotation.y = -state.rotation * Math.PI / 2;
  } else {
    if (pipe) removePipe(index);
    if (state) addPipe(index % size, Math.floor(index / size), state.type, state.rotation);
  }
}

function updateHistoryButtons() {
  undoButton.disabled = !level.past.length;
  redoButton.disabled = !level.future.length;
}

function rememberEdit(changes) {
  if (!changes.length) return;
  level.past.push(changes);
  if (level.past.length > 80) level.past.shift();
  level.future.length = 0;
  updateHistoryButtons();
}

function replayEdit(undo) {
  const from = undo ? level.past : level.future;
  const to = undo ? level.future : level.past;
  if (!from.length) return false;
  const changes = from.pop();
  for (const { index, before, after } of changes) {
    applyPipeState(index, undo ? before : after);
  }
  to.push(changes);
  updateHistoryButtons();
  playSound('tap');
  updateFlow();
  if (selection && highlight.visible) select(...selection);
  return true;
}

undoButton.addEventListener('click', () => replayEdit(true));
redoButton.addEventListener('click', () => replayEdit(false));

function reset() {
  const changes = [];
  for (const [index, pipe] of level.pipes) {
    if (pipe.fixed) continue;
    changes.push({ index, before: pieceState(pipe), after: null });
    removePipe(index);
  }
  rememberEdit(changes);
  for (const machine of level.machines.values()) {
    machine.phase = machine.speed = 0;
    machine.animate(0, 0);
  }
  updateFlow();
}

function editable(x, z) {
  const index = key(x, z);
  return index !== level.sourceKey && !level.machines.has(index) && !level.blocked.has(index) && !level.pipes.get(index)?.fixed;
}

function act(x, z, action = tool) {
  if (coverState !== 'open') return;
  if (!drawerDiscovered) {
    drawerLatch.focus();
    return;
  }
  if (!editable(x, z)) return;
  const index = key(x, z);
  const pipe = level.pipes.get(index);
  const before = pieceState(pipe);
  let after;
  if (action === 'remove') {
    if (!pipe) return;
    after = null;
  } else if (pipe) {
    if (rotationCount[pipe.type] === 1) return;
    after = { type: pipe.type, rotation: (pipe.rotation + 1) % rotationCount[pipe.type] };
  } else if (action === 'rotate') {
    rotatePreview();
    return;
  } else if (canPlace(index, action)) {
    after = { type: action, rotation: previewRotation };
  } else return;
  applyPipeState(index, after);
  rememberEdit([{ index, before, after }]);
  if (after) snapPiece(x, z, after.type, after.rotation);
  else playSound('tap');
  updateFlow();
}

function canPlace(index, type) {
  return Object.hasOwn(pipePorts, type) && (!riseByPort[type] || heightAt(index) < maxHeight);
}

const ghostMaterial = new THREE.MeshBasicMaterial({
  color: 0x365f79, transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false,
});
const ghostBrass = ghostMaterial.clone();
ghostBrass.color.setHex(0xd89c50);
ghostBrass.opacity = 0.74;
const previewModels = new Map();
let visibleGhost;
const previewMarkers = new THREE.Group();
const snapMarkers = new THREE.Group();
tray.add(previewMarkers, snapMarkers);
const ringShape = new THREE.TorusGeometry(0.082, 0.017, 7, 19);
const highMark = new THREE.OctahedronGeometry(0.068);
const fitColor = 0xffbe62;
const openColor = 0x8da6b9;
const highColor = 0x76d9f7;

function makeConnectionMarker(parent) {
  const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.74, depthWrite: false, toneMapped: false });
  const marker = new THREE.Group();
  const ring = new THREE.Mesh(ringShape, material);
  const diamond = new THREE.Mesh(highMark, material);
  ring.rotation.x = -Math.PI / 2;
  diamond.position.y = 0.064;
  marker.add(ring, diamond);
  parent.add(marker);
  return { marker, diamond, material };
}

const previewLights = Array.from({ length: 4 }, () => makeConnectionMarker(previewMarkers));
const snapLights = Array.from({ length: 4 }, () => makeConnectionMarker(snapMarkers));
let snapTime = 0;

function positionMarkers(markers, x, z, type, rotation, onlyMatching) {
  const ports = piecePorts(type, rotation, heightAt(key(x, z)));
  for (const [i, { marker, diamond, material }] of markers.entries()) {
    const port = ports[i];
    marker.visible = false;
    if (!port) continue;
    const [dx, dz] = directions[port.direction];
    const matched = matchingPort(x + dx, z + dz, port.direction, port.height);
    if (onlyMatching && !matched) continue;
    marker.position.set(world(x) + dx * 0.445, pipeHeight + port.height * heightStep + 0.18, world(z) + dz * 0.445);
    marker.scale.setScalar(1);
    material.color.setHex(matched ? fitColor : port.raised ? highColor : openColor);
    material.opacity = matched ? 0.94 : 0.56;
    diamond.visible = port.raised;
    marker.visible = true;
  }
}

function snapPiece(x, z, type, rotation) {
  positionMarkers(snapLights, x, z, type, rotation, true);
  snapMarkers.visible = true;
  snapTime = 0.37;
  playSound('tap');
}

function animateSnap(dt) {
  snapTime = Math.max(0, snapTime - dt);
  snapMarkers.visible = snapTime > 0;
  if (!snapMarkers.visible) return;
  for (const { marker, material } of snapLights) {
    material.opacity = snapTime / 0.37;
    marker.scale.setScalar(1.5 - snapTime);
  }
}

function hidePreview() {
  if (visibleGhost) visibleGhost.visible = false;
  previewMarkers.visible = false;
}

function showPreview(x, z) {
  hidePreview();
  const index = key(x, z);
  if (!drawerDiscovered || !editable(x, z) || level.pipes.has(index) || !canPlace(index, tool)) return;
  if (!previewModels.has(tool)) {
    const model = new THREE.Group();
    buildPipeModel(model, tool, { body: ghostMaterial, collar: ghostBrass, rivet: ghostBrass, gasket: ghostMaterial });
    model.traverse(part => {
      part.castShadow = false;
      part.receiveShadow = false;
    });
    previewModels.set(tool, model);
    tray.add(model);
  }
  visibleGhost = previewModels.get(tool);
  visibleGhost.position.set(world(x), pipeHeight + heightAt(index) * heightStep, world(z));
  visibleGhost.rotation.y = -previewRotation * Math.PI / 2;
  visibleGhost.visible = true;
  positionMarkers(previewLights, x, z, tool, previewRotation, false);
  previewMarkers.visible = true;
}

function rotatePreview() {
  if (!drawerDiscovered || !Object.hasOwn(rotationCount, tool)) return;
  previewRotation = (previewRotation + 1) % rotationCount[tool];
  if (selection && highlight.visible) showPreview(...selection);
}

const highlight = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints([
    [-0.45, -0.45], [0.45, -0.45], [0.45, 0.45], [-0.45, 0.45],
  ].map(([x, z]) => new THREE.Vector3(x, 0.014, z))),
  new THREE.LineBasicMaterial({ color: 0x8cf1d9, toneMapped: false }),
);
highlight.visible = false;
tray.add(highlight);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let selection;

function select(x, z) {
  selection = [x, z];
  showPreview(x, z);
  const index = key(x, z);
  const allowed = editable(x, z) && (level.pipes.has(index) || canPlace(index, tool));
  highlight.position.set(world(x), heightAt(index) * heightStep, world(z));
  highlight.material.color.setHex(allowed ? 0xffe1a0 : 0xc77e67);
  highlight.visible = true;
}

function pick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(2 * (event.clientX - rect.left) / rect.width - 1, 1 - 2 * (event.clientY - rect.top) / rect.height);
  raycaster.setFromCamera(pointer, camera);
  if (coverState !== 'open') {
    if (coverState === 'opening') return null;
    const target = coverState === 'locked' ? coverLock : coverHinge;
    return raycaster.intersectObject(target).length ? { cover: true } : null;
  }
  const fixtureHit = inspectingLid ? null : raycaster.intersectObjects(level.group.children)[0];
  const tileHit = inspectingLid ? null : raycaster.intersectObjects(tiles)[0];
  const boardHit = fixtureHit && (!tileHit || fixtureHit.distance < tileHit.distance) ? fixtureHit : tileHit;
  const boxHit = raycaster.intersectObjects(inspectingLid ? [lid] : caseParts.children.filter(object => object.visible))[0];
  if (boxHit && (!boardHit || boxHit.distance < boardHit.distance)) {
    let object = boxHit.object;
    while (object !== caseParts) {
      if (object.userData.control) {
        const control = object.userData.control;
        return control.disabled() ? null : { control };
      }
      if (object.userData.latch) return { latch: true };
      if (object.userData.rewardLatch && rewardFraction > 0.65) return { rewardLatch: true };
      if (object.userData.tool && drawerOpen && drawerMotion > 0.82
          && !rackSlots.get(object.userData.tool).button.hidden) return { tool: object.userData.tool };
      object = object.parent;
    }
    return null;
  }
  if (!boardHit) return null;
  let object = boardHit.object;
  while (!object.userData.position && object.parent) object = object.parent;
  return { tile: object.userData.position };
}

renderer.domElement.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse') return;
  const hit = pick(event);
  hoveredControl = hit?.control ?? null;
  renderer.domElement.style.cursor = hit?.tool || hit?.latch || hit?.rewardLatch || hit?.control || hit?.cover ? 'pointer' : '';
  if (hit?.tile) select(...hit.tile);
  else {
    highlight.visible = false;
    hidePreview();
  }
});
renderer.domElement.addEventListener('pointerleave', () => {
  hoveredControl = null;
  if (touchPreview !== null) return;
  highlight.visible = false;
  hidePreview();
  renderer.domElement.style.cursor = '';
});
renderer.domElement.addEventListener('click', event => {
  const hit = pick(event);
  if (hit?.cover) advanceCover();
  else if (hit?.control) {
    touchPreview = null;
    highlight.visible = false;
    hidePreview();
    hit.control.invoke();
    playSound('tap');
  } else if (hit?.latch) toggleDrawer();
  else if (hit?.rewardLatch) toggleReward();
  else if (hit?.tool) selectTool(hit.tool);
  else if (hit?.tile) {
    const [x, z] = hit.tile;
    const index = key(x, z);
    if (event.pointerType === 'touch' && drawerDiscovered && editable(x, z)
        && !level.pipes.has(index) && canPlace(index, tool) && touchPreview !== index) {
      touchPreview = index;
      select(x, z);
      return;
    }
    touchPreview = null;
    act(x, z);
    select(x, z);
  }
});
stage.addEventListener('focus', () => { if (!inspectingLid && coverState === 'open') select(...selection); });
stage.addEventListener('blur', event => {
  if (event.relatedTarget === turnPiece) return;
  touchPreview = null;
  highlight.visible = false;
  hidePreview();
});
turnPiece.addEventListener('click', rotatePreview);
stage.addEventListener('keydown', event => {
  if (coverState !== 'open') {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      advanceCover();
    }
    return;
  }
  if (inspectingLid) {
    if (event.key === 'Escape') {
      event.preventDefault();
      toggleLidInspection();
    }
    return;
  }
  const pressed = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && !event.altKey && ['z', 'y'].includes(pressed)) {
    event.preventDefault();
    replayEdit(pressed === 'z' && !event.shiftKey);
    return;
  }
  const moves = { ArrowRight: [1, 0], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowUp: [0, -1] };
  const move = moves[event.key];
  if (move) {
    event.preventDefault();
    const direction = directions.findIndex(([x, z]) => x === move[0] && z === move[1]);
    const boardMove = directions[(direction - viewTurns + 4) % 4];
    const [x, z] = selection.map((value, i) => THREE.MathUtils.clamp(value + boardMove[i], 0, size - 1));
    select(x, z);
  } else if (['Enter', ' ', 'r', 'R', 'Delete', 'Backspace'].includes(event.key)) {
    event.preventDefault();
    const action = { r: 'rotate', R: 'rotate', Delete: 'remove', Backspace: 'remove' }[event.key] ?? tool;
    act(...selection, action);
    select(...selection);
  }
});

function buildPliers(parent, handle, steel, gilt) {
  for (const side of [-1, 1]) {
    const jaw = new THREE.Group();
    jaw.rotation.y = side * 0.27;
    parent.add(jaw);
    castBlock(jaw, handle, 0.13, 0.09, 0.53, side * 0.025, 0, 0.29, 0.032);
    castBlock(jaw, steel, 0.085, 0.052, 0.30, 0, 0, -0.036, 0.014);
    const tooth = castBlock(jaw, steel, 0.093, 0.060, 0.14, -side * 0.032, 0, -0.23, 0.018);
    tooth.rotation.y = side * 0.56;
  }
  cylinder(parent, gilt, 0.057, 0.056, 0, 0.035, 0);
}

const buttons = [...document.querySelectorAll('[data-tool]')];
const caseParts = new THREE.Group();
scene.add(caseParts);
castBlock(caseParts, frame, 7.46, 0.16, 7.44, 0, -1.62, 0, 0.06);
castBlock(caseParts, frame, 7.37, 0.13, 7.34, 0, -1.013, 0, 0.046);
castBlock(caseParts, frame, 7.35, 0.50, 0.23, 0, -1.30, -3.55, 0.052);
for (const x of [-3.57, 3.57]) {
  castBlock(caseParts, frame, 0.26, 0.52, 7.32, x, -1.30, 0, 0.052);
  box(caseParts, inlay, 0.016, 0.020, 7.1, x * 1.039, -1.43, 0);
}
const drawer = new THREE.Group();
const closedDrawerZ = 2.98;
const revealedDrawerZ = 4.30;
drawer.position.set(0, -1.46, closedDrawerZ);
caseParts.add(drawer);
castBlock(drawer, frame, 6.93, 0.10, 1.52, 0, -0.055, 0, 0.034);
castBlock(drawer, frame, 7.05, 0.40, 0.185, 0, 0.125, 0.72, 0.043);
castBlock(drawer, velvet, 6.81, 0.079, 1.25, 0, 0.027, -0.016, 0.024);
for (const x of [-3.39, 3.39]) {
  castBlock(drawer, brass, 0.048, 0.053, 1.18, x, 0.054, -0.08, 0.016);
}
const handleAssembly = new THREE.Group();
handleAssembly.position.set(0, 0.128, 0.826);
handleAssembly.userData.latch = true;
drawer.add(handleAssembly);
castBlock(handleAssembly, bronze, 0.78, 0.237, 0.044, 0, 0, 0, 0.017);
const handleRing = mesh(new THREE.TorusGeometry(0.108, 0.022, 10, 26), inlay, handleAssembly, 0, 0, 0.045);
handleRing.scale.x = 1.8;
for (const x of [-0.247, 0.247]) mesh(rivetGeometry, brass, handleAssembly, x, 0, 0.032);
mesh(crestGeometry, inlay, handleAssembly, 0, 0, 0.054).scale.setScalar(0.63);

const rackSteel = material(0x79828b, 0.70, 0.25);
const rackGold = material(0xe2ae66, 0.72, 0.27);
const rackCopper = material(0xbb7952, 0.63, 0.33);
const rackHandle = material(0x632e40, 0.22, 0.41);
const selectedLining = material(0x464d83, 0.08, 0.86);
const emptyLining = material(0x0d132d, 0.07, 0.97);
const rackSlots = new Map();
for (const [index, button] of buttons.entries()) {
  const type = button.dataset.tool;
  const slot = new THREE.Group();
  slot.position.x = (index - 3) * 0.94;
  slot.userData.tool = type;
  drawer.add(slot);
  const cushion = castBlock(slot, emptyLining, 0.87, 0.072, 1.09, 0, 0.075, -0.065, 0.023);
  box(slot, bronze, 0.72, 0.012, 0.024, 0, 0.117, 0.458);
  const model = new THREE.Group();
  if (type === 'remove') {
    buildPliers(model, rackHandle, rackSteel, rackGold);
    model.rotation.y = -0.92;
  } else {
    buildPipeModel(model, type, { body: riseByPort[type] ? rackCopper : rackSteel, collar: rackGold, rivet: bronze });
  }
  model.scale.setScalar(0.63);
  const bounds = new THREE.Box3().setFromObject(model);
  model.position.y = 0.105 - bounds.min.y;
  slot.add(model);
  rackSlots.set(type, { model, cushion, button });
}

let drawerMotion = 0;
function toggleDrawer() {
  if (coverState !== 'open') return;
  const focusWasInRack = drawerPanel.contains(document.activeElement);
  drawerOpen = !drawerOpen;
  drawerDiscovered ||= drawerOpen;
  if (drawerOpen) selectTool(tool);
  drawerLatch.setAttribute('aria-expanded', String(drawerOpen));
  drawerLabel.textContent = drawerOpen ? 'Stow pipe rack' : drawerDiscovered ? 'Open pipe rack' : 'Release pipe rack';
  drawerPanel.inert = !drawerOpen;
  drawerPanel.classList.toggle('revealed', drawerOpen);
  recordProgress();
  if (!drawerOpen && focusWasInRack) drawerLatch.focus();
}

function moveDrawer(dt) {
  const target = drawerOpen ? 1 : 0;
  if (target === drawerMotion) return;
  drawerMotion += Math.sign(target - drawerMotion) * Math.min(dt * 2.7, Math.abs(target - drawerMotion));
  const progress = drawerMotion * drawerMotion * (3 - 2 * drawerMotion);
  drawer.position.z = THREE.MathUtils.lerp(closedDrawerZ, revealedDrawerZ, progress);
  handleRing.rotation.x = -0.43 * Math.sin(progress * Math.PI);
  resize();
}

function selectTool(type) {
  const slot = rackSlots.get(type);
  if (!slot || slot.button.hidden) return;
  if (tool !== type) {
    previewRotation = level.tutorial && type === 'elbow' ? 2 : 0;
    touchPreview = null;
  }
  tool = type;
  turnPiece.disabled = !drawerDiscovered || (rotationCount[type] ?? 1) <= 1;
  for (const [name, { button, cushion }] of rackSlots) {
    const selected = name === type;
    button.setAttribute('aria-pressed', String(selected));
    cushion.material = selected ? selectedLining : emptyLining;
  }
  if (drawerDiscovered) selectedTool.textContent = slot.button.textContent.trim();
  if (highlight.visible) select(...selection);
}

drawerLatch.addEventListener('click', toggleDrawer);
for (const button of buttons) {
  button.addEventListener('click', () => selectTool(button.dataset.tool));
}

const milestones = new Map([
  [0, { type: 'tee', label: 'Tee', board: 'Split Shift' }],
  [3, { type: 'cross', label: 'Cross', board: 'Cross Pressure' }],
  [5, { type: 'riser', label: 'Riser', board: 'First Rise' }],
  [7, { type: 'riser-elbow', label: 'Riser elbow', board: 'Casting Yard' }],
]);
const rewardDrawer = new THREE.Group();
rewardDrawer.visible = false;
rewardDrawer.position.y = -1.51;
caseParts.add(rewardDrawer);
castBlock(rewardDrawer, frame, 1.24, 0.11, 1.27, 0, -0.008, 0, 0.035);
castBlock(rewardDrawer, velvet, 1.11, 0.066, 1.12, 0, 0.061, 0, 0.021);
castBlock(rewardDrawer, bronze, 0.145, 0.36, 1.13, 0.595, 0.13, 0, 0.029);
const rewardPull = new THREE.Group();
rewardPull.userData.rewardLatch = true;
rewardPull.position.set(0.68, 0.145, 0);
rewardDrawer.add(rewardPull);
const rewardKnob = mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.078, 6), brass, rewardPull);
rewardKnob.rotation.z = Math.PI / 2;
const pearl = mesh(new THREE.SphereGeometry(0.057, 12, 8), enamelBlue, rewardPull, 0.044, 0, 0);
pearl.scale.x = 0.40;
const rewardModels = new Map();
for (const { type } of milestones.values()) {
  const model = new THREE.Group();
  buildPipeModel(model, type, { body: riseByPort[type] ? rackCopper : rackSteel, collar: rackGold, rivet: bronze });
  model.scale.setScalar(0.72);
  const bounds = new THREE.Box3().setFromObject(model);
  model.position.y = 0.094 - bounds.min.y;
  model.visible = false;
  rewardModels.set(type, model);
  rewardDrawer.add(model);
}
let rewardOpen = false;
let rewardFraction = 0;
let activeMilestone = null;

function setRewardDrawer(open) {
  rewardOpen = open;
  rewardLatch.setAttribute('aria-expanded', String(open));
  rewardLatch.textContent = open ? 'Stow fitting' : 'Reveal fitting';
}

function toggleReward() {
  if (!level.rewardShown) return;
  setRewardDrawer(!rewardOpen);
  playSound('latch');
}

rewardLatch.addEventListener('click', toggleReward);

function showMilestone() {
  level.rewardShown = true;
  rewardPlate.hidden = false;
  recordProgress();
  rewardLabel.textContent = `${activeMilestone.label} revealed · Used from ${activeMilestone.board}`;
  setRewardDrawer(true);
  playSound('latch');
}

function animateReward(elapsed) {
  if (powered && level.completionTime < 1.65) {
    level.completionTime += elapsed;
    if (level.completionTime >= 1.65 && activeMilestone && !level.rewardShown) showMilestone();
  }
  const target = rewardOpen ? 1 : 0;
  if (rewardFraction === target) return;
  rewardFraction += Math.sign(target - rewardFraction)
    * Math.min(elapsed * 1.82, Math.abs(target - rewardFraction));
  const progress = rewardFraction * rewardFraction * (3 - 2 * rewardFraction);
  const side = Math.sign(level.view[0]);
  rewardDrawer.visible = rewardFraction > 0;
  rewardDrawer.position.set(side * THREE.MathUtils.lerp(3.03, 4.22, progress), -1.51, 0.94);
  rewardDrawer.rotation.y = side > 0 ? 0 : Math.PI;
  rewardKnob.rotation.x = progress * Math.PI * 1.5;
  resize();
}

function prepareMilestone(index) {
  activeMilestone = milestones.get(index) ?? null;
  rewardDrawer.visible = false;
  rewardFraction = 0;
  rewardPlate.hidden = !level.rewardShown;
  for (const [type, model] of rewardModels) {
    model.visible = type === activeMilestone?.type;
  }
  if (level.rewardShown) {
    rewardLabel.textContent = `${activeMilestone.label} revealed · Used from ${activeMilestone.board}`;
  }
  setRewardDrawer(false);
}

const vapor = document.createElement('canvas');
vapor.width = vapor.height = 64;
const paint = vapor.getContext('2d');
for (const [x, y, radius, alpha] of [[32, 31, 24, 0.66], [23, 28, 17, 0.44], [40, 38, 19, 0.45], [35, 20, 15, 0.35]]) {
  const cloud = paint.createRadialGradient(x, y, 1, x, y, radius);
  cloud.addColorStop(0, `rgba(255,255,255,${alpha})`);
  cloud.addColorStop(1, 'rgba(255,255,255,0)');
  paint.fillStyle = cloud;
  paint.fillRect(0, 0, 64, 64);
}
const vaporTexture = new THREE.CanvasTexture(vapor);
const particles = Array.from({ length: 72 }, () => {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: vaporTexture, color: 0xe2edec, transparent: true, depthWrite: false,
  }));
  sprite.visible = false;
  tray.add(sprite);
  return { sprite, age: 0, dx: 0, dz: 0, wisp: false };
});
let nextParticle = 0;
let emission = 0;
let nextWisp = 0.84;

function emitSteam(outlet, wisp = false) {
  const particle = particles[nextParticle];
  nextParticle = (nextParticle + 1) % particles.length;
  particle.age = 0;
  particle.wisp = wisp;
  particle.dx = outlet.dx * 0.78 + (Math.random() - 0.5) * 0.2;
  particle.dz = outlet.dz * 0.78 + (Math.random() - 0.5) * 0.2;
  particle.sprite.position.set(outlet.x, outlet.y, outlet.z);
  particle.sprite.material.rotation = Math.random() * Math.PI * 2;
  particle.sprite.visible = true;
}

function animateSteam(dt) {
  emission += dt;
  if (emission >= (powered ? 0.092 : 0.045)) {
    emission = 0;
    for (const outlet of outlets) emitSteam(outlet);
  }
  if (warmJoints.length) {
    nextWisp -= dt;
    if (nextWisp <= 0) {
      nextWisp = 0.85 + Math.random() * 1.5;
      emitSteam(warmJoints[Math.floor(Math.random() * warmJoints.length)], true);
    }
  }
  for (const particle of particles) {
    if (!particle.sprite.visible) continue;
    particle.age += dt;
    const { sprite, age, dx, dz, wisp } = particle;
    const life = wisp ? 0.86 : 1.1;
    sprite.visible = age < life;
    sprite.position.x += dx * dt * (1 - age * 0.6);
    sprite.position.z += dz * dt * (1 - age * 0.6);
    sprite.position.y += (0.25 + age * 0.53) * dt;
    sprite.scale.setScalar(wisp ? 0.14 + age * 0.48 : 0.13 + age * 0.64);
    sprite.material.rotation += dt * 0.52;
    sprite.material.opacity = Math.max(0, (wisp ? 0.63 : 0.73) * (1 - age / life));
  }
}

let audio = null;
let noiseBuffer = null;
let muted = false;
let nextChuff = 0;

function enableSound(event) {
  if (muted || (event && !event.isTrusted)) return;
  if (!audio && window.AudioContext) {
    audio = new AudioContext();
    noiseBuffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.48), audio.sampleRate);
    const noise = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
  }
  if (audio?.state === 'suspended') audio.resume().catch(() => {});
}

window.addEventListener('pointerdown', enableSound);
window.addEventListener('keydown', enableSound);
soundButton.addEventListener('click', () => {
  muted = !muted;
  soundButton.setAttribute('aria-pressed', String(muted));
  soundButton.textContent = muted ? 'Sound off' : 'Sound on';
  if (!muted) enableSound();
});

function playSound(kind) {
  if (muted || audio?.state !== 'running') return;
  const now = audio.currentTime;
  const gain = audio.createGain();
  gain.connect(audio.destination);
  if (kind === 'tap' || kind === 'latch') {
    const tone = audio.createOscillator();
    tone.type = 'triangle';
    tone.frequency.setValueAtTime(kind === 'latch' ? 520 : 970, now);
    tone.frequency.exponentialRampToValueAtTime(kind === 'latch' ? 185 : 430, now + 0.064);
    gain.gain.setValueAtTime(kind === 'latch' ? 0.085 : 0.042, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.094);
    tone.connect(gain);
    tone.start(now);
    tone.stop(now + 0.10);
    return;
  }
  const puff = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const duration = kind === 'hiss' ? 0.44 : 0.15;
  puff.buffer = noiseBuffer;
  filter.type = 'bandpass';
  filter.frequency.value = kind === 'hiss' ? 1720 : 235;
  filter.Q.value = 0.85;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(kind === 'hiss' ? 0.082 : 0.05, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  puff.connect(filter).connect(gain);
  puff.start(now);
  puff.stop(now + duration);
}

function animateMachine(dt, elapsed) {
  let running = false;
  for (const machine of level.machines.values()) {
    if (machine.powered) machine.startup += elapsed;
    const ramp = machine.powered ? THREE.MathUtils.smoothstep(machine.startup, 0.22, 1.75) : 0;
    machine.speed = THREE.MathUtils.damp(machine.speed, ramp * 10, 4, dt);
    machine.phase += machine.speed * dt;
    machine.animate(machine.phase, machine.speed);
    machine.lampMaterial.emissiveIntensity = machine.powered ? 0.36 + ramp * 1.44 : 0;
    machine.lampLight.intensity = machine.powered ? 0.23 + ramp * 1.52 : 0;
    running ||= machine.powered && machine.speed > 2;
  }
  nextChuff -= dt;
  if (running && nextChuff <= 0) {
    playSound('chuff');
    nextChuff = 0.59;
  }
}

let gaugeTime = 0;
function animateGauge(elapsed) {
  const target = level.targetPressure;
  // Advance the damped spring in real time, even when a frame takes longer to render.
  const damping = 1.25;
  const frequency = 1.48;
  const offset = level.pressure - target;
  const sineWeight = (level.pressureVelocity + damping * offset) / frequency;
  const sine = Math.sin(frequency * elapsed);
  const cosine = Math.cos(frequency * elapsed);
  const decay = Math.exp(-damping * elapsed);
  const wave = offset * cosine + sineWeight * sine;
  level.pressure = target + decay * wave;
  level.pressureVelocity = decay * (frequency * (sineWeight * cosine - offset * sine) - damping * wave);
  gaugeTime += elapsed;
  const flutter = (Math.sin(gaugeTime * 5.4) * 11 + Math.sin(gaugeTime * 8.7) * 2) * Math.min(1, target / 19);
  // Leave room past the last tick so the needle can rebound at full pressure.
  const sweep = -120 + 2.4 * THREE.MathUtils.clamp(level.pressure, -3, 103);
  level.gaugeNeedle.rotation.z = -THREE.MathUtils.degToRad(sweep + flutter);
  lidNeedle.rotation.z = -THREE.MathUtils.degToRad(sweep + flutter * 0.25);
  pressureHand.style.transform = `rotate(${(sweep + flutter * 0.19).toFixed(2)}deg)`;
}

function boxCorners({ min, max }) {
  return [min.x, max.x].flatMap(x => [min.y, max.y].flatMap(y =>
    [min.z, max.z].map(z => new THREE.Vector3(x, y, z)),
  ));
}

const boardBounds = boxCorners({
  min: new THREE.Vector3(-3.7, -0.91, -3.7),
  max: new THREE.Vector3(3.7, 0.08, 3.7),
});
const caseBounds = boxCorners({
  min: new THREE.Vector3(-3.74, -1.71, -3.73),
  max: new THREE.Vector3(3.74, -0.94, 3.73),
});
const rackBounds = boxCorners({
  min: new THREE.Vector3(-3.55, -0.105, -0.76),
  max: new THREE.Vector3(3.55, 0.68, 0.91),
});
const rewardBounds = boxCorners({
  min: new THREE.Vector3(-0.63, -0.06, -0.66),
  max: new THREE.Vector3(0.79, 0.99, 0.66),
});
const cameraPoint = new THREE.Vector3();
let turnStart = 0;
let turnTarget = 0;
let turnProgress = 1;
let renderWidth = 0;
let renderHeight = 0;

function turnTray(dt) {
  if (turnProgress >= 1) return;
  turnProgress = Math.min(1, turnProgress + dt * 3.8);
  const eased = turnProgress * turnProgress * (3 - 2 * turnProgress);
  tray.rotation.y = THREE.MathUtils.lerp(turnStart, turnTarget, eased);
  resize();
}

function resize() {
  const { clientWidth: width, clientHeight: height } = stage;
  const aspect = Math.max(width, 1) / Math.max(height, 1);
  let left = Infinity;
  let right = -Infinity;
  let bottom = Infinity;
  let top = -Infinity;
  tray.updateWorldMatrix(true, false);
  drawer.updateWorldMatrix(true, false);
  const fitCorners = (points, transform) => {
    for (const corner of points) {
      cameraPoint.copy(corner);
      if (transform) cameraPoint.applyMatrix4(transform);
      cameraPoint.applyMatrix4(camera.matrixWorldInverse);
      const x = cameraPoint.x / -cameraPoint.z;
      const y = cameraPoint.y / -cameraPoint.z;
      left = Math.min(left, x);
      right = Math.max(right, x);
      bottom = Math.min(bottom, y);
      top = Math.max(top, y);
    }
  };
  if (lid.visible) fitCorners(lidBounds);
  if (coverHinge.visible && !inspectingLid) {
    coverHinge.updateMatrixWorld();
    for (const leaf of coverLeaves) fitCorners(coverBounds, leaf.matrixWorld);
  }
  if (!inspectingLid) {
    fitCorners(boardBounds, tray.matrixWorld);
    if (level.group.visible) fitCorners(level.fixtureBounds, tray.matrixWorld);
    fitCorners(caseBounds);
    fitCorners(rackBounds, drawer.matrixWorld);
    if (rewardDrawer.visible) {
      rewardDrawer.updateWorldMatrix(true, false);
      fitCorners(rewardBounds, rewardDrawer.matrixWorld);
    }
  }
  const halfHeight = Math.max((top - bottom) / 1.72, (right - left) / (1.84 * aspect));
  camera.aspect = aspect;
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(halfHeight));
  camera.updateProjectionMatrix();
  // Center the projected board, including the tall fixtures and the front edge.
  const projection = camera.projectionMatrix.elements;
  projection[8] = (left + right) / (2 * halfHeight * aspect);
  projection[9] = (bottom + top) / (2 * halfHeight);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  if (width !== renderWidth || height !== renderHeight) {
    renderer.setSize(width, height, false);
    renderWidth = width;
    renderHeight = height;
  }
}

const overheadButton = document.querySelector('#view-overhead');
const homeButton = document.querySelector('#view-home');

function updateView() {
  const angle = -viewTurns * Math.PI / 2;
  const delta = THREE.MathUtils.euclideanModulo(angle - tray.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
  turnStart = tray.rotation.y;
  turnTarget = turnStart + delta;
  turnProgress = Math.abs(delta) < 0.001 ? 1 : 0;
  inspectingLid = false;
  aimCamera();
  resize();
  overheadButton.setAttribute('aria-pressed', String(overhead));
  homeButton.disabled = viewTurns === 0 && !overhead;
}

document.querySelector('#view-left').addEventListener('click', () => {
  viewTurns = (viewTurns + 3) % 4;
  updateView();
});
document.querySelector('#view-right').addEventListener('click', () => {
  viewTurns = (viewTurns + 1) % 4;
  updateView();
});
overheadButton.addEventListener('click', () => {
  overhead = !overhead;
  updateView();
});
homeButton.addEventListener('click', () => {
  viewTurns = 0;
  overhead = false;
  updateView();
});

const progressKey = 'steam-tycoon-progress-v1';

function readProgress() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(progressKey));
  } catch {
    // The game also works in a browser that blocks local storage.
  }
  const knownBoards = Object.fromEntries(levels.flatMap(({ name }) => {
    const entry = saved?.boards?.[name];
    if (!entry || !Array.isArray(entry.pipes)) return [];
    return [[name, {
      pipes: entry.pipes,
      solved: entry.solved === true,
      rewardShown: entry.solved === true && entry.rewardShown === true,
    }]];
  }));
  return {
    board: saved?.board,
    opened: saved?.opened === true || (saved?.opened === undefined &&
      levels.some(({ name, tutorial }) => !tutorial && name === saved?.board)),
    drawerDiscovered: saved?.drawerDiscovered === true,
    boards: knownBoards,
  };
}

const progress = readProgress();
const tutorialIndex = levels.findIndex(board => board.tutorial);
const scoredBoards = levels.length - 1;
let coverState = progress.opened ? 'open' : 'locked';
const levelSelect = document.querySelector('#level');
const ledgerCount = document.querySelector('#ledger-count');
const boardOptions = [...levelSelect.options].map(option => ({ option, label: option.textContent.trim() }));

function updateLedger() {
  let solved = 0;
  for (const { option, label } of boardOptions) {
    const complete = progress.boards[levels[Number(option.value)].name]?.solved;
    if (complete && !levels[Number(option.value)].tutorial) solved++;
    const title = complete ? `✓ ${label}` : label;
    if (option.textContent !== title) option.textContent = title;
  }
  const count = `${solved} / ${scoredBoards} solved`;
  if (ledgerCount.textContent !== count) ledgerCount.textContent = count;
}

function recordProgress() {
  progress.board = level.name;
  progress.drawerDiscovered = drawerDiscovered;
  const pipes = [...level.pipes].flatMap(([index, pipe]) =>
    pipe.fixed ? [] : [[index, pipe.type, pipe.rotation]]);
  progress.boards[level.name] = { pipes, solved: level.solved, rewardShown: level.rewardShown };
  try {
    localStorage.setItem(progressKey, JSON.stringify(progress));
  } catch {
    // Keep the current route and ledger in memory if saving fails.
  }
  updateLedger();
}

function restoreBoard() {
  addPipe(level.source[0] + 1, level.source[1], 'straight', 0, true);
  for (const [x, z, type, rotation] of level.fixed ?? []) addPipe(x, z, type, rotation, true);
  const saved = progress.boards[level.name];
  if (!saved) return;
  level.solved = saved.solved;
  level.rewardShown = saved.rewardShown && [...milestones.keys()].some(i => levels[i].name === level.name);
  for (const entry of saved.pipes.slice(0, size * size)) {
    if (!Array.isArray(entry)) continue;
    const [index, type, rotation] = entry;
    if (!Number.isInteger(index) || index < 0 || index >= size * size ||
        typeof type !== 'string' || !canPlace(index, type) ||
        rackSlots.get(type)?.button.hidden ||
        !Number.isInteger(rotation) || rotation < 0 || rotation >= rotationCount[type] ||
        !editable(index % size, Math.floor(index / size))) continue;
    applyPipeState(index, { type, rotation });
  }
}

const heightControl = document.querySelector('#height-control');
const heightGuide = document.querySelector('#height-guide');
const guideGeometry = new THREE.BufferGeometry();
const guideLines = new THREE.LineSegments(guideGeometry,
  new THREE.LineBasicMaterial({ color: 0x90e7d1, transparent: true, opacity: 0.72, toneMapped: false }));
tray.add(guideLines);

function updateHeightGuide() {
  guideLines.visible = heightGuide.value !== '';
  if (!guideLines.visible) return;
  const points = [];
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const index = key(x, z);
      const height = heightAt(index);
      if (height !== Number(heightGuide.value) || level.blocked.has(index)) continue;
      const edge = 0.42;
      const y = height * heightStep + 0.018;
      const corners = [[-edge, -edge], [edge, -edge], [edge, edge], [-edge, edge]];
      for (let i = 0; i < 4; i++) {
        for (const [dx, dz] of [corners[i], corners[(i + 1) % 4]]) {
          points.push(world(x) + dx, y, world(z) + dz);
        }
      }
    }
  }
  guideGeometry.dispose();
  guideGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  guideGeometry.computeBoundingSphere();
}

heightGuide.addEventListener('change', updateHeightGuide);

function clearSteamAndSelection() {
  selection = [level.source[0] + 1, Math.max(0, level.source[1] - 1)];
  highlight.visible = false;
  previewRotation = 0;
  touchPreview = null;
  hidePreview();
  snapMarkers.visible = false;
  snapTime = 0;
  buttons[0].click();
  nextWisp = 0.84;
  for (const { sprite } of particles) sprite.visible = false;
}

function selectLevel(index) {
  if (coverState !== 'open' && index !== tutorialIndex) {
    levelSelect.value = String(tutorialIndex);
    return;
  }
  if (level) level.group.visible = false;
  tray.rotation.y = 0;
  tray.updateMatrixWorld();
  const firstVisit = !boards[index];
  boards[index] ??= buildLevel(levels[index]);
  level = boards[index];
  level.group.visible = coverState === 'open';
  viewTurns = 0;
  overhead = false;
  const advanced = level.machines.size > 1;
  const raised = level.heights.size > 0;
  const machineName = level.machineName ?? level.name;
  document.querySelector('#receiver-name').textContent = advanced ? 'Machines' : machineName;
  document.querySelector('#fixed-legend').hidden = !advanced && !raised;
  const goal = document.querySelector('#goal');
  if (level.tutorial) {
    goal.textContent = 'Pull out the pipe rack, pick up the elbow, and fit it into the gold-marked gap.';
  } else if (raised) {
    goal.textContent = advanced
      ? 'Feed both machines across three heights. Seal every branch.'
      : 'Place the riser on the lower tile. Turn its high end toward the raised deck.';
  } else {
    goal.textContent = advanced
      ? 'Power every machine and seal every open branch. Blue pipes are fixed.'
      : `Connect the boiler to the ${machineName.toLowerCase()}. Tap a placed pipe to turn it.`;
  }
  heightGuide.value = '';
  heightControl.hidden = !raised;
  heightGuide.querySelector('[value="2"]').disabled = ![...level.heights.values()].includes(2);
  updateHeightGuide();
  for (const button of buttons) {
    if (['tee', 'cross'].includes(button.dataset.tool)) {
      button.hidden = !level.junctions?.includes(button.dataset.tool);
    } else if (button.dataset.tool === 'riser') {
      button.hidden = !raised;
    } else if (button.dataset.tool === 'riser-elbow') {
      button.hidden = !level.bendRisers;
    }
  }
  for (const slot of rackSlots.values()) {
    slot.model.visible = !slot.button.hidden;
  }
  if (firstVisit) restoreBoard();
  prepareMilestone(index);
  updateView();
  clearSteamAndSelection();
  updateHistoryButtons();
  updateFlow();
}

levelSelect.addEventListener('change', () => selectLevel(Number(levelSelect.value)));
document.querySelector('#reset').addEventListener('click', () => {
  reset();
  clearSteamAndSelection();
});
drawerDiscovered = progress.drawerDiscovered;
if (drawerDiscovered) drawerLabel.textContent = 'Open pipe rack';
const savedIndex = levels.findIndex(({ name }) => name === progress.board);
levelSelect.value = String(progress.opened && savedIndex !== -1 ? savedIndex : tutorialIndex);
const lid = new THREE.Group();
lid.visible = coverState === 'open';
lid.position.set(0, 0.77, -4.31);
lid.rotation.x = -0.66;
caseParts.add(lid);
castBlock(lid, frame, 7.48, 2.1, 0.19, 0, 0, -0.056, 0.056);
castBlock(lid, velvet, 7.23, 1.88, 0.07, 0, 0, 0.060, 0.021);
for (const y of [-0.949, 0.949]) {
  box(lid, inlay, 7.14, 0.016, 0.021, 0, y, 0.103);
}
for (const x of [-3.58, 3.58]) {
  box(lid, inlay, 0.017, 1.90, 0.022, x, 0, 0.103);
  for (const y of [-0.83, 0.83]) {
    const ornament = mesh(crestGeometry, brass, lid, x * 0.971, y, 0.109);
    ornament.rotation.z = Math.PI / 2 * Math.sign(x) * Math.sign(y);
    ornament.scale.setScalar(0.86);
  }
}
for (const x of [-2.60, 2.60]) {
  const hinge = cylinder(lid, bronze, 0.081, 0.38, x, -1.021, 0.026, 'x');
  hinge.castShadow = false;
  castBlock(caseParts, frame, 0.23, 0.87, 0.17, x, -0.43, -3.72, 0.044);
}

function engraving(parent, width, height, x, y, z, options = {}) {
  const { color = '#f4d8a5', italic = false, fontScale = 0.68 } = options;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * 260);
  canvas.height = Math.round(height * 260);
  const pen = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const ink = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false, toneMapped: false,
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(width, height), ink);
  label.position.set(x, y, z);
  parent.add(label);
  let cached;
  return function setText(text) {
    if (cached === text) return;
    cached = text;
    pen.clearRect(0, 0, canvas.width, canvas.height);
    pen.font = `${italic ? 'italic ' : ''}600 ${Math.round(canvas.height * fontScale)}px Georgia, serif`;
    pen.textAlign = 'center';
    pen.textBaseline = 'middle';
    pen.fillStyle = color;
    pen.fillText(text, canvas.width / 2, canvas.height * 0.53, canvas.width * 0.96);
    texture.needsUpdate = true;
  };
}

const coverHinge = new THREE.Group();
coverHinge.position.set(0, 0.10, -3.73);
scene.add(coverHinge);
const leafLength = 2.473;
const coverLeaves = [coverHinge, new THREE.Group(), new THREE.Group()];
for (let i = 1; i < coverLeaves.length; i++) {
  const parent = coverLeaves[i - 1];
  const leaf = coverLeaves[i];
  leaf.position.z = leafLength;
  parent.add(leaf);
}
for (const [i, leaf] of coverLeaves.entries()) {
  const middle = leafLength / 2;
  castBlock(leaf, frame, 7.45, 0.139, leafLength - 0.020, 0, 0, middle, 0.036);
  for (const x of [-3.49, 3.49]) {
    box(leaf, inlay, 0.020, 0.012, leafLength - 0.052, x, 0.073, middle);
  }
  for (const x of [-2.52, 2.52]) {
    const hinge = cylinder(leaf, bronze, 0.053, 0.36, x, 0.067, 0.027, 'x');
    hinge.castShadow = false;
  }
  if (i === 0 || i === 2) {
    const z = i === 0 ? 0.125 : leafLength - 0.125;
    box(leaf, inlay, 6.99, 0.012, 0.022, 0, 0.073, z);
    for (const x of [-3.40, 3.40]) {
      const corner = mesh(crestGeometry, inlay, leaf, x, 0.082, z);
      corner.rotation.x = -Math.PI / 2;
      corner.scale.setScalar(1.13);
    }
  }
}
const coverCartouche = new THREE.Group();
coverCartouche.position.set(0, 0.097, 1.17);
coverCartouche.rotation.x = -Math.PI / 2;
coverLeaves[1].add(coverCartouche);
castBlock(coverCartouche, bronze, 3.15, 0.79, 0.035, 0, 0, 0.012, 0.013);
castBlock(coverCartouche, enamelBlue, 3.05, 0.69, 0.032, 0, 0, 0.035, 0.011);
mesh(crestGeometry, brass, coverCartouche, -1.20, 0, 0.056).scale.setScalar(1.25);
engraving(coverCartouche, 2.40, 0.48, 0.15, 0, 0.055, { italic: true })('Steam Tycoon');
const coverLock = new THREE.Group();
coverLock.position.set(0, 0.113, 2.16);
coverLock.rotation.x = -Math.PI / 2;
coverLeaves[2].add(coverLock);
castBlock(coverLock, bronze, 1.92, 0.341, 0.063, 0.06, 0, 0, 0.025);
castBlock(coverLock, brass, 1.81, 0.284, 0.042, 0.06, 0, 0.039, 0.016);
const coverKnob = new THREE.Group();
coverKnob.position.set(-0.632, 0, 0.069);
coverLock.add(coverKnob);
cylinder(coverKnob, bronze, 0.112, 0.055, 0, 0, 0, 'z');
castBlock(coverKnob, brass, 0.156, 0.051, 0.032, 0, 0, 0.04, 0.014);
const coverHint = engraving(coverLock, 1.22, 0.202, 0.211, 0, 0.064, { color: '#2c2018' });
const coverBounds = boxCorners({
  min: new THREE.Vector3(-3.75, -0.076, -0.020),
  max: new THREE.Vector3(3.75, 0.28, leafLength + 0.025),
});
let unfolding = coverState === 'open' ? 1 : 0;
const boardHelp = stage.getAttribute('aria-label');

function poseCover() {
  const rear = THREE.MathUtils.smoothstep(unfolding, 0, 0.94);
  const fold = THREE.MathUtils.smoothstep(unfolding, 0.13, 1);
  const tuck = THREE.MathUtils.smoothstep(unfolding, 0.69, 1);
  coverHinge.position.set(0, 0.10 - 0.36 * tuck, -3.73 - 0.79 * tuck);
  coverLeaves[0].rotation.x = -2.69 * rear;
  coverLeaves[1].rotation.x = 3.01 * fold;
  coverLeaves[2].rotation.x = -3.03 * fold;
  coverKnob.rotation.z = coverState === 'locked' ? 0 : Math.PI / 2;
}

function updateOpeningHint() {
  const locked = coverState === 'locked';
  coverHint(locked ? 'Turn clasp' : 'Lift lid');
  openBoxButton.textContent = locked ? 'Turn clasp' : 'Lift lid';
  openBoxButton.disabled = coverState === 'opening';
  openBoxButton.hidden = coverState === 'open';
  stage.setAttribute('aria-label', coverState === 'open' ? boardHelp
    : locked ? 'Closed gift box. Click the clasp or press Enter to turn it.'
      : 'Gift box unlatched. Click the lid or press Enter to lift it.');
}

function advanceCover() {
  if (coverState === 'locked') {
    coverState = 'unlatched';
    playSound('latch');
    poseCover();
  } else if (coverState === 'unlatched') {
    coverState = 'opening';
    playSound('latch');
  }
  updateOpeningHint();
}

openBoxButton.addEventListener('click', advanceCover);
poseCover();
updateOpeningHint();

function animateCover(elapsed) {
  if (coverState !== 'opening') return;
  unfolding = Math.min(1, unfolding + elapsed * 0.89);
  poseCover();
  if (unfolding >= 0.65) level.group.visible = true;
  if (unfolding >= 0.82) lid.visible = true;
  if (unfolding === 1) {
    coverState = 'open';
    progress.opened = true;
    recordProgress();
    updateOpeningHint();
  }
  resize();
}

const tutorialMarker = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints([
    [-0.39, -0.39], [0.39, -0.39], [0.39, 0.39], [-0.39, 0.39],
  ].map(([x, z]) => new THREE.Vector3(x, 0, z))),
  new THREE.LineBasicMaterial({ color: 0xf2b952, toneMapped: false }),
);
tutorialMarker.position.set(world(2), 0.018, world(4));
const tutorialWash = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.78), new THREE.MeshBasicMaterial({
  color: 0xecac50, transparent: true, opacity: 0.23, depthWrite: false, toneMapped: false,
}));
tutorialWash.rotation.x = -Math.PI / 2;
tutorialWash.position.y = -0.008;
tutorialMarker.add(tutorialWash);
tutorialMarker.visible = false;
tray.add(tutorialMarker);

const titleStamp = engraving(lid, 2.09, 0.38, -2.42, 0.57, 0.105, { italic: true });
titleStamp('Steam Tycoon');
mesh(crestGeometry, inlay, lid, -3.19, 0.135, 0.107).scale.setScalar(1.18);
const inHandStamp = engraving(lid, 1.74, 0.21, -2.43, -0.18, 0.127);
castBlock(lid, bronze, 2.69, 0.485, 0.061, 0.22, 0.57, 0.116, 0.019);
const ivoryPlate = material(0xdab684, 0.22, 0.48);
castBlock(lid, ivoryPlate, 2.59, 0.398, 0.041, 0.22, 0.57, 0.148, 0.015);
const boardStamp = engraving(lid, 2.43, 0.261, 0.22, 0.57, 0.172, { color: '#2c1a16' });
const statusStamp = engraving(lid, 3.39, 0.244, 0.09, -0.153, 0.128);
const ledgerStamp = engraving(lid, 3.0, 0.192, 0.21, 0.193, 0.116);
const dial = new THREE.Group();
dial.position.set(2.78, 0.40, 0.106);
lid.add(dial);
cylinder(dial, bronze, 0.415, 0.071, 0, 0, 0, 'z');
mesh(new THREE.CircleGeometry(0.374, 44), gaugeFace, dial, 0, 0, 0.042);
mesh(new THREE.TorusGeometry(0.389, 0.022, 10, 42), brass, dial, 0, 0, 0.046);
const lidNeedle = new THREE.Group();
dial.add(lidNeedle);
box(lidNeedle, gaugeRed, 0.039, 0.335, 0.012, 0, 0.121, 0.052);
cylinder(dial, brass, 0.043, 0.025, 0, 0, 0.063, 'z');
const pressureStamp = engraving(lid, 1.14, 0.217, 2.78, -0.21, 0.120);
const ledgerMark = mesh(rivetGeometry, collarActive, lid, -1.59, -0.156, 0.136);
ledgerMark.scale.setScalar(0.90);

const keyFinish = material(0xd9b179, 0.37, 0.36);
const keyHover = material(0xffdb98, 0.46, 0.32);
const keyPressed = material(0xb6804a, 0.53, 0.37);
const keyDisabled = material(0x7d6b59, 0.25, 0.64);
const lidControls = [];
let hoveredControl = null;

function castKey(x, y, width, label, invoke, disabled = () => false, pressed = () => false, height = 0.323) {
  const group = new THREE.Group();
  group.position.set(x, y, 0.122);
  lid.add(group);
  castBlock(group, bronze, width + 0.031, height + 0.038, 0.068, 0, 0, 0, 0.019);
  const keyTop = castBlock(group, keyFinish, width, height, 0.047, 0, 0, 0.042, 0.016);
  const write = engraving(group, width - 0.041, 0.220, 0, 0, 0.071, { color: '#251814', fontScale: 0.80 });
  const control = { keyTop, write, label, invoke, disabled, pressed };
  group.userData.control = control;
  lidControls.push(control);
}

function moveBoard(amount) {
  const next = levelSelect.selectedIndex + amount;
  if (next < 0 || next >= levelSelect.options.length) return;
  levelSelect.selectedIndex = next;
  levelSelect.dispatchEvent(new Event('change'));
}

function toggleLidInspection() {
  inspectingLid = !inspectingLid;
  hoveredControl = null;
  stage.focus({ preventScroll: true });
  highlight.visible = false;
  hidePreview();
  aimCamera();
  resize();
}
castKey(-2.35, 0.13, 1.01, () => inspectingLid ? 'Return' : 'Inspect lid', toggleLidInspection);
castKey(-1.40, 0.57, 0.43, () => '‹', () => moveBoard(-1), () => levelSelect.selectedIndex === 0);
castKey(1.84, 0.57, 0.43, () => '›', () => moveBoard(1), () => levelSelect.selectedIndex === levelSelect.options.length - 1);

function cycleHeight() {
  const allowed = [...heightGuide.options].filter(option => !option.disabled);
  const index = allowed.findIndex(option => option.selected);
  heightGuide.value = allowed[(index + 1) % allowed.length].value;
  heightGuide.dispatchEvent(new Event('change'));
}

const keyActions = [
  ['Rack', drawerLatch, () => drawerOpen],
  ['Turn', turnPiece],
  ['Undo', undoButton],
  ['Redo', redoButton],
  ['Reset', document.querySelector('#reset')],
  ['Fitting', rewardLatch, () => rewardOpen, null, () => rewardPlate.hidden],
  ['Left', document.querySelector('#view-left')],
  ['Right', document.querySelector('#view-right')],
  ['Top', overheadButton, () => overhead],
  ['Home', homeButton],
  ['Height', heightGuide, () => heightGuide.value !== '', cycleHeight, () => heightControl.hidden],
  ['Sound', soundButton, () => !muted],
];

for (const [i, [label, button, pressed, invoke, disabled]] of keyActions.entries()) {
  castKey((i % 6 - 2.5) * 1.12, i < 6 ? -0.423 : -0.754, 1.03,
    label === 'Height' ? () => heightGuide.value ? `Level ${heightGuide.value}` : 'Height' : () => label,
    invoke ?? (() => button.click()), disabled ?? (() => button.disabled), pressed, 0.257);
}

const lidBounds = boxCorners(new THREE.Box3().setFromObject(lid));

function updateCaseLid() {
  const number = Number(levelSelect.value) + 1;
  const boardTitle = level.tutorial ? level.name : `${number} · ${level.name}`;
  boardStamp(`${level.solved ? '✓ ' : ''}${boardTitle}`);
  ledgerStamp(ledgerCount.textContent);
  pressureStamp(`Pressure ${pressureReadout.textContent}`);
  inHandStamp(drawerDiscovered ? `In hand · ${selectedTool.textContent}` : 'Release the pipe rack');
  let readout = rewardOpen ? rewardLabel.textContent : status.textContent;
  if (level.tutorial) {
    if (powered) readout = 'First fitting complete · Next board ›';
    else if (!drawerOpen && tool !== 'elbow') readout = 'Pull the brass ring to open the rack';
    else if (tool !== 'elbow') readout = 'Pick up the elbow from the rack';
    else readout = 'Fit it into the gold-marked gap';
  }
  tutorialMarker.visible = coverState === 'open' && level.tutorial && !level.pipes.has(key(2, 4));
  statusStamp(readout);
  ledgerMark.material = powered ? collarActive : bronze;
  for (const control of lidControls) {
    const { keyTop, label, write, disabled, pressed } = control;
    write(label());
    keyTop.material = disabled() ? keyDisabled
      : hoveredControl === control ? keyHover
      : pressed() ? keyPressed : keyFinish;
  }
}

selectLevel(Number(levelSelect.value));
new ResizeObserver(resize).observe(stage);
let previous = performance.now();
renderer.setAnimationLoop(now => {
  const elapsed = Math.max(0, (now - previous) / 1000);
  const dt = Math.min(elapsed, 0.05);
  previous = now;
  turnTray(Math.min(elapsed, 0.26));
  moveDrawer(Math.min(elapsed, 0.26));
  animateReward(Math.min(elapsed, 0.26));
  animateCover(Math.min(elapsed, 0.26));
  animateMachine(dt, elapsed);
  animateSnap(dt);
  animateGauge(elapsed);
  updateCaseLid();
  if (coverState === 'open') animateSteam(dt);
  renderer.render(scene, camera);
});
