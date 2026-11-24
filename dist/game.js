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
const workshop = document.querySelector('#workshop');
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

function aimCamera() {
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
const castSteel = material(0x635e58, 0.5, 0.67);
const bronze = material(0x946134, 0.69, 0.46);
const gaugeRed = new THREE.MeshStandardMaterial({
  color: 0xc62916, emissive: 0x7b180a, emissiveIntensity: 0.38, roughness: 0.55,
});
const frame = material(0x553423, 0.14, 0.57);
const velvet = material(0x141e47, 0.06, 0.96);
const enamelBlue = material(0x203866, 0.53, 0.36);
const dark = material(0x171c1b, 0.2);
const brass = material(0xc99654, 0.72, 0.33);
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

const floor = mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.25 }), scene, 0, -0.91, 0);
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
const tileFinishes = [0xd8b991, 0xc8ab87, 0xd4b38d, 0xcfb492].map(color => material(color, 0.07, 0.77));

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
  const wash = ctx.createRadialGradient(106, 111, 40, 128, 128, 144);
  wash.addColorStop(0, '#fcf2dc');
  wash.addColorStop(1, '#bfaa88');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 256, 256);
  const random = randomTextureSample();
  for (let i = 0; i < 3500; i++) {
    ctx.fillStyle = `rgba(102, 71, 47, ${random() * 0.12})`;
    ctx.fillRect(random() * 256, random() * 256, 2, 2);
  }
  ctx.strokeStyle = '#9475539c';
  ctx.lineWidth = 2;
  ctx.strokeRect(13, 13, 230, 230);
  ctx.strokeStyle = '#94755355';
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
    ctx.stroke();
    ctx.restore();
  }
  ctx.translate(128, 127);
  ctx.fillStyle = '#8b684666';
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
  ctx.fillRect(-12, 14, 24, 4);
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
for (const finish of [iron, bronze, brass, collarActive, riserFinish]) {
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
    castBlock(block, iron, 0.81, 0.075, 0.81, 0, 0.395, 0, 0.019);
    bolts(block, 0.294, 0.446);
  }

  const boiler = atTile(...definition.source, group, heights.get(key(...definition.source)) ?? 0);
  castBlock(boiler, frame, 0.87, 0.10, 0.87, 0, 0.05, 0, 0.025);
  bolts(boiler, 0.32, 0.105);
  cylinder(boiler, bronze, 0.332, 0.62, 0, 0.43, 0);
  for (const y of [0.17, 0.69]) {
    cylinder(boiler, bronze, 0.359, 0.073, 0, y, 0);
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      mesh(rivetGeometry, brass, boiler, 0.358 * Math.cos(angle), y, 0.358 * Math.sin(angle));
    }
  }
  const dome = mesh(new THREE.SphereGeometry(0.31, 24, 12), brass, boiler, 0, 0.72, 0);
  dome.scale.y = 0.59;
  mesh(new THREE.TorusGeometry(0.315, 0.019, 8, 32), brass, boiler, 0, 0.729, 0).rotation.x = Math.PI / 2;
  cylinder(boiler, iron, 0.06, 0.12, 0, 0.875, 0);
  cylinder(boiler, brass, 0.102, 0.037, 0, 0.938, 0);
  cylinder(boiler, iron, 0.115, 0.31, 0.345, pipeHeight, 0, 'x');
  cylinder(boiler, brass, 0.147, 0.086, 0.44, pipeHeight, 0, 'x');
  cylinder(boiler, brass, 0.345, 0.035, 0, 0.28, 0);
  cylinder(boiler, brass, 0.345, 0.035, 0, 0.59, 0);
  const gaugeNeedle = mountBoilerGauge(boiler, definition.view[0]);
  mesh(new THREE.TorusGeometry(0.097, 0.012, 8, 22), bronze, boiler, 0, 0.962, 0).rotation.x = Math.PI / 2;
  box(boiler, brass, 0.144, 0.016, 0.019, 0, 0.962, 0);
  box(boiler, brass, 0.019, 0.016, 0.144, 0, 0.962, 0);

  const receivers = definition.receivers ?? [{ position: definition.destination, build: definition.build }];
  return {
    ...definition, group, gaugeNeedle, pressure: 0, targetPressure: 0, pressureVelocity: 0,
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
  gauge.position.set(0, 0.825, 0.438);
  gauge.rotation.set(-0.72, THREE.MathUtils.degToRad(heading * 0.48), 0, 'YXZ');
  boiler.add(gauge);

  // The pressure tap starts inside the boiler and the union meets the back of the dial.
  cylinder(boiler, bronze, 0.052, 0.14, 0, 0.642, 0.309, 'z');
  const stem = cylinder(boiler, brass, 0.033, 0.208, 0, 0.726, 0.374);
  stem.rotation.x = 0.39;
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
  castBlock(receiver, machineEnamel, 0.91, 0.11, 0.91, 0, 0.106, 0, 0.027);
  bolts(receiver, 0.36, 0.169);
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
    animate: build(mechanism), powered: false, speed: 0, phase: 0,
  };
}

