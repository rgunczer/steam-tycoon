import * as THREE from "./vendor/three.module.min.js";

const size = 6;
const levels = [
  { name: 'Flywheel', action: 'spinning', source: [0, 4], destination: [5, 1],
    obstacles: [[3, 4], [3, 2], [4, 3]], build: buildFlywheel },
  { name: 'Ventilation fan', action: 'ventilating', source: [0, 1], destination: [5, 4],
    obstacles: [[3, 0], [3, 1], [3, 2], [3, 3], [3, 5], [1, 3]], build: buildFan },
  { name: 'Steam press', action: 'stamping', source: [0, 5], destination: [5, 0],
    obstacles: [[3, 5], [2, 3], [2, 2], [4, 4], [4, 3], [4, 2], [4, 1]], build: buildPress },
];
const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const pipePorts = { straight: [0, 2], elbow: [0, 1] };
const key = (x, z) => z * size + x;
const inside = (x, z) => x >= 0 && z >= 0 && x < size && z < size;
const world = n => n - (size - 1) / 2;
let level;
const pipeHeight = 0.27;
const stage = document.querySelector('#stage');
const workshop = document.querySelector('#workshop');
const status = document.querySelector('#status');

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera();
camera.position.set(2.6, 8.8, 9.4);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
stage.append(renderer.domElement);

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

const iron = material(0x515457, 0.64, 0.43);
const frame = material(0x403731, 0.48);
const dark = material(0x171c1b, 0.2);
const brass = material(0xc88b44, 0.65, 0.32);
const teal = material(0x376e65, 0.42);
const collarActive = brass.clone();
collarActive.emissive.setHex(0x9c470c);
collarActive.emissiveIntensity = 0.58;
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

function cylinder(parent, finish, radius, length, x, y, z, axis = 'y') {
  const object = mesh(new THREE.CylinderGeometry(radius, radius, length, 24), finish, parent, x, y, z);
  if (axis === 'x') object.rotation.z = Math.PI / 2;
  if (axis === 'z') object.rotation.x = Math.PI / 2;
  return object;
}

function atTile(x, z, parent = scene) {
  const group = new THREE.Group();
  group.position.set(world(x), 0, world(z));
  parent.add(group);
  return group;
}

function bolts(parent, spread, height) {
  for (const x of [-spread, spread]) {
    for (const z of [-spread, spread]) mesh(boltGeometry, brass, parent, x, height, z);
  }
}

