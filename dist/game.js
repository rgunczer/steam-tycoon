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
    machineName: 'Ventilation fan', action: 'ventilating', build: buildFan, obstacles: [],
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
    machineName: 'Flywheel', action: 'spinning', build: buildFlywheel, bendRisers: true,
    terrain: [[2, 3, 1], [2, 2, 2], [3, 2, 2], [4, 2, 1], [5, 2, 1]],
    obstacles: [[3, 3], [3, 4], [2, 1], [3, 1], [4, 1]],
    fixed: [[4, 2, 'riser', 2]],
  },
  {
    name: 'Over the parapet', view: [-40, 61], source: [0, 4], destination: [5, 3],
    machineName: 'Ventilation fan', action: 'ventilating', build: buildFan, bendRisers: true,
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
const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 40);
const viewDistance = 17;
let viewTurns = 0;
let overhead = false;

function aimCamera() {
  const [heading, tilt] = level.view;
  const azimuth = THREE.MathUtils.degToRad(viewTurns * 90 + (overhead ? 0 : heading));
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

scene.add(new THREE.HemisphereLight(0xb9d4dc, 0x685143, 1.35));
const sun = new THREE.DirectionalLight(0xffc58e, 3.45);
sun.position.set(-4, 7, 2);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 20 });
sun.shadow.normalBias = 0.022;
sun.shadow.bias = -0.0002;
scene.add(sun);
const rim = new THREE.DirectionalLight(0x68c8ca, 1.55);
rim.position.set(3, 4, -6);
scene.add(rim);

function material(color, metalness = 0.35, roughness = 0.48) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

const iron = material(0x51575a, 0.69, 0.39);
const castSteel = material(0x635e58, 0.5, 0.67);
const bronze = material(0x946134, 0.69, 0.46);
const ivory = material(0xead1a2, 0.08, 0.63);
const gaugeRed = material(0x9c301d, 0.26, 0.46);
const frame = material(0x584236, 0.54, 0.64);
const dark = material(0x171c1b, 0.2);
const brass = material(0xc99654, 0.72, 0.33);
const teal = material(0x376e65, 0.42);
const wallFinish = material(0x534b43, 0.42, 0.7);
const platformFinish = material(0x475d59, 0.42, 0.62);
const deckFinish = material(0x776655, 0.38, 0.72);
const riserFinish = material(0x995d38, 0.62, 0.43);
const fixedPipeFinish = material(0x468e9f, 0.48, 0.4);
const collarActive = brass.clone();
collarActive.emissive.setHex(0x9c470c);
collarActive.emissiveIntensity = 0.58;
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

function atTile(x, z, parent = scene, height = 0) {
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
castBlock(scene, dark, 6.64, 0.49, 6.64, 0, -0.36, 0, 0.075);
box(scene, frame, 6.69, 0.085, 6.69, 0, -0.53, 0);
box(scene, brass, 1.48, 0.19, 0.05, 0, -0.323, 3.32);
box(scene, dark, 1.35, 0.105, 0.06, 0, -0.323, 3.348);
castBlock(scene, frame, 6.73, 0.15, 6.73, 0, -0.11, 0, 0.045);
for (const x of [-3.19, 3.19]) {
  for (const z of [-3.19, 3.19]) {
    box(scene, teal, 0.49, 0.4, 0.49, x * 0.88, -0.70, z * 0.88);
    box(scene, frame, 0.57, 0.08, 0.57, x * 0.88, -0.86, z * 0.88);
    castBlock(scene, teal, 0.31, 0.16, 0.31, x, -0.035, z, 0.027);
    mesh(boltGeometry, brass, scene, x, 0.06, z);
  }
}

const tiles = [];
const grainSize = 128;
const grainPixels = new Uint8Array(grainSize * grainSize * 4);
let seed = 714;
for (let i = 0; i < grainPixels.length; i += 4) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  const x = (i / 4) % grainSize;
  const y = Math.floor(i / 4 / grainSize);
  const wear = 11 * Math.sin(x * 0.21 + Math.cos(y * 0.12)) + 7 * Math.cos(y * 0.31 + x * 0.17);
  const shade = 191 + (seed >>> 27) + wear;
  grainPixels.set([shade, shade, shade, 255], i);
}
const grain = new THREE.DataTexture(grainPixels, grainSize, grainSize);
grain.magFilter = THREE.LinearFilter;
grain.minFilter = THREE.LinearMipmapLinearFilter;
grain.generateMipmaps = true;
grain.needsUpdate = true;