function buildFlywheel(receiver) {
  cylinder(receiver, iron, 0.155, 0.33, -0.15, 0.38, 0.04, 'x');
  castBlock(receiver, machineEnamel, 0.28, 0.49, 0.25, 0.23, 0.35, -0.05, 0.036);
  cylinder(receiver, iron, 0.075, 0.29, 0.23, 0.54, 0.06, 'z');

  const wheel = new THREE.Group();
  wheel.position.set(0.23, 0.54, 0.19);
  receiver.add(wheel);
  mesh(new THREE.TorusGeometry(0.305, 0.055, 10, 40), bronze, wheel);
  mesh(new THREE.TorusGeometry(0.314, 0.023, 8, 40), brass, wheel, 0, 0, 0.043);
  mesh(new THREE.TorusGeometry(0.314, 0.023, 8, 40), brass, wheel, 0, 0, -0.043);
  cylinder(wheel, brass, 0.08, 0.105, 0, 0, 0, 'z');
  for (let spoke = 0; spoke < 6; spoke++) {
    const angle = spoke * Math.PI / 3;
    const bar = box(wheel, iron, 0.051, 0.25, 0.049, -Math.sin(angle) * 0.14, Math.cos(angle) * 0.14, 0);
    bar.rotation.z = angle;
  }
  const crank = mesh(new THREE.BoxGeometry(1, 0.045, 0.037), brass, receiver);
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
  const enamel = Object.assign(material(0x93492f, 0.40), enamelTexture, { bumpScale: 0.012 });
  box(receiver, iron, 0.55, 0.12, 0.46, 0.08, 0.20, 0.07);
  for (const x of [-0.19, 0.35]) {
    box(receiver, enamel, 0.09, 0.69, 0.20, x, 0.49, 0.03);
    cylinder(receiver, brass, 0.036, 0.48, x, 0.47, 0.20);
  }
  box(receiver, enamel, 0.68, 0.16, 0.42, 0.08, 0.85, 0.05);
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
  const radius = 0.116;
  const start = new THREE.Vector3(0.5, 0, 0);
  const path = type === 'straight'
    ? new THREE.LineCurve3(start, new THREE.Vector3(-0.5, 0, 0))
    : new THREE.CubicBezierCurve3(start, new THREE.Vector3(0.224, 0, 0), new THREE.Vector3(0, 0, 0.224), new THREE.Vector3(0, 0, 0.5));
  return new THREE.TubeGeometry(path, type === 'elbow' ? 24 : 1, radius, 20, false);
}

function riserGeometry(type) {
  const [low, high] = pipePorts[type].map(port => {
    const [x, z] = directions[port];
    return new THREE.Vector3(x * 0.5, 0, z * 0.5);
  });
  const lowTurn = low.clone().multiplyScalar(0.30);
  const highTurn = high.clone().multiplyScalar(0.30);
  high.y = highTurn.y = heightStep;
  return new THREE.TubeGeometry(new THREE.CubicBezierCurve3(low, lowTurn, highTurn, high), 28, 0.116, 20, false);
}

const bodies = {
  straight: pipeGeometry('straight'), elbow: pipeGeometry('elbow'),
  riser: riserGeometry('riser'), 'riser-elbow': riserGeometry('riser-elbow'),
};
const junctionHub = new THREE.SphereGeometry(0.155, 20, 12);
const junctionArm = new THREE.TubeGeometry(
  new THREE.LineCurve3(new THREE.Vector3(), new THREE.Vector3(0.5, 0, 0)), 1, 0.116, 20, false,
);
const collarGeometry = new THREE.LatheGeometry([
  new THREE.Vector2(0.084, -0.042), new THREE.Vector2(0.134, -0.042),
  new THREE.Vector2(0.149, -0.029), new THREE.Vector2(0.149, 0.029),
  new THREE.Vector2(0.134, 0.042), new THREE.Vector2(0.084, 0.042),
  new THREE.Vector2(0.084, -0.042),
], 24);
const boards = [];
let tool = 'straight';
let powered = false;
let outlets = [];
let warmJoints = [];