const floor = mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.32 }), scene, 0, -0.91, 0);
floor.rotation.x = -Math.PI / 2;
floor.castShadow = false;
box(scene, dark, 6.64, 0.49, 6.64, 0, -0.36, 0);
box(scene, frame, 6.69, 0.085, 6.69, 0, -0.53, 0);
box(scene, brass, 1.48, 0.19, 0.05, 0, -0.323, 3.32);
box(scene, dark, 1.35, 0.105, 0.06, 0, -0.323, 3.348);
box(scene, frame, 6.73, 0.14, 6.73, 0, -0.11, 0);
for (const x of [-3.19, 3.19]) {
  for (const z of [-3.19, 3.19]) {
    box(scene, teal, 0.49, 0.4, 0.49, x * 0.88, -0.70, z * 0.88);
    box(scene, frame, 0.57, 0.08, 0.57, x * 0.88, -0.86, z * 0.88);
    box(scene, teal, 0.29, 0.16, 0.29, x, -0.035, z);
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
function buildLevel(definition) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  for (const [x, z] of definition.obstacles) {
    const block = atTile(x, z, group);
    box(block, dark, 0.83, 0.09, 0.83, 0, 0.05, 0);
    box(block, frame, 0.74, 0.34, 0.74, 0, 0.22, 0);
    box(block, iron, 0.75, 0.055, 0.75, 0, 0.41, 0);
    bolts(block, 0.27, 0.455);
  }

  const boiler = atTile(...definition.source, group);
  box(boiler, frame, 0.85, 0.09, 0.85, 0, 0.05, 0);
  bolts(boiler, 0.32, 0.105);
  cylinder(boiler, brass, 0.32, 0.62, 0, 0.43, 0);
  for (const y of [0.17, 0.69]) cylinder(boiler, iron, 0.344, 0.075, 0, y, 0);
  const dome = mesh(new THREE.SphereGeometry(0.31, 24, 12), brass, boiler, 0, 0.72, 0);
  dome.scale.y = 0.46;
  cylinder(boiler, iron, 0.06, 0.12, 0, 0.875, 0);
  cylinder(boiler, brass, 0.102, 0.037, 0, 0.938, 0);
  cylinder(boiler, iron, 0.115, 0.31, 0.345, pipeHeight, 0, 'x');
  cylinder(boiler, brass, 0.147, 0.086, 0.44, pipeHeight, 0, 'x');
  cylinder(boiler, brass, 0.345, 0.035, 0, 0.28, 0);
  cylinder(boiler, brass, 0.345, 0.035, 0, 0.59, 0);
  cylinder(boiler, brass, 0.094, 0.06, 0, 0.55, 0.318, 'z');
  cylinder(boiler, material(0xe9d4a7, 0.1), 0.075, 0.01, 0, 0.55, 0.353, 'z');
  box(boiler, dark, 0.013, 0.09, 0.006, 0, 0.558, 0.36).rotation.z = -0.6;

  const receiver = atTile(...definition.destination, group);
  box(receiver, teal, 0.92, 0.12, 0.94, 0, 0.06, 0);
  bolts(receiver, 0.36, 0.134);
  cylinder(receiver, iron, 0.11, 0.36, -0.32, pipeHeight, 0, 'x');
  cylinder(receiver, brass, 0.146, 0.085, -0.44, pipeHeight, 0, 'x');
  cylinder(receiver, brass, 0.05, 0.38, -0.29, 0.39, -0.32);
  cylinder(receiver, iron, 0.065, 0.045, -0.29, 0.58, -0.32);
  const lampMaterial = material(0x5c351c, 0.1);
  const lamp = mesh(new THREE.SphereGeometry(0.056, 16, 10), lampMaterial, receiver, -0.29, 0.36, 0.32);
  const lampLight = new THREE.PointLight(0xffa33e, 0, 1.35);
  lampLight.position.copy(lamp.position);
  receiver.add(lampLight);

  return {
    ...definition, group, lampMaterial, lampLight,
    vent: { x: receiver.position.x - 0.29, y: 0.61, z: receiver.position.z - 0.32, dx: 0, dz: 0 },
    animate: definition.build(receiver),
    sourceKey: key(...definition.source),
    destinationKey: key(...definition.destination),
    blocked: new Set(definition.obstacles.map(position => key(...position))),
    pipes: new Map(), speed: 0, phase: 0,
  };
}

function buildFlywheel(receiver) {
  cylinder(receiver, iron, 0.155, 0.33, -0.15, 0.38, 0.04, 'x');
  box(receiver, teal, 0.26, 0.48, 0.23, 0.23, 0.33, -0.05);
  cylinder(receiver, iron, 0.075, 0.29, 0.23, 0.54, 0.06, 'z');

  const wheel = new THREE.Group();
  wheel.position.set(0.23, 0.54, 0.19);
  receiver.add(wheel);
  mesh(new THREE.TorusGeometry(0.285, 0.046, 10, 36), brass, wheel);
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
  const radius = 0.108;
  const start = new THREE.Vector3(0.5, 0, 0);
  const path = type === 'straight'
    ? new THREE.LineCurve3(start, new THREE.Vector3(-0.5, 0, 0))
    : new THREE.CubicBezierCurve3(start, new THREE.Vector3(0.224, 0, 0), new THREE.Vector3(0, 0, 0.224), new THREE.Vector3(0, 0, 0.5));
  return new THREE.TubeGeometry(path, type === 'elbow' ? 24 : 1, radius, 20, false);
}

const bodies = { straight: pipeGeometry('straight'), elbow: pipeGeometry('elbow') };
const collarGeometry = new THREE.LatheGeometry([
  new THREE.Vector2(0.084, -0.042), new THREE.Vector2(0.134, -0.042),
  new THREE.Vector2(0.149, -0.029), new THREE.Vector2(0.149, 0.029),
  new THREE.Vector2(0.134, 0.042), new THREE.Vector2(0.084, 0.042),
  new THREE.Vector2(0.084, -0.042),
], 24);
const boards = levels.map(buildLevel);
let tool = 'straight';
let powered = false;
let outlets = [];

function addPipe(x, z, type, rotation, fixed = false) {
  const group = atTile(x, z, level.group);
  group.position.y = pipeHeight;
  mesh(bodies[type], iron, group);
  const collars = pipePorts[type].map(port => {
    const [dx, dz] = directions[port];
    const collar = mesh(collarGeometry, brass, group, dx * 0.451, 0, dz * 0.451);
    if (dx) collar.rotation.z = Math.PI / 2;
    else collar.rotation.x = Math.PI / 2;
    return collar;
  });
  group.rotation.y = -rotation * Math.PI / 2;
  level.pipes.set(key(x, z), { type, rotation, fixed, group, collars });
}

function portsAt(index) {
  if (index === level.sourceKey) return [0];
  if (index === level.destinationKey) return [2];
  const pipe = level.pipes.get(index);
  return pipe ? pipePorts[pipe.type].map(port => (port + pipe.rotation) % 4) : [];
}

function updateFlow() {
  const active = new Set([level.sourceKey]);
  const queue = [level.sourceKey];
  const leaks = [];
  for (const index of queue) {
    if (index === level.destinationKey) continue;
    const x = index % size;
    const z = Math.floor(index / size);
    for (const port of portsAt(index)) {
      const [dx, dz] = directions[port];
      const next = key(x + dx, z + dz);
      if (!inside(x + dx, z + dz) || !portsAt(next).includes((port + 2) % 4)) {
        leaks.push({ x: world(x) + 0.49 * dx, y: pipeHeight, z: world(z) + 0.49 * dz, dx, dz });
      } else if (!active.has(next)) {
        active.add(next);
        queue.push(next);
      }
    }
  }
  powered = active.has(level.destinationKey);
  if (powered) {
    leaks.push(level.vent);
  }
  outlets = leaks;
  for (const [index, pipe] of level.pipes) {
    for (const collar of pipe.collars) collar.material = active.has(index) ? collarActive : brass;
  }
  level.lampMaterial.emissive.setHex(powered ? 0xff9b28 : 0x000000);
  level.lampMaterial.emissiveIntensity = 1.8;
  level.lampLight.intensity = powered ? 1.75 : 0;
  workshop.classList.toggle('powered', powered);
  const message = powered ? `Steam delivered · ${level.name} ${level.action}` : `Boiler on · ${level.name} idle`;
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
  level.phase = level.speed = 0;
  updateFlow();
}

function editable(x, z) {
  const index = key(x, z);
  return index !== level.sourceKey && index !== level.destinationKey && !level.blocked.has(index) && !level.pipes.get(index)?.fixed;
}

function act(x, z, action = tool) {
  if (!editable(x, z)) return;
  const index = key(x, z);
  const pipe = level.pipes.get(index);
  if (action === 'remove') removePipe(index);
  else if (pipe) {
    pipe.rotation = (pipe.rotation + 1) % (pipe.type === 'straight' ? 2 : 4);
    pipe.group.rotation.y = -pipe.rotation * Math.PI / 2;
  } else if (action !== 'rotate') addPipe(x, z, action, 0);
  updateFlow();
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
  highlight.position.set(world(x), 0, world(z));
  highlight.material.color.setHex(editable(x, z) ? 0x8cf1d9 : 0xefb171);
  highlight.visible = true;
}

function pick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(2 * (event.clientX - rect.left) / rect.width - 1, 1 - 2 * (event.clientY - rect.top) / rect.height);
  raycaster.setFromCamera(pointer, camera);
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
    const [x, z] = selection.map((value, i) => THREE.MathUtils.clamp(value + move[i], 0, size - 1));
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
    tool = button.dataset.tool;
    for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
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
  level.speed = THREE.MathUtils.damp(level.speed, powered ? 10 : 0, 4, dt);
  level.phase += level.speed * dt;
  level.animate(level.phase);
}