const tileFinishes = [0x585552, 0x4e4d48, 0x565450, 0x4c4b48].map(color => material(color, 0.23, 0.81));
for (const finish of tileFinishes) {
  finish.map = grain;
  finish.bumpMap = grain;
  finish.bumpScale = 0.012;
}
frame.roughnessMap = grain;
iron.roughnessMap = grain;
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
    const tile = mesh(tileGeometry, tileFinishes[(x * 7 + z * 11 + x * z) % 4], scene, world(x), -0.101, world(z));
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
  scene.add(group);
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
  const gauge = new THREE.Group();
  gauge.position.set(0, 0.59, 0.34);
  gauge.rotation.x = -0.44;
  boiler.add(gauge);
  cylinder(gauge, bronze, 0.193, 0.092, 0, 0, 0, 'z');
  cylinder(gauge, ivory, 0.164, 0.01, 0, 0, 0.048, 'z');
  mesh(new THREE.TorusGeometry(0.176, 0.015, 8, 26), brass, gauge, 0, 0, 0.05);
  for (let i = 0; i <= 8; i++) {
    const angle = THREE.MathUtils.degToRad(-120 + i * 30);
    const tick = box(gauge, dark, 0.008, i % 2 === 0 ? 0.025 : 0.014, 0.004,
      Math.sin(angle) * 0.136, Math.cos(angle) * 0.136, 0.056);
    tick.rotation.z = -angle;
  }
  const gaugeNeedle = new THREE.Group();
  gauge.add(gaugeNeedle);
  box(gaugeNeedle, gaugeRed, 0.012, 0.125, 0.006, 0, 0.047, 0.061);
  cylinder(gauge, bronze, 0.016, 0.019, 0, 0, 0.061, 'z');

  const receivers = definition.receivers ?? [{ position: definition.destination, build: definition.build }];
  return {
    ...definition, group, gaugeNeedle, pressure: 0, targetPressure: 0,
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

function buildReceiver(group, position, port, build, height) {
  const receiver = atTile(...position, group, height);
  receiver.rotation.y = -(port - 2) * Math.PI / 2;
  castBlock(receiver, dark, 0.97, 0.075, 0.98, 0, 0.0375, 0, 0.019);
  castBlock(receiver, teal, 0.91, 0.11, 0.91, 0, 0.106, 0, 0.027);
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
  return {
    port, lampMaterial, lampLight,
    vent: { ...ventPosition, dx: 0, dz: 0 },
    animate: build(receiver), powered: false, speed: 0, phase: 0,
  };
}

function buildFlywheel(receiver) {
  cylinder(receiver, iron, 0.155, 0.33, -0.15, 0.38, 0.04, 'x');
  castBlock(receiver, teal, 0.28, 0.49, 0.25, 0.23, 0.35, -0.05, 0.036);
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
  box(receiver, teal, 0.48, 0.42, 0.40, 0.08, 0.31, -0.04);
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
    box(blade, teal, 0.115, 0.23, 0.035, 0.027, 0.16, 0).rotation.z = -0.26;
  }
  mesh(new THREE.TorusGeometry(0.32, 0.031, 10, 40), brass, receiver, 0.08, 0.64, 0.18);
  return phase => { rotor.rotation.z = phase * 1.5; };
}

function buildPress(receiver) {
  const enamel = material(0x93492f, 0.40);
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

function heightAt(index) {
  return level.heights.get(index) ?? 0;
}

function addPipe(x, z, type, rotation, fixed = false) {
  const group = atTile(x, z, level.group, heightAt(key(x, z)));
  group.position.y += pipeHeight;
  const elevations = riseByPort[type];
  const finish = fixed ? fixedPipeFinish : elevations ? riserFinish : iron;
  if (bodies[type]) {
    mesh(bodies[type], finish, group);
  } else {
    mesh(junctionHub, finish, group);
    for (const port of pipePorts[type]) {
      mesh(junctionArm, finish, group).rotation.y = -port * Math.PI / 2;
    }
  }
  if (fixed) {
    const bracket = castBlock(group, bronze, 0.35, 0.065, 0.35, 0, -0.223, 0, 0.012);
    bolts(bracket, 0.132, 0.035);
  }
  const collars = pipePorts[type].map((port, i) => {
    const [dx, dz] = directions[port];
    const flange = new THREE.Group();
    flange.position.set(dx * 0.451, (elevations?.[i] ?? 0) * heightStep, dz * 0.451);
    if (dx) flange.rotation.z = Math.PI / 2;
    else flange.rotation.x = Math.PI / 2;
    group.add(flange);
    const collar = mesh(collarGeometry, brass, flange);
    for (let i = 0; i < 4; i++) {
      const angle = (i + 0.5) * Math.PI / 2;
      mesh(rivetGeometry, bronze, flange, Math.cos(angle) * 0.128, 0.025, Math.sin(angle) * 0.128);
    }
    return collar;
  });
  group.rotation.y = -rotation * Math.PI / 2;
  level.pipes.set(key(x, z), { type, rotation, fixed, group, collars });
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
  pressureHand.style.transform = `rotate(${-120 + 2.4 * level.targetPressure}deg)`;
  outlets = leaks;
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
    machine.animate(0);
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
scene.add(highlight);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let selection;

function select(x, z) {
  selection = [x, z];
  const index = key(x, z);
  const allowed = editable(x, z) && (level.pipes.has(index) || canPlace(index, tool));
  highlight.position.set(world(x), heightAt(index) * heightStep, world(z));
  highlight.material.color.setHex(allowed ? 0x8cf1d9 : 0xefb171);
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

const buttons = [...document.querySelectorAll('[data-tool]')];
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
const gradient = paint.createRadialGradient(32, 32, 2, 32, 32, 32);
gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
gradient.addColorStop(0.45, 'rgba(255,255,255,0.44)');
gradient.addColorStop(1, 'rgba(255,255,255,0)');
paint.fillStyle = gradient;
paint.fillRect(0, 0, 64, 64);
const vaporTexture = new THREE.CanvasTexture(vapor);
const particles = Array.from({ length: 48 }, () => {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: vaporTexture, color: 0xe2edec, transparent: true, depthWrite: false,
  }));
  sprite.visible = false;
  scene.add(sprite);
  return { sprite, age: 2, dx: 0, dz: 0 };
});
let nextParticle = 0;
let emission = 0;