function heightAt(index) {
  return level.heights.get(index) ?? 0;
}

function addPipe(x, z, type, rotation, fixed = false) {
  const group = atTile(x, z, level.group, heightAt(key(x, z)));
  group.position.y += pipeHeight;
  const body = fixed ? fixedPipeFinish : riseByPort[type] ? riserFinish : iron;
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
  return pipe ? pipePorts[pipe.type].map((port, i) => ({
    direction: (port + pipe.rotation) % 4,
    height: height + (riseByPort[pipe.type]?.[i] ?? 0),
  })) : [];
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
      const matched = inside(x + dx, z + dz) && portsAt(next).some(port =>
        port.direction === (direction + 2) % 4 && port.height === height);
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
    machine.powered = active.has(index);
    if (machine.powered) {
      supplied++;
      leaks.push(machine.vent);
    }
    machine.lampMaterial.emissive.setHex(machine.powered ? 0xff9b28 : 0x000000);
    machine.lampMaterial.emissiveIntensity = 1.8;
    machine.lampLight.intensity = machine.powered ? 1.75 : 0;
  }
  powered = supplied === level.machines.size && leakCount === 0;
  const supply = supplied / level.machines.size;
  level.targetPressure = Math.round((35 + 65 * supply) / (1 + 0.85 * leakCount));
  pressureMeter.setAttribute('aria-valuenow', String(level.targetPressure));
  pressureReadout.textContent = `${level.targetPressure}%`;
  outlets = leaks;
  warmJoints = joints;
  for (const [index, pipe] of level.pipes) {
    for (const collar of pipe.collars) collar.material = active.has(index) ? collarActive : brass;
  }
  workshop.classList.toggle('powered', powered);
  const leakStatus = leakCount === 1 ? '1 leak' : `${leakCount} leaks`;
  const machineName = level.machineName ?? level.name;
  const message = level.machines.size === 1
    ? (powered ? `Steam delivered · ${machineName} ${level.action}` : `Boiler on · ${machineName} idle`)
    : (powered ? `Board complete · ${supplied}/${level.machines.size} machines powered`
      : `${supplied}/${level.machines.size} machines powered · ${leakStatus}`);
  if (status.textContent !== message) status.textContent = message;
}

function removePipe(index) {
  const pipe = level.pipes.get(index);
  if (pipe) pipe.group.removeFromParent();
  level.pipes.delete(index);
}

function reset() {
  for (const index of level.pipes.keys()) removePipe(index);
  addPipe(level.source[0] + 1, level.source[1], 'straight', 0, true);
  for (const [x, z, type, rotation] of level.fixed ?? []) addPipe(x, z, type, rotation, true);
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
  if (!editable(x, z)) return;
  const index = key(x, z);
  const pipe = level.pipes.get(index);
  if (action === 'remove') removePipe(index);
  else if (pipe) {
    pipe.rotation = (pipe.rotation + 1) % rotationCount[pipe.type];
    pipe.group.rotation.y = -pipe.rotation * Math.PI / 2;
  } else if (canPlace(index, action)) addPipe(x, z, action, 0);
  updateFlow();
}

function canPlace(index, type) {
  return Object.hasOwn(pipePorts, type) && (!riseByPort[type] || heightAt(index) < maxHeight);
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
  const fixtureHit = raycaster.intersectObjects(level.group.children)[0];
  if (fixtureHit) {
    let object = fixtureHit.object;
    while (object.parent !== level.group) object = object.parent;
    return object.userData.position;
  }
  return raycaster.intersectObjects(tiles)[0]?.object.userData.position;
}