function resize() {
  const { clientWidth: width, clientHeight: height } = stage;
  const aspect = width / Math.max(height, 1);
  const viewHeight = Math.max(7.6, 8.7 / aspect);
  camera.left = -viewHeight * aspect / 2;
  camera.right = -camera.left;
  camera.top = viewHeight / 2 + 0.16;
  camera.bottom = -viewHeight / 2 + 0.16;
  camera.near = 0.1;
  camera.far = 40;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

const levelSelect = document.querySelector('#level');

function clearSteamAndSelection() {
  selection = [level.source[0] + 1, Math.max(0, level.source[1] - 1)];
  highlight.visible = false;
  buttons[0].click();
  for (const { sprite } of particles) sprite.visible = false;
}

function selectLevel(index) {
  if (level) level.group.visible = false;
  level = boards[index];
  level.group.visible = true;
  document.querySelector('#receiver-name').textContent = level.name;
  document.querySelector('#goal').textContent = `Connect the boiler to the ${level.name.toLowerCase()}. Tap a placed pipe to turn it.`;
  clearSteamAndSelection();
  if (level.pipes.size) updateFlow();
  else reset();
}

levelSelect.addEventListener('change', () => selectLevel(Number(levelSelect.value)));
document.querySelector('#reset').addEventListener('click', () => {
  reset();
  clearSteamAndSelection();
});
new ResizeObserver(resize).observe(stage);
resize();
selectLevel(Number(levelSelect.value));
let previous = performance.now();
renderer.setAnimationLoop(now => {
  const dt = Math.min((now - previous) / 1000, 0.05);
  previous = now;
  animateMachine(dt);
  animateSteam(dt);
  renderer.render(scene, camera);
});