function animateSteam(dt) {
  emission += dt;
  if (emission >= (powered ? 0.092 : 0.045)) {
    emission = 0;
    for (const outlet of outlets) {
      const particle = particles[nextParticle];
      nextParticle = (nextParticle + 1) % particles.length;
      particle.age = 0;
      particle.dx = outlet.dx * 0.78 + (Math.random() - 0.5) * 0.2;
      particle.dz = outlet.dz * 0.78 + (Math.random() - 0.5) * 0.2;
      particle.sprite.position.set(outlet.x, outlet.y, outlet.z);
      particle.sprite.material.rotation = Math.random() * Math.PI * 2;
      particle.sprite.visible = true;
    }
  }
  for (const particle of particles) {
    if (!particle.sprite.visible) continue;
    particle.age += dt;
    const { sprite, age, dx, dz } = particle;
    sprite.visible = age < 1.1;
    sprite.position.x += dx * dt * (1 - age * 0.6);
    sprite.position.z += dz * dt * (1 - age * 0.6);
    sprite.position.y += (0.25 + age * 0.53) * dt;
    sprite.scale.setScalar(0.13 + age * 0.64);
    sprite.material.rotation += dt * 0.52;
    sprite.material.opacity = Math.max(0, 0.68 * (1 - age / 1.1));
  }
}

function animateMachine(dt) {
  for (const machine of level.machines.values()) {
    machine.speed = THREE.MathUtils.damp(machine.speed, machine.powered ? 10 : 0, 4, dt);
    machine.phase += machine.speed * dt;
    machine.animate(machine.phase);
  }
  level.pressure = THREE.MathUtils.damp(level.pressure, level.targetPressure, 5, dt);
  level.gaugeNeedle.rotation.z = THREE.MathUtils.degToRad(120 - 2.4 * level.pressure);
}

function boxCorners({ min, max }) {
  return [min.x, max.x].flatMap(x => [min.y, max.y].flatMap(y =>
    [min.z, max.z].map(z => new THREE.Vector3(x, y, z)),
  ));
}

const boardBounds = boxCorners({
  min: new THREE.Vector3(-3.4, -0.91, -3.4),
  max: new THREE.Vector3(3.4, 0.04, 3.4),
});
const cameraPoint = new THREE.Vector3();

function resize() {
  const { clientWidth: width, clientHeight: height } = stage;
  const aspect = Math.max(width, 1) / Math.max(height, 1);
  let left = Infinity;
  let right = -Infinity;
  let bottom = Infinity;
  let top = -Infinity;
  for (const corner of [...boardBounds, ...level.fixtureBounds]) {
    cameraPoint.copy(corner).applyMatrix4(camera.matrixWorldInverse);
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
  renderer.setSize(width, height, false);
}

const overheadButton = document.querySelector('#view-overhead');
const homeButton = document.querySelector('#view-home');

function updateView() {
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
scene.add(guideLines);

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
  for (const { sprite } of particles) sprite.visible = false;
}

function selectLevel(index) {
  if (level) level.group.visible = false;
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
  const dt = Math.min((now - previous) / 1000, 0.05);
  previous = now;
  animateMachine(dt);
  animateSteam(dt);
  renderer.render(scene, camera);
});