renderer.domElement.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse') return;
  const tile = pick(event);
  if (tile) select(...tile);
  else highlight.visible = false;
});
renderer.domElement.addEventListener('pointerleave', () => { highlight.visible = false; });
renderer.domElement.addEventListener('click', event => {
  const tile = pick(event);
  if (tile) {
    act(...tile);
    select(...tile);
  }
});
stage.addEventListener('focus', () => select(...selection));
stage.addEventListener('keydown', event => {
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

function renderToolThumbnails(buttons) {
  const showcase = new THREE.Scene();
  showcase.environment = reflection;
  showcase.environmentIntensity = 1.85;
  showcase.add(new THREE.HemisphereLight(0xe0edff, 0x9b6940, 2.1));
  const keyLight = new THREE.DirectionalLight(0xffedcf, 4.1);
  keyLight.position.set(-3, 5, 4);
  showcase.add(keyLight);
  const edgeLight = new THREE.DirectionalLight(0xb1c6ff, 2.5);
  edgeLight.position.set(1, 3, -4);
  showcase.add(edgeLight);

  const steel = material(0x838b92, 0.79, 0.28);
  const gold = material(0xeaba6c, 0.77, 0.25);
  const copper = material(0xaf6b46, 0.71, 0.26);
  const darkBrass = material(0x936337, 0.75, 0.34);
  const handle = material(0x59303a, 0.19, 0.38);
  const aspect = 1.62;
  const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 16);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  renderer.setSize(174, 108, false);
  for (const button of buttons) {
    const type = button.dataset.tool;
    const model = new THREE.Group();
    showcase.add(model);
    if (type === 'remove') {
      buildPliers(model, handle, steel, gold);
      model.rotation.y = -0.92;
    } else {
      buildPipeModel(model, type, { body: riseByPort[type] ? copper : steel, collar: gold, rivet: darkBrass });
    }

    const bounds = new THREE.Box3().setFromObject(model);
    bounds.getCenter(center);
    bounds.getSize(size);
    const halfHeight = Math.max(0.40, Math.max(size.x, size.z) * 0.40 + size.y * 0.33);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.position.copy(center).add(new THREE.Vector3(1.7, 3.9, 4.3));
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    renderer.render(showcase, camera);

    const icon = document.createElement('canvas');
    icon.width = renderer.domElement.width;
    icon.height = renderer.domElement.height;
    icon.className = 'tool-thumbnail';
    icon.setAttribute('aria-hidden', 'true');
    icon.getContext('2d').drawImage(renderer.domElement, 0, 0);
    const label = document.createElement('span');
    label.className = 'tool-label';
    label.textContent = button.textContent.trim();
    button.replaceChildren(icon, label);
    model.removeFromParent();
  }
  for (const finish of [steel, gold, copper, darkBrass, handle]) finish.dispose();
}

const buttons = [...document.querySelectorAll('[data-tool]')];
renderToolThumbnails(buttons);
for (const button of buttons) {
  button.addEventListener('click', () => {
    if (button.hidden) return;
    tool = button.dataset.tool;
    for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
    if (highlight.visible) select(...selection);
  });
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

function animateMachine(dt) {
  for (const machine of level.machines.values()) {
    machine.speed = THREE.MathUtils.damp(machine.speed, machine.powered ? 10 : 0, 4, dt);
    machine.phase += machine.speed * dt;
    machine.animate(machine.phase, machine.speed);
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
  for (const corner of [...boardBounds, ...level.fixtureBounds]) {
    cameraPoint.copy(corner).applyMatrix4(tray.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
    const x = cameraPoint.x / -cameraPoint.z;
    const y = cameraPoint.y / -cameraPoint.z;
    left = Math.min(left, x);
    right = Math.max(right, x);
    bottom = Math.min(bottom, y);
    top = Math.max(top, y);
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

const levelSelect = document.querySelector('#level');
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
  buttons[0].click();
  nextWisp = 0.84;
  for (const { sprite } of particles) sprite.visible = false;
}

function selectLevel(index) {
  if (level) level.group.visible = false;
  tray.rotation.y = 0;
  tray.updateMatrixWorld();
  boards[index] ??= buildLevel(levels[index]);
  level = boards[index];
  level.group.visible = true;
  viewTurns = 0;
  overhead = false;
  updateView();
  const advanced = level.machines.size > 1;
  const raised = level.heights.size > 0;
  const machineName = level.machineName ?? level.name;
  document.querySelector('#receiver-name').textContent = advanced ? 'Machines' : machineName;
  document.querySelector('#fixed-legend').hidden = !advanced && !raised;
  const goal = document.querySelector('#goal');
  if (raised) {
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
  clearSteamAndSelection();
  if (level.pipes.size) updateFlow();
  else reset();
}

levelSelect.addEventListener('change', () => selectLevel(Number(levelSelect.value)));
document.querySelector('#reset').addEventListener('click', () => {
  reset();
  clearSteamAndSelection();
});
selectLevel(Number(levelSelect.value));
new ResizeObserver(resize).observe(stage);
let previous = performance.now();
renderer.setAnimationLoop(now => {
  const elapsed = Math.max(0, (now - previous) / 1000);
  const dt = Math.min(elapsed, 0.05);
  previous = now;
  turnTray(Math.min(elapsed, 0.26));
  animateMachine(dt);
  animateGauge(elapsed);
  animateSteam(dt);
  renderer.render(scene, camera);
});
