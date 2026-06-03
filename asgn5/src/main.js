import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { Reflector } from "three/addons/objects/Reflector.js";

const app = document.getElementById("app");
const instructions = document.getElementById("instructions");
const startButton = document.getElementById("startButton");
const timeToggleButton = document.getElementById("timeToggleButton");
const portalButton = document.getElementById("portalButton");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b1720, 0.028);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 250);
camera.position.set(0, 1.7, 18);
camera.rotation.order = "YXZ";

const clock = new THREE.Clock();
const listener = new THREE.AudioListener();
camera.add(listener);

const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

const barkTexture = textureLoader.load("./assets/textures/bark.svg");
barkTexture.wrapS = THREE.RepeatWrapping;
barkTexture.wrapT = THREE.RepeatWrapping;
barkTexture.repeat.set(1, 3);
barkTexture.colorSpace = THREE.SRGBColorSpace;

const leafTexture = textureLoader.load("./assets/textures/leaves.svg");
leafTexture.wrapS = THREE.RepeatWrapping;
leafTexture.wrapT = THREE.RepeatWrapping;
leafTexture.repeat.set(2, 2);
leafTexture.colorSpace = THREE.SRGBColorSpace;

const mushroomTexture = textureLoader.load("./assets/textures/mushroom-cap.svg");
mushroomTexture.wrapS = THREE.RepeatWrapping;
mushroomTexture.wrapT = THREE.RepeatWrapping;
mushroomTexture.repeat.set(1, 1);
mushroomTexture.colorSpace = THREE.SRGBColorSpace;

const stoneTexture = textureLoader.load("./assets/textures/stone.svg");
stoneTexture.wrapS = THREE.RepeatWrapping;
stoneTexture.wrapT = THREE.RepeatWrapping;
stoneTexture.repeat.set(2, 2);
stoneTexture.colorSpace = THREE.SRGBColorSpace;

const tileTexture = textureLoader.load("./assets/textures/path-tile.png");
tileTexture.wrapS = THREE.RepeatWrapping;
tileTexture.wrapT = THREE.RepeatWrapping;
tileTexture.repeat.set(1.15, 6.5);
tileTexture.colorSpace = THREE.SRGBColorSpace;

const cardTexturePaths = [
  "./assets/textures/cards/alice-spades.png",
  "./assets/textures/cards/hatter-spades.png",
  "./assets/textures/cards/queen-spades.png",
  "./assets/textures/cards/dodo-spades.png",
  "./assets/textures/cards/queen-hearts.png",
  "./assets/textures/cards/rabbit-hearts.png",
  "./assets/textures/cards/rabbit-scroll-hearts.png",
  "./assets/textures/cards/cat-joker.png",
];
const cardTextures = cardTexturePaths.map((path) => {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
});
let cardTextureCursor = 0;

const skybox = cubeTextureLoader.load([
  "./assets/skybox/px.svg",
  "./assets/skybox/nx.svg",
  "./assets/skybox/py.svg",
  "./assets/skybox/ny.svg",
  "./assets/skybox/pz.svg",
  "./assets/skybox/nz.svg",
]);
skybox.colorSpace = THREE.SRGBColorSpace;
scene.background = skybox;

const colliders = [];
const animatedCards = [];
const animatedLights = [];
const animatedMushrooms = [];
const fireflies = [];
const animatedGrass = [];
const animatedHearts = [];
const nightGlowMaterials = [];
const timeSensitiveLights = {};
const queuedRosePlacements = [];
let daySkyDecor = null;
let nightSkyDecor = null;
let rabbitMarker = null;
let portalMirror = null;
let roseModelPrototype = null;
let roseModelHeight = 1;
const portalRabbitTrigger = new THREE.Vector3(0, 1.7, -5.2);
const portalQueenTrigger = new THREE.Vector3(0, 1.7, -12.8);
const portalRabbitLanding = new THREE.Vector3(0, 1.7, -1.8);
const portalQueenLanding = new THREE.Vector3(0, 1.7, -12.8);
let lastTeleportTime = -10;
let isDayMode = false;

const moveState = { forward: false, backward: false, left: false, right: false };
let isDraggingLook = false;
let yaw = 0;
let pitch = 0.24;
let lastMouseX = 0;
let lastMouseY = 0;

function tryPortalTeleport() {
  const elapsed = clock.elapsedTime;
  if (elapsed - lastTeleportTime <= 0.8) {
    return false;
  }

  const isNearRabbitSide = camera.position.distanceTo(portalRabbitTrigger) < 4.2;
  const isNearQueenSide = camera.position.distanceTo(portalQueenTrigger) < 4.2;

  if (isNearRabbitSide) {
    camera.position.copy(portalQueenLanding);
    yaw = 0;
  } else if (isNearQueenSide) {
    camera.position.copy(portalRabbitLanding);
    yaw = Math.PI;
  } else {
    return false;
  }

  pitch = 0.02;
  updateCameraRotation();
  lastTeleportTime = elapsed;
  return true;
}

function seededRandom(seed) {
  const value = Math.sin(seed * 127.1) * 43758.5453123;
  return value - Math.floor(value);
}

function addCollider(x, z, radius) {
  colliders.push({ x, z, radius });
}

function canMoveTo(position) {
  if (Math.abs(position.x) > 44 || Math.abs(position.z) > 44) {
    return false;
  }

  const pondCenter = new THREE.Vector2(0, -8);
  const pondDistance = pondCenter.distanceTo(new THREE.Vector2(position.x, position.z));
  if (pondDistance < 2.8) {
    return false;
  }

  for (const collider of colliders) {
    const dx = position.x - collider.x;
    const dz = position.z - collider.z;
    const minDistance = collider.radius + 0.75;
    if (dx * dx + dz * dz < minDistance * minDistance) {
      return false;
    }
  }

  return true;
}

function placeRoseInstance(x, y, z, height = 1, rotationY = 0) {
  if (!roseModelPrototype) {
    queuedRosePlacements.push({ x, y, z, height, rotationY });
    return;
  }

  const rose = roseModelPrototype.clone(true);
  const scale = height / roseModelHeight;
  rose.position.set(x, y, z);
  rose.rotation.y = rotationY;
  rose.scale.setScalar(scale);
  rose.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(rose);
}

function flushRosePlacements() {
  if (!roseModelPrototype) {
    return;
  }

  for (const placement of queuedRosePlacements.splice(0)) {
    placeRoseInstance(
      placement.x,
      placement.y,
      placement.z,
      placement.height,
      placement.rotationY
    );
  }
}

function loadRoseModel() {
  const loader = new FBXLoader();
  loader.load("./assets/rose/Models and Textures/rose.fbx", (fbx) => {
    const box = new THREE.Box3().setFromObject(fbx);
    const size = new THREE.Vector3();
    box.getSize(size);
    roseModelHeight = Math.max(size.y, 0.001);

    const center = new THREE.Vector3();
    box.getCenter(center);
    fbx.position.sub(center);
    fbx.position.y -= box.min.y - center.y;

    fbx.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (Array.isArray(child.material)) {
          child.material = child.material.map((material) => material.clone());
        } else if (child.material) {
          child.material = child.material.clone();
        }
      }
    });

    roseModelPrototype = fbx;
    flushRosePlacements();
  });
}

function makeGround() {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(52, 96),
    new THREE.MeshStandardMaterial({
      color: 0x7fab63,
      roughness: 1,
      metalness: 0.02,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(7.5, 29, 1, 1),
    new THREE.MeshStandardMaterial({
      map: tileTexture,
      color: 0xffffff,
      roughness: 0.76,
      metalness: 0.04,
    })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.06, 2);
  road.receiveShadow = true;
  scene.add(road);

  const roadBorderMaterial = new THREE.MeshStandardMaterial({
    color: 0x6d4b3c,
    roughness: 0.95,
  });
  for (const side of [-1, 1]) {
    const border = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.12, 29.2),
      roadBorderMaterial
    );
    border.position.set(side * 3.92, 0.06, 2);
    border.castShadow = true;
    border.receiveShadow = true;
    scene.add(border);
  }
}

function makeTree(x, z, scale, lean = 0) {
  const treeGroup = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35 * scale, 0.55 * scale, 5.8 * scale, 10),
    new THREE.MeshStandardMaterial({
      map: barkTexture,
      color: 0x5d7054,
      roughness: 1,
      metalness: 0.02,
    })
  );
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  trunk.position.y = 2.9 * scale;
  trunk.rotation.z = lean;
  treeGroup.add(trunk);

  for (let i = 0; i < 3; i += 1) {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 * scale, 0.18 * scale, 2.1 * scale, 8),
      trunk.material
    );
    branch.position.set((i - 1) * 0.7 * scale, 4.3 * scale, (i % 2 === 0 ? -0.45 : 0.45) * scale);
    branch.rotation.z = 0.9 - i * 0.55;
    branch.rotation.x = 0.65 - i * 0.15;
    branch.castShadow = true;
    treeGroup.add(branch);
  }

  for (let i = 0; i < 5; i += 1) {
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry((1.5 - i * 0.08) * scale, 14, 12),
      new THREE.MeshStandardMaterial({
        map: leafTexture,
        color: new THREE.Color().setHSL(0.32 + i * 0.02, 0.28, 0.26 + i * 0.03),
        roughness: 0.95,
      })
    );
    canopy.position.set(
      (seededRandom(x * 8 + z * 17 + i) - 0.5) * 1.8 * scale,
      5.1 * scale + seededRandom(i * 13 + x) * 1.4 * scale,
      (seededRandom(i * 29 + z) - 0.5) * 1.8 * scale
    );
    canopy.scale.y = 0.8 + seededRandom(i + z) * 0.4;
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    treeGroup.add(canopy);
  }

  treeGroup.position.set(x, 0, z);
  scene.add(treeGroup);
  addCollider(x, z, 1.35 * scale);
}

function makeMushroom(x, z, scale, color) {
  const group = new THREE.Group();

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25 * scale, 0.38 * scale, 1.8 * scale, 14),
    new THREE.MeshStandardMaterial({ color: 0xe8e5da, roughness: 0.95 })
  );
  stem.position.y = 0.9 * scale;
  stem.castShadow = true;
  stem.receiveShadow = true;
  group.add(stem);

  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.95 * scale, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      map: mushroomTexture,
      color,
      roughness: 0.9,
      emissive: color.clone().multiplyScalar(0.18),
    })
  );
  cap.position.y = 1.75 * scale;
  cap.scale.y = 0.6;
  cap.castShadow = true;
  cap.receiveShadow = true;
  group.add(cap);

  for (let i = 0; i < 7; i += 1) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.11 * scale, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf8f5ef, roughness: 0.8 })
    );
    const angle = (i / 7) * Math.PI * 2;
    dot.position.set(Math.cos(angle) * 0.42 * scale, 1.95 * scale, Math.sin(angle) * 0.36 * scale);
    group.add(dot);
  }

  group.position.set(x, 0, z);
  scene.add(group);
  animatedMushrooms.push({ mesh: cap, baseY: cap.position.y, offset: x * 0.23 + z * 0.11 });
  addCollider(x, z, 0.7 * scale);
}

function makeStone(x, z, scale) {
  const stone = new THREE.Mesh(
    new THREE.DodecahedronGeometry(scale, 0),
    new THREE.MeshStandardMaterial({
      map: stoneTexture,
      color: 0x64756d,
      roughness: 1,
      metalness: 0,
    })
  );
  stone.position.set(x, scale * 0.8, z);
  stone.rotation.set(seededRandom(x) * Math.PI, seededRandom(z) * Math.PI, seededRandom(x + z) * Math.PI);
  stone.castShadow = true;
  stone.receiveShadow = true;
  scene.add(stone);
  addCollider(x, z, scale * 0.8);
}

function makeLantern(x, z, color) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 2.8, 10),
    new THREE.MeshStandardMaterial({ color: 0x4e4138, roughness: 0.95 })
  );
  pole.position.set(x, 1.4, z);
  pole.castShadow = true;
  scene.add(pole);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 14),
    new THREE.MeshStandardMaterial({
      color: 0xfbf2d5,
      emissive: color,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    })
  );
  lamp.position.set(x, 2.6, z);
  lamp.castShadow = true;
  scene.add(lamp);

  const pointLight = new THREE.PointLight(color, 10, 10, 2);
  pointLight.position.copy(lamp.position);
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.set(512, 512);
  scene.add(pointLight);

  animatedLights.push({ light: pointLight, baseIntensity: 10, offset: x * 0.17 });
}

function makeFernCluster(x, z, scale) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x4f7a49,
    roughness: 0.9,
    emissive: 0x0d180d,
  });

  for (let i = 0; i < 5; i += 1) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.15 * scale, 1.1 * scale, 6), material);
    const angle = (i / 5) * Math.PI * 2;
    leaf.position.set(
      x + Math.cos(angle) * 0.22 * scale,
      0.42 * scale,
      z + Math.sin(angle) * 0.22 * scale
    );
    leaf.rotation.z = 0.8 + seededRandom(x * 10 + i) * 0.45;
    leaf.rotation.y = angle;
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    scene.add(leaf);
  }
}

function makeGrassTuft(x, z, scale, angle = 0) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x6c9853,
    roughness: 0.92,
    emissive: 0x0d170b,
    side: THREE.DoubleSide,
  });

  const tuft = new THREE.Group();
  for (let i = 0; i < 6; i += 1) {
    const blade = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18 * scale, 1.1 * scale),
      material
    );
    blade.position.set((i - 2.5) * 0.08 * scale, 0.46 * scale, 0);
    blade.rotation.y = angle + (i / 6) * Math.PI * 0.7;
    blade.rotation.z = 0.12 + Math.abs(i - 2.5) * 0.08;
    blade.castShadow = true;
    tuft.add(blade);
  }

  tuft.position.set(x, 0, z);
  scene.add(tuft);
  animatedGrass.push({ mesh: tuft, offset: x * 0.18 + z * 0.12 });
}

function makeGrassBorders() {
  for (let i = 0; i < 17; i += 1) {
    const z = 14 - i * 1.55;
    makeGrassTuft(-4.8, z, 1.15, 0.35);
    makeGrassTuft(-5.45, z + 0.3, 0.9, 0.2);
    makeGrassTuft(4.8, z, 1.15, -0.35);
    makeGrassTuft(5.45, z - 0.2, 0.9, -0.2);
  }
}

function makePathLanterns() {
  const leftLanterns = [
    [-5.9, 12.8, 0x8df3ff],
    [-5.8, 8.4, 0xb5f4d1],
    [-5.7, 3.8, 0x9fe1ff],
    [-5.8, -0.8, 0xf7d1ff],
    [-5.9, -5.6, 0xb6fff0],
  ];
  const rightLanterns = [
    [5.9, 10.6, 0xffd7f0],
    [5.8, 6.2, 0x9edcff],
    [5.7, 1.4, 0xd4ffc2],
    [5.8, -3.2, 0xc2f2ff],
    [5.9, -8.4, 0xffc6ec],
  ];

  for (const [x, z, color] of [...leftLanterns, ...rightLanterns]) {
    makeLantern(x, z, new THREE.Color(color));
  }
}

function makePortal() {
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0xe3bc69,
    emissive: 0x4d3212,
    roughness: 0.12,
    metalness: 0.86,
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xf6dfa2,
    emissive: 0x6b4518,
    roughness: 0.08,
    metalness: 0.82,
  });

  const gemMaterial = new THREE.MeshStandardMaterial({
    color: 0xa7efff,
    emissive: 0x57d8ff,
    emissiveIntensity: 0.9,
    roughness: 0.12,
    metalness: 0.08,
  });
  gemMaterial.userData.nightEmissiveIntensity = 0.9;
  nightGlowMaterials.push(gemMaterial);

  const pillarGoldMaterial = new THREE.MeshStandardMaterial({
    color: 0xedc978,
    emissive: 0x5b3a16,
    roughness: 0.1,
    metalness: 0.88,
  });

  const plinthMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c1c1b,
    roughness: 0.74,
    metalness: 0.08,
  });

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(3.9, 4.35, 0.6, 32),
    plinthMaterial
  );
  base.position.set(0, 0.3, -8.05);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  const baseTrim = new THREE.Mesh(
    new THREE.TorusGeometry(3.42, 0.11, 14, 48),
    accentMaterial
  );
  baseTrim.position.set(0, 0.6, -8.05);
  baseTrim.rotation.x = Math.PI / 2;
  baseTrim.castShadow = true;
  scene.add(baseTrim);

  const baseTrimOuter = new THREE.Mesh(
    new THREE.TorusGeometry(3.82, 0.07, 12, 48),
    frameMaterial
  );
  baseTrimOuter.position.set(0, 0.37, -8.05);
  baseTrimOuter.rotation.x = Math.PI / 2;
  baseTrimOuter.castShadow = true;
  scene.add(baseTrimOuter);

  const stepFront = new THREE.Mesh(
    new THREE.CylinderGeometry(2.95, 3.15, 0.18, 32),
    new THREE.MeshStandardMaterial({
      color: 0xc9c2a8,
      roughness: 0.86,
      metalness: 0.02,
    })
  );
  stepFront.position.set(0, 0.14, -8.05);
  stepFront.castShadow = true;
  stepFront.receiveShadow = true;
  scene.add(stepFront);

  const stepInset = new THREE.Mesh(
    new THREE.TorusGeometry(2.34, 0.06, 10, 40),
    accentMaterial
  );
  stepInset.position.set(0, 0.24, -8.05);
  stepInset.rotation.x = Math.PI / 2;
  scene.add(stepInset);

  const archPoints = [];
  const archRadius = 2.22;
  for (let i = 0; i <= 18; i += 1) {
    const t = (i / 18) * Math.PI;
    archPoints.push(new THREE.Vector2(Math.cos(t) * archRadius, Math.sin(t) * archRadius));
  }

  const archCurve = new THREE.CatmullRomCurve3(
    archPoints.map((point) => new THREE.Vector3(point.x, point.y, 0))
  );

  const topArch = new THREE.Mesh(
    new THREE.TubeGeometry(archCurve, 56, 0.3, 22, false),
    frameMaterial
  );
  topArch.position.set(0, 4.05, -8.08);
  topArch.castShadow = true;
  scene.add(topArch);

  const innerArch = new THREE.Mesh(
    new THREE.TubeGeometry(archCurve, 56, 0.14, 16, false),
    accentMaterial
  );
  innerArch.position.set(0, 4.05, -8.01);
  innerArch.scale.set(0.9, 0.88, 1);
  innerArch.castShadow = true;
  scene.add(innerArch);

  const glowArch = new THREE.Mesh(
    new THREE.TubeGeometry(archCurve, 56, 0.05, 12, false),
    new THREE.MeshStandardMaterial({
      color: 0xbde8ff,
      emissive: 0x7ad8ff,
      emissiveIntensity: 1.2,
      roughness: 0.12,
      metalness: 0.08,
    })
  );
  glowArch.position.set(0, 4.03, -7.88);
  glowArch.scale.set(0.82, 0.8, 1);
  scene.add(glowArch);

  for (const side of [-1, 1]) {
    const outerPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.38, 6.18, 8),
      frameMaterial
    );
    outerPillar.position.set(side * 2.2, 3.1, -8.08);
    outerPillar.castShadow = true;
    scene.add(outerPillar);

    const baseCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.56, 0.28, 8),
      accentMaterial
    );
    baseCap.position.set(side * 2.2, 0.55, -8.04);
    baseCap.castShadow = true;
    scene.add(baseCap);

    const topCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.48, 0.28, 8),
      accentMaterial
    );
    topCap.position.set(side * 2.2, 5.66, -8.04);
    topCap.castShadow = true;
    scene.add(topCap);

    for (const y of [1.55, 2.7, 3.85, 5.0]) {
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.14, 0),
        gemMaterial
      );
      gem.position.set(side * 2.03, y, -7.78);
      gem.rotation.z = side * 0.18;
      gem.castShadow = true;
      scene.add(gem);
    }
  }

  const bottomBar = new THREE.Mesh(
    new THREE.TorusGeometry(1.88, 0.18, 18, 56, Math.PI),
    frameMaterial
  );
  bottomBar.position.set(0, 0.85, -8.08);
  bottomBar.rotation.z = Math.PI;
  bottomBar.castShadow = true;
  scene.add(bottomBar);


  const crestOuter = new THREE.Mesh(
    new THREE.TorusGeometry(0.76, 0.16, 14, 42),
    frameMaterial
  );
  crestOuter.position.set(0, 6.3, -8.04);
  crestOuter.scale.y = 1.3;
  crestOuter.castShadow = true;
  scene.add(crestOuter);

  const crestDiamond = new THREE.Mesh(
    makeHeartGeometry(0.2),
    gemMaterial
  );
  crestDiamond.position.set(0, 7.28, -7.82);
  crestDiamond.rotation.x = 0;
  crestDiamond.scale.set(0.6, 0.6, 0.22);
  crestDiamond.castShadow = true;
  scene.add(crestDiamond);

  const crestCoreGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.13, 0),
    gemMaterial
  );
  crestCoreGem.position.set(0, 6.34, -7.72);
  crestCoreGem.scale.set(1, 1.28, 0.75);
  crestCoreGem.castShadow = true;
  scene.add(crestCoreGem);

  const crestInner = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.06, 12, 24),
    accentMaterial
  );
  crestInner.position.set(0, 6.3, -7.98);
  crestInner.castShadow = true;
  scene.add(crestInner);

  const crestLeaf = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.72, 5),
    accentMaterial
  );
  crestLeaf.position.set(0, 7.12, -8.0);
  crestLeaf.castShadow = true;
  scene.add(crestLeaf);

  const crownSpire = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.92, 5),
    accentMaterial
  );
  crownSpire.position.set(0, 7.72, -8.0);
  crownSpire.castShadow = true;
  scene.add(crownSpire);

  for (const side of [-1, 1]) {
    const topCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 1.08, 5),
      accentMaterial
    );
    topCone.position.set(side * 2.22, 6.58, -8.0);
    topCone.castShadow = true;
    scene.add(topCone);

    const coneHeart = new THREE.Mesh(
      makeHeartGeometry(0.12),
      gemMaterial
    );
    coneHeart.position.set(side * 2.22, 7.22, -7.88);
    coneHeart.rotation.x = 0;
    coneHeart.scale.set(0.5, 0.5, 0.5);
    coneHeart.castShadow = true;
    scene.add(coneHeart);

    const ribbon = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.08, 10, 28, Math.PI * 1.1),
      frameMaterial
    );
    ribbon.position.set(side * 1.02, 6.18, -8.02);
    ribbon.rotation.z = side * 0.34;
    ribbon.rotation.y = side * 0.12;
    ribbon.castShadow = true;
    scene.add(ribbon);

    const topGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      gemMaterial
    );
    topGem.position.set(side * 1.72, 6.3, -7.86);
    topGem.castShadow = true;
    scene.add(topGem);
  }

  portalMirror = new Reflector(new THREE.PlaneGeometry(3.5, 5.9), {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0x96a8bf,
  });
  portalMirror.position.set(0, 3.45, -7.95);
  portalMirror.rotation.y = Math.PI;
  portalMirror.castShadow = false;
  scene.add(portalMirror);

  const glowRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.65, 0.05, 16, 80, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0xa8d8ff, transparent: true, opacity: 0.5 })
  );
  glowRing.position.set(0, 4.02, -7.82);
  scene.add(glowRing);

  const portalLight = new THREE.PointLight(0x84d6ff, 14, 18, 2);
  portalLight.position.set(0, 3.6, -6.3);
  scene.add(portalLight);
}

function makeCardMaterial(texture) {
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    roughness: 0.72,
    side: THREE.DoubleSide,
  });
}

function nextCardTexture() {
  const texture = cardTextures[cardTextureCursor % cardTextures.length];
  cardTextureCursor += 1;
  return texture;
}

function createCard(width, height, texture) {
  const card = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    makeCardMaterial(texture)
  );
  card.castShadow = true;
  card.receiveShadow = true;
  return card;
}

function makeCardArch() {
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 4; i += 1) {
      const card = createCard(1.65, 2.6, nextCardTexture());
      card.position.set(side * (1.65 + i * 0.62), 1.3 + i * 0.62, -11.2 + i * 0.08);
      card.rotation.z = side * (-0.18 - i * 0.05);
      card.rotation.y = 0.2 * side;
      scene.add(card);
    }
  }

  for (let i = 0; i < 5; i += 1) {
    const floatingCard = createCard(0.95, 1.45, nextCardTexture());
    floatingCard.position.set(-2.4 + i * 1.15, 4.6 + seededRandom(i) * 1.2, -10.2 + seededRandom(i + 4) * 1.1);
    floatingCard.rotation.set(0.2 * i, 0.8 + i * 0.26, 0.16 * i);
    scene.add(floatingCard);
    animatedCards.push({
      mesh: floatingCard,
      baseY: floatingCard.position.y,
      offset: i,
    });
  }

  const sideCards = [
    [-8.6, 1.5, -1.8, 0.18, 0.42, 4],
    [-9.2, 1.65, -5.2, -0.12, 0.36, 5],
    [-8.4, 1.5, -9.6, 0.15, 0.44, 6],
    [8.5, 1.45, -0.4, -0.15, -0.34, 0],
    [9.1, 1.6, -4.6, 0.11, -0.4, 1],
    [8.7, 1.5, -8.8, -0.18, -0.32, 7],
  ];

  for (const [x, y, z, rotZ, rotY] of sideCards) {
    const card = createCard(1.35, 2.1, nextCardTexture());
    card.position.set(x, y, z);
    card.rotation.z = rotZ;
    card.rotation.y = rotY;
    scene.add(card);
  }

  const scatteredFloaters = [
    [-6.2, 4.6, -2.8, 1],
    [6.4, 4.9, -2.2, 3],
    [-4.6, 5.2, -7.2, 6],
    [4.9, 5.05, -6.8, 7],
  ];

  for (const [x, y, z, textureIndex] of scatteredFloaters) {
    const card = createCard(0.82, 1.25, nextCardTexture());
    card.position.set(x, y, z);
    card.rotation.set(0.2, 0.7 + textureIndex * 0.18, -0.12);
    scene.add(card);
    animatedCards.push({
      mesh: card,
      baseY: y,
      offset: textureIndex + x * 0.1,
    });
  }
}

function makeRabbitTrailBackdrop() {
  const backdropCenter = new THREE.Vector3(0, 0, 27.5);
  const signWoodMaterial = new THREE.MeshStandardMaterial({
    color: 0x7c5a45,
    roughness: 0.88,
    metalness: 0.04,
  });
  const signFaceMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4e7c7,
    roughness: 0.8,
    metalness: 0.02,
  });
  const hedgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x4c7a46,
    roughness: 0.94,
  });

  const pathEnd = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.7, 0.12, 28),
    new THREE.MeshStandardMaterial({
      color: 0xe2d6c1,
      roughness: 0.9,
    })
  );
  pathEnd.position.set(backdropCenter.x, 0.08, backdropCenter.z);
  pathEnd.receiveShadow = true;
  scene.add(pathEnd);

  const pathEndRing = new THREE.Mesh(
    new THREE.TorusGeometry(3.55, 0.09, 10, 40),
    new THREE.MeshStandardMaterial({
      color: 0x8c624c,
      roughness: 0.84,
    })
  );
  pathEndRing.position.set(backdropCenter.x, 0.14, backdropCenter.z);
  pathEndRing.rotation.x = Math.PI / 2;
  scene.add(pathEndRing);

  const signPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 3.9, 10),
    signWoodMaterial
  );
  signPost.position.set(backdropCenter.x, 1.95, backdropCenter.z + 0.6);
  signPost.castShadow = true;
  signPost.receiveShadow = true;
  scene.add(signPost);

  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(2.9, 1.05, 0.18),
    signFaceMaterial
  );
  signBoard.position.set(backdropCenter.x, 3.08, backdropCenter.z + 0.38);
  signBoard.rotation.z = -0.06;
  signBoard.castShadow = true;
  signBoard.receiveShadow = true;
  scene.add(signBoard);

  const signCap = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.8, 6),
    signWoodMaterial
  );
  signCap.position.set(backdropCenter.x, 4.34, backdropCenter.z + 0.6);
  signCap.castShadow = true;
  scene.add(signCap);

  for (const [x, y, z, scale, color] of [
    [-1.05, 3.05, backdropCenter.z + 0.5, 0.18, 0xc53a56],
    [1.05, 3.05, backdropCenter.z + 0.5, 0.18, 0xc53a56],
  ]) {
    const heart = new THREE.Mesh(
      makeHeartGeometry(scale),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.56,
        metalness: 0.12,
      })
    );
    heart.position.set(x, y, z);
    heart.rotation.x = 0;
    heart.scale.set(0.45, 0.45, 0.2);
    heart.castShadow = true;
    scene.add(heart);
  }

  for (const side of [-1, 1]) {
    const hedge = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 14),
      hedgeMaterial
    );
    hedge.position.set(side * 3.45, 1.05, backdropCenter.z + 0.8);
    hedge.scale.set(1.25, 1.08, 0.95);
    hedge.castShadow = true;
    hedge.receiveShadow = true;
    scene.add(hedge);
  }

  for (const [x, z, scale, color] of [
    [-4.8, 25.2, 1.15, 0xff7d9a],
    [-3.9, 29.6, 0.92, 0x8de7ff],
    [4.6, 25.6, 1.05, 0xf6a85d],
    [3.6, 30.0, 0.86, 0xc894ff],
    [-1.8, 31.1, 0.8, 0xf7eb78],
    [1.9, 31.0, 0.78, 0x8effb7],
  ]) {
    makeMushroom(x, z, scale, new THREE.Color(color));
  }

  for (const [x, z, rot] of [
    [-6.3, 27.9, 0.18],
    [6.2, 28.1, -0.16],
    [-2.8, 32.3, -0.12],
    [2.8, 32.4, 0.14],
  ]) {
    const card = createCard(1.5, 2.25, nextCardTexture());
    card.position.set(x, 1.42, z);
    card.rotation.y = sideFromX(x) * 0.2;
    card.rotation.z = rot;
    scene.add(card);
  }

  function sideFromX(x) {
    return x < 0 ? 1 : -1;
  }

  for (const [x, z, scale] of [
    [-10, 30.5, 1.08],
    [-6.8, 34.5, 1.22],
    [-1.8, 35.8, 1.15],
    [3.2, 35.2, 1.18],
    [8.5, 33.8, 1.12],
    [12.5, 29.8, 1.06],
  ]) {
    makeFernCluster(x, z, scale);
  }

  addCollider(backdropCenter.x, backdropCenter.z + 0.6, 1.7);
}

function makeTeaParty() {
  const teaCenter = new THREE.Vector3(13.5, 0, 9.5);
  const clothMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0e4df,
    roughness: 0.92,
  });
  const laceMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8f3ea,
    roughness: 0.88,
  });
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xd7b46c,
    roughness: 0.35,
    metalness: 0.58,
  });
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x735442,
    roughness: 0.9,
    metalness: 0.04,
  });
  const chinaMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xf7f2ea, roughness: 0.38 }),
    new THREE.MeshStandardMaterial({ color: 0xf3d7df, roughness: 0.36 }),
    new THREE.MeshStandardMaterial({ color: 0xdbe8f2, roughness: 0.36 }),
    new THREE.MeshStandardMaterial({ color: 0xe9efd6, roughness: 0.36 }),
  ];

  const rug = new THREE.Mesh(
    new THREE.CylinderGeometry(4.9, 5.3, 0.08, 30),
    new THREE.MeshStandardMaterial({
      color: 0x5f2e37,
      roughness: 0.95,
      emissive: 0x1a0a0d,
    })
  );
  rug.position.set(teaCenter.x, 0.05, teaCenter.z);
  rug.receiveShadow = true;
  scene.add(rug);

  const runner = new THREE.Mesh(
    new THREE.CylinderGeometry(3.4, 3.7, 0.04, 26),
    new THREE.MeshStandardMaterial({
      color: 0xcda468,
      roughness: 0.88,
    })
  );
  runner.position.set(teaCenter.x, 0.09, teaCenter.z);
  runner.receiveShadow = true;
  scene.add(runner);

  const petals = [
    [teaCenter.x - 1.4, 0.12, teaCenter.z + 2.2, 0xffc0d0],
    [teaCenter.x + 1.1, 0.12, teaCenter.z - 2.1, 0xffe18a],
    [teaCenter.x + 2.4, 0.12, teaCenter.z + 1.8, 0xf8b7d7],
    [teaCenter.x - 2.2, 0.12, teaCenter.z - 1.7, 0xffd5ef],
  ];
  for (const [x, y, z, color] of petals) {
    const petal = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 10),
      new THREE.MeshStandardMaterial({ color, roughness: 0.72 })
    );
    petal.position.set(x, y, z);
    petal.scale.set(1.5, 0.25, 0.9);
    petal.rotation.y = x * 0.2;
    petal.receiveShadow = true;
    scene.add(petal);
  }

  function addChair(x, z, color, yawAngle) {
    const chair = new THREE.Group();
    const chairMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.72 });

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.18, 1.05), chairMaterial);
    seat.position.y = 0.82;
    seat.castShadow = true;
    chair.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.9, 0.18), chairMaterial);
    back.position.set(0, 1.72, -0.42);
    back.castShadow = true;
    chair.add(back);

    for (const legPos of [
      [-0.42, 0.37], [0.42, 0.37], [-0.42, -0.37], [0.42, -0.37],
    ]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.86, 10), woodMaterial);
      leg.position.set(legPos[0], 0.39, legPos[1]);
      leg.castShadow = true;
      chair.add(leg);
    }

    chair.position.set(x, 0, z);
    chair.rotation.y = yawAngle;
    scene.add(chair);
  }

  function addTeaTable(x, z, radius, clothColor) {
    const tableGroup = new THREE.Group();

    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.08, 0.15, 28),
      woodMaterial
    );
    top.position.y = 1.04;
    top.castShadow = true;
    top.receiveShadow = true;
    tableGroup.add(top);

    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.18, 1.0, 12),
      woodMaterial
    );
    leg.position.y = 0.52;
    leg.castShadow = true;
    tableGroup.add(leg);

    const cloth = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.02, radius * 1.16, 0.52, 28, 1, true),
      new THREE.MeshStandardMaterial({
        color: clothColor,
        roughness: 0.95,
        side: THREE.DoubleSide,
      })
    );
    cloth.position.y = 0.87;
    tableGroup.add(cloth);

    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.98, 0.03, 10, 30),
      laceMaterial
    );
    trim.position.y = 0.61;
    trim.rotation.x = Math.PI / 2;
    tableGroup.add(trim);

    for (let i = 0; i < 3; i += 1) {
      const angle = (i / 3) * Math.PI * 2 + 0.25;
      const chinaMaterial = chinaMaterials[i % chinaMaterials.length];

      const saucer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.35, 0.04, 18),
        chinaMaterial
      );
      saucer.position.set(Math.cos(angle) * radius * 0.54, 1.14, Math.sin(angle) * radius * 0.48);
      saucer.castShadow = true;
      tableGroup.add(saucer);

      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19, 0.15, 0.26, 18, 1, true),
        chinaMaterial
      );
      cup.position.set(saucer.position.x, 1.28, saucer.position.z);
      cup.castShadow = true;
      tableGroup.add(cup);
    }

    const teapot = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 14),
      chinaMaterials[3]
    );
    teapot.position.set(0.08, 1.31, -0.05);
    teapot.scale.set(1.12, 0.76, 0.9);
    teapot.castShadow = true;
    tableGroup.add(teapot);

    const teapotHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.02, 10, 24, Math.PI * 1.1),
      goldMaterial
    );
    teapotHandle.position.set(-0.22, 1.31, 0.02);
    teapotHandle.rotation.z = Math.PI / 2;
    teapotHandle.rotation.y = 0.02;
    teapotHandle.scale.set(1, 1, 0.55);
    teapotHandle.castShadow = true;
    tableGroup.add(teapotHandle);

    const spout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.055, 0.36, 10),
      goldMaterial
    );
    spout.position.set(0.26, 1.31, 0.03);
    spout.rotation.z = -1.08;
    spout.rotation.y = -0.12;
    spout.castShadow = true;
    tableGroup.add(spout);

    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 14, 12),
      goldMaterial
    );
    lid.position.set(0.03, 1.465, -0.02);
    lid.scale.set(0.85, 0.34, 0.85);
    lid.castShadow = true;
    tableGroup.add(lid);

    const lidKnob = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 10, 10),
      goldMaterial
    );
    lidKnob.position.set(0.03, 1.535, -0.02);
    lidKnob.scale.y = 1.2;
    lidKnob.castShadow = true;
    tableGroup.add(lidKnob);

    for (let i = 0; i < 4; i += 1) {
      const angle = (i / 4) * Math.PI * 2 + 0.55;
      const macaron = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.09, 14),
        new THREE.MeshStandardMaterial({
          color: [0xf0c0cf, 0xc9e7f5, 0xf7e4a0, 0xd6e8c0][i],
          roughness: 0.82,
        })
      );
      macaron.position.set(Math.cos(angle) * radius * 0.74, 1.12, Math.sin(angle) * radius * 0.66);
      macaron.castShadow = true;
      tableGroup.add(macaron);
    }

    const spoon = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.02, 0.05),
      goldMaterial
    );
    spoon.position.set(radius * 0.28, 1.16, radius * 0.08);
    spoon.rotation.y = 0.4;
    tableGroup.add(spoon);

    tableGroup.position.set(x, 0, z);
    scene.add(tableGroup);
  }

  addTeaTable(teaCenter.x, teaCenter.z, 1.35, 0xf0e0cf);
  addTeaTable(teaCenter.x - 2.55, teaCenter.z + 1.2, 1.08, 0xf1d7dc);
  addTeaTable(teaCenter.x + 2.55, teaCenter.z + 1.05, 1.08, 0xd9e7ef);

  addChair(teaCenter.x - 0.05, teaCenter.z + 3.1, 0x4b7b4a, Math.PI);
  addChair(teaCenter.x - 3.65, teaCenter.z + 1.35, 0xb78b79, Math.PI / 2);
  addChair(teaCenter.x + 3.7, teaCenter.z + 1.2, 0x8e8f7f, -Math.PI / 2);
  addChair(teaCenter.x + 2.8, teaCenter.z - 2.5, 0x7f6b4b, -0.2);

  const cakeStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 0.55, 12),
    laceMaterial
  );
  cakeStand.position.set(teaCenter.x - 0.55, 1.34, teaCenter.z + 0.15);
  cakeStand.castShadow = true;
  scene.add(cakeStand);

  const cakePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.62, 0.06, 20),
    chinaMaterials[0]
  );
  cakePlate.position.set(teaCenter.x - 0.55, 1.63, teaCenter.z + 0.15);
  cakePlate.castShadow = true;
  scene.add(cakePlate);

  const cake = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.38, 0.22, 18),
    new THREE.MeshStandardMaterial({ color: 0xf4d0cf, roughness: 0.88 })
  );
  cake.position.set(teaCenter.x - 0.55, 1.78, teaCenter.z + 0.15);
  cake.castShadow = true;
  scene.add(cake);

  const frosting = new THREE.Mesh(
    new THREE.CylinderGeometry(0.37, 0.39, 0.08, 18),
    new THREE.MeshStandardMaterial({ color: 0xf8f0f3, roughness: 0.78 })
  );
  frosting.position.set(teaCenter.x - 0.55, 1.93, teaCenter.z + 0.15);
  frosting.castShadow = true;
  scene.add(frosting);

  for (const cherryPos of [
    [teaCenter.x - 0.67, 2.0, teaCenter.z + 0.11],
    [teaCenter.x - 0.48, 2.02, teaCenter.z + 0.25],
    [teaCenter.x - 0.42, 2.0, teaCenter.z + 0.05],
  ]) {
    const cherry = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xbe2041, roughness: 0.4 })
    );
    cherry.position.set(cherryPos[0], cherryPos[1], cherryPos[2]);
    cherry.castShadow = true;
    scene.add(cherry);
  }

  const flowers = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 1.25, 10),
    new THREE.MeshStandardMaterial({ color: 0x597a4d, roughness: 0.9 })
  );
  flowers.position.set(teaCenter.x + 3.6, 0.65, teaCenter.z - 1.3);
  flowers.rotation.z = 0.1;
  flowers.castShadow = true;
  scene.add(flowers);

  for (const blossom of [
    [teaCenter.x + 3.45, 1.55, teaCenter.z - 1.28, 0xffc0d1],
    [teaCenter.x + 3.72, 1.68, teaCenter.z - 1.0, 0xffeb9e],
    [teaCenter.x + 3.95, 1.52, teaCenter.z - 1.48, 0xf7a2b5],
  ]) {
    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 12),
      new THREE.MeshStandardMaterial({ color: blossom[3], roughness: 0.8 })
    );
    bloom.position.set(blossom[0], blossom[1], blossom[2]);
    bloom.castShadow = true;
    scene.add(bloom);
  }

  makeLantern(teaCenter.x - 4.8, teaCenter.z - 3.2, new THREE.Color(0xffd7ea));
  makeLantern(teaCenter.x + 4.8, teaCenter.z - 2.8, new THREE.Color(0xcff6ff));
  addCollider(teaCenter.x, teaCenter.z, 3.8);
}

function makeFireflies() {
  const fireflyGeometry = new THREE.SphereGeometry(0.06, 10, 10);

  for (let i = 0; i < 24; i += 1) {
    const color = new THREE.Color().setHSL(0.42 + seededRandom(i) * 0.16, 0.9, 0.66);
    const material = new THREE.MeshBasicMaterial({ color });
    const firefly = new THREE.Mesh(fireflyGeometry, material);
    firefly.position.set(
      (seededRandom(i * 2) - 0.5) * 26,
      1.1 + seededRandom(i * 3) * 4,
      (seededRandom(i * 5) - 0.5) * 26
    );
    scene.add(firefly);
    fireflies.push({
      mesh: firefly,
      radius: 0.5 + seededRandom(i * 7),
      speed: 0.4 + seededRandom(i * 11) * 0.9,
      anchor: firefly.position.clone(),
      offset: i * 0.73,
    });
  }
}

function makeLights() {
  const ambient = new THREE.AmbientLight(0x8394a8, 0.52);
  scene.add(ambient);
  timeSensitiveLights.ambient = ambient;

  const hemi = new THREE.HemisphereLight(0xa3d8ff, 0x12210f, 0.9);
  hemi.position.set(0, 30, 0);
  scene.add(hemi);
  timeSensitiveLights.hemi = hemi;

  const moon = new THREE.DirectionalLight(0xcfe4ff, 1.65);
  moon.position.set(12, 22, 8);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -35;
  moon.shadow.camera.right = 35;
  moon.shadow.camera.top = 35;
  moon.shadow.camera.bottom = -35;
  scene.add(moon);
  timeSensitiveLights.mainDirectional = moon;

  const dreamSpot = new THREE.SpotLight(0x6ce0ff, 14, 26, Math.PI / 8, 0.4, 1);
  dreamSpot.position.set(-7, 8, -8);
  dreamSpot.target.position.set(-2, 0, -6);
  dreamSpot.castShadow = true;
  scene.add(dreamSpot);
  scene.add(dreamSpot.target);
  timeSensitiveLights.portalSpot = dreamSpot;

  makePathLanterns();
}

function makeDaySkyDecor() {
  const decor = new THREE.Group();

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(2.3, 28, 24),
    new THREE.MeshBasicMaterial({
      color: 0xffe28a,
    })
  );
  sun.position.set(-24, 18, -42);
  decor.add(sun);

  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 24, 20),
    new THREE.MeshBasicMaterial({
      color: 0xfff1bb,
      transparent: true,
      opacity: 0.32,
    })
  );
  sunGlow.position.copy(sun.position);
  decor.add(sunGlow);

  function addCloud(x, y, z, scale) {
    const cloud = new THREE.Group();
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: 0xfafcff,
      transparent: true,
      opacity: 0.92,
    });

    const puffs = [
      [-1.3, 0.0, 0, 1.0],
      [-0.3, 0.35, 0.1, 1.15],
      [0.8, 0.2, -0.1, 1.05],
      [1.7, -0.05, 0, 0.9],
    ];

    for (const [px, py, pz, puffScale] of puffs) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(1, 20, 18),
        cloudMaterial
      );
      puff.position.set(px * scale, py * scale, pz * scale);
      puff.scale.set(1.25 * puffScale * scale, 0.82 * puffScale * scale, 0.95 * puffScale * scale);
      cloud.add(puff);
    }

    cloud.position.set(x, y, z);
    decor.add(cloud);
  }

  addCloud(-10, 16.8, -35, 1.2);
  addCloud(9, 15.2, -37, 1.45);
  addCloud(24, 17.4, -32, 1.05);
  addCloud(-27, 14.9, -30, 0.95);

  decor.visible = false;
  scene.add(decor);
  daySkyDecor = decor;
}

function makeStarGeometry(outerRadius = 1, innerRadius = 0.48) {
  const starShape = new THREE.Shape();
  const points = 5;

  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) {
      starShape.moveTo(x, y);
    } else {
      starShape.lineTo(x, y);
    }
  }

  starShape.closePath();
  return new THREE.ExtrudeGeometry(starShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.04,
    bevelThickness: 0.03,
    curveSegments: 10,
  });
}

function makeNightSkyDecor() {
  const decor = new THREE.Group();

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.78, 24, 20),
    new THREE.MeshBasicMaterial({ color: 0xf4f8ff })
  );
  moon.position.set(29, 20.5, -32);
  decor.add(moon);

  const moonGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.3, 22, 18),
    new THREE.MeshBasicMaterial({
      color: 0xcfe7ff,
      transparent: true,
      opacity: 0.18,
    })
  );
  moonGlow.position.copy(moon.position);
  decor.add(moonGlow);

  const starGeometry = makeStarGeometry(0.42, 0.2);
  for (let i = 0; i < 52; i += 1) {
    const star = new THREE.Mesh(
      starGeometry,
      new THREE.MeshBasicMaterial({
        color: i % 4 === 0 ? 0xd9f4ff : 0xfffbe6,
      })
    );
    star.position.set(
      -40 + seededRandom(500 + i * 7) * 80,
      7 + seededRandom(600 + i * 11) * 21,
      -48 + seededRandom(700 + i * 13) * 76
    );
    const scale = 0.22 + seededRandom(800 + i * 17) * 0.34;
    star.scale.set(scale, scale, scale * 0.5);
    star.rotation.z = seededRandom(900 + i * 19) * Math.PI;
    decor.add(star);
  }

  decor.visible = true;
  scene.add(decor);
  nightSkyDecor = decor;
}

function makeHeartGeometry(scale = 1) {
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, 0.7 * scale);
  heartShape.bezierCurveTo(-1.2 * scale, 1.55 * scale, -2.1 * scale, 0.35 * scale, 0, -1.7 * scale);
  heartShape.bezierCurveTo(2.1 * scale, 0.35 * scale, 1.2 * scale, 1.55 * scale, 0, 0.7 * scale);

  return new THREE.ExtrudeGeometry(heartShape, {
    depth: 0.65 * scale,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.16 * scale,
    bevelThickness: 0.12 * scale,
    curveSegments: 20,
  });
}

function makeShapeGarden() {
  const gardenCenter = new THREE.Vector3(-18, 0, -18);
  const padMaterial = new THREE.MeshStandardMaterial({
    color: 0x6a3d52,
    roughness: 0.9,
    emissive: 0x12080d,
  });

  const gardenPad = new THREE.Mesh(
    new THREE.CylinderGeometry(8.6, 9.1, 0.08, 32),
    padMaterial
  );
  gardenPad.position.set(gardenCenter.x, 0.04, gardenCenter.z);
  gardenPad.receiveShadow = true;
  scene.add(gardenPad);

  const shapeEntries = [
    { geometry: new THREE.BoxGeometry(1.1, 1.1, 1.1), color: 0xf4a9b8 },
    { geometry: new THREE.SphereGeometry(0.68, 22, 20), color: 0x99d8ff },
    { geometry: new THREE.CylinderGeometry(0.5, 0.5, 1.35, 20), color: 0xffd78f },
    { geometry: new THREE.ConeGeometry(0.62, 1.45, 18), color: 0xb8f0a0 },
    { geometry: new THREE.TorusGeometry(0.58, 0.18, 16, 30), color: 0xd7b2ff },
    { geometry: new THREE.DodecahedronGeometry(0.72, 0), color: 0x9cd1c2 },
    { geometry: new THREE.OctahedronGeometry(0.72, 0), color: 0xffb38c },
    { geometry: new THREE.IcosahedronGeometry(0.72, 0), color: 0xe1f29b },
    { geometry: new THREE.TetrahedronGeometry(0.8, 0), color: 0x9bb2ff },
    { geometry: new THREE.CapsuleGeometry(0.38, 0.82, 6, 12), color: 0xf2bddf },
    { geometry: new THREE.TorusKnotGeometry(0.38, 0.14, 72, 10), color: 0x8ce2ea },
    { geometry: new THREE.RingGeometry(0.34, 0.7, 24), color: 0xf7ebad },
    { geometry: new THREE.ExtrudeGeometry(new THREE.Shape([
      new THREE.Vector2(0, 1.0),
      new THREE.Vector2(0.25, 0.3),
      new THREE.Vector2(0.95, 0.3),
      new THREE.Vector2(0.4, -0.1),
      new THREE.Vector2(0.62, -0.85),
      new THREE.Vector2(0, -0.35),
      new THREE.Vector2(-0.62, -0.85),
      new THREE.Vector2(-0.4, -0.1),
      new THREE.Vector2(-0.95, 0.3),
      new THREE.Vector2(-0.25, 0.3),
    ]), {
      depth: 0.32,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    }), color: 0xffc76e, rotateX: Math.PI / 2 },
    { geometry: makeHeartGeometry(0.45), color: 0xf05b7f, rotateX: Math.PI, scale: [0.72, 0.72, 0.72] },
    { geometry: new THREE.CylinderGeometry(0, 0.72, 1.25, 5), color: 0x94f0de },
    { geometry: new THREE.BoxGeometry(1.3, 0.5, 0.8), color: 0xd1a2ff },
    { geometry: new THREE.CylinderGeometry(0.26, 0.8, 1.2, 6), color: 0xf7b4a5 },
    { geometry: new THREE.SphereGeometry(0.66, 20, 10), color: 0xa3e0ff, scale: [1.1, 0.72, 1.1] },
    { geometry: new THREE.CylinderGeometry(0.12, 0.6, 1.55, 8), color: 0xf6efab },
    { geometry: new THREE.ConeGeometry(0.56, 1.18, 3), color: 0xb1f2b0 },
  ];

  const radius = 5.7;
  shapeEntries.forEach((entry, index) => {
    const material = new THREE.MeshStandardMaterial({
      color: entry.color,
      roughness: 0.58,
      metalness: 0.16,
      emissive: new THREE.Color(entry.color).multiplyScalar(0.06),
    });

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.74, 0.42, 18),
      new THREE.MeshStandardMaterial({
        color: 0xe8dfd4,
        roughness: 0.92,
      })
    );

    const angle = (index / shapeEntries.length) * Math.PI * 2;
    const x = gardenCenter.x + Math.cos(angle) * radius;
    const z = gardenCenter.z + Math.sin(angle) * radius;
    pedestal.position.set(x, 0.21, z);
    pedestal.receiveShadow = true;
    pedestal.castShadow = true;
    scene.add(pedestal);

    const sculpture = new THREE.Mesh(entry.geometry, material);
    sculpture.position.set(x, 1.2, z);
    sculpture.rotation.y = angle + Math.PI * 0.4;
    if (entry.rotateX) {
      sculpture.rotation.x = entry.rotateX;
    }
    if (entry.scale) {
      sculpture.scale.set(entry.scale[0], entry.scale[1], entry.scale[2]);
    }
    sculpture.castShadow = true;
    sculpture.receiveShadow = true;
    scene.add(sculpture);
    animatedCards.push({
      mesh: sculpture,
      baseY: sculpture.position.y,
      offset: 20 + index * 0.45,
    });
  });

  addCollider(gardenCenter.x, gardenCenter.z, 3.6);
}

function makeQueensCastleRealm() {
  const realmCenterZ = -27;
  const hedgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x315a2d,
    roughness: 0.96,
  });
  const roseMaterial = new THREE.MeshStandardMaterial({
    color: 0xbf2348,
    roughness: 0.74,
    emissive: 0x2f0812,
  });
  const castleStoneMaterial = new THREE.MeshStandardMaterial({
    color: 0xe4d8d2,
    roughness: 0.86,
  });
  const castleAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0xaf2948,
    roughness: 0.64,
    metalness: 0.08,
  });
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xe0c369,
    roughness: 0.34,
    metalness: 0.52,
  });

  function addRoseCluster(x, z, scale = 1) {
    for (const [dx, dz, height, rot] of [
      [0.0, 0.0, 0.9 * scale, 0],
      [0.17 * scale, -0.08 * scale, 0.72 * scale, 0.9],
      [-0.14 * scale, 0.1 * scale, 0.68 * scale, -0.7],
    ]) {
      placeRoseInstance(x + dx, 0, z + dz, height, rot);
    }
  }

  function addBench(x, z, rotationY) {
    const wood = new THREE.MeshStandardMaterial({ color: 0x7a5446, roughness: 0.86 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x4d3b38, roughness: 0.74, metalness: 0.14 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.45), wood);
    seat.position.set(x, 0.72, z);
    seat.rotation.y = rotationY;
    seat.castShadow = true;
    scene.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.85, 0.12), wood);
    back.position.set(x, 1.12, z - Math.cos(rotationY) * 0.22);
    back.rotation.y = rotationY;
    back.castShadow = true;
    scene.add(back);

    for (const [lx, lz] of [
      [-0.72, -0.15], [0.72, -0.15], [-0.72, 0.15], [0.72, 0.15],
    ]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.72, 8), metal);
      leg.position.set(
        x + (lx * Math.cos(rotationY) - lz * Math.sin(rotationY)),
        0.36,
        z + (lx * Math.sin(rotationY) + lz * Math.cos(rotationY))
      );
      leg.castShadow = true;
      scene.add(leg);
    }
  }

  const approach = new THREE.Mesh(
    new THREE.PlaneGeometry(7.8, 23),
    new THREE.MeshStandardMaterial({
      map: tileTexture,
      color: 0xffd7e0,
      roughness: 0.78,
      metalness: 0.04,
    })
  );
  approach.rotation.x = -Math.PI / 2;
  approach.position.set(0, 0.055, -20.7);
  approach.receiveShadow = true;
  scene.add(approach);

  for (const side of [-1, 1]) {
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.12, 23.2),
      new THREE.MeshStandardMaterial({ color: 0x7a2d3f, roughness: 0.9 })
    );
    trim.position.set(side * 4.05, 0.08, -20.7);
    trim.castShadow = true;
    trim.receiveShadow = true;
    scene.add(trim);
  }

  function addHedgeRow(x, z, width, depth) {
    const hedge = new THREE.Mesh(
      new THREE.BoxGeometry(width, 1.5, depth),
      hedgeMaterial
    );
    hedge.position.set(x, 0.75, z);
    hedge.castShadow = true;
    hedge.receiveShadow = true;
    scene.add(hedge);
    addCollider(x, z, Math.max(width, depth) * 0.34);
  }

  addHedgeRow(-6.9, -21.5, 1.0, 12.6);
  addHedgeRow(6.9, -21.5, 1.0, 12.6);

  const rosePositions = [
    [-5.2, -16.6], [-5.8, -20.2], [-5.0, -24.0], [-5.7, -27.7],
    [5.2, -16.6], [5.8, -20.2], [5.0, -24.0], [5.7, -27.7],
    [-2.5, -30.7], [2.5, -30.7],
  ];
  for (const [x, z] of rosePositions) {
    addRoseCluster(x, z, 1);
  }

  const heartFountainBase = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.4, 0.5, 20),
    castleStoneMaterial
  );
  heartFountainBase.position.set(0, 0.28, -26.2);
  heartFountainBase.castShadow = true;
  heartFountainBase.receiveShadow = true;
  scene.add(heartFountainBase);

  const heartFountainBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 1.75, 0.18, 20),
    new THREE.MeshPhysicalMaterial({
      color: 0xaadff1,
      roughness: 0.08,
      transmission: 0.18,
      transparent: true,
      opacity: 0.86,
    })
  );
  heartFountainBowl.position.set(0, 0.56, -26.2);
  scene.add(heartFountainBowl);
  addCollider(0, -26.2, 2.15);

  const heartFountainColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.52, 1.85, 14),
    castleStoneMaterial
  );
  heartFountainColumn.position.set(0, 1.45, -26.2);
  heartFountainColumn.castShadow = true;
  heartFountainColumn.receiveShadow = true;
  scene.add(heartFountainColumn);

  const heartFountainTier = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.18, 0.18, 18),
    castleStoneMaterial
  );
  heartFountainTier.position.set(0, 2.42, -26.2);
  scene.add(heartFountainTier);

  const upperBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 0.96, 0.14, 18),
    new THREE.MeshPhysicalMaterial({
      color: 0xb8e7f8,
      roughness: 0.08,
      transparent: true,
      opacity: 0.84,
    })
  );
  upperBowl.position.set(0, 2.57, -26.2);
  scene.add(upperBowl);

  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const jet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.05, 1.05, 8),
      new THREE.MeshPhysicalMaterial({
        color: 0xdff7ff,
        roughness: 0.02,
        transparent: true,
        opacity: 0.75,
      })
    );
    jet.position.set(Math.cos(angle) * 0.45, 1.18, -26.2 + Math.sin(angle) * 0.45);
    jet.rotation.z = Math.cos(angle) * 0.22;
    jet.rotation.x = Math.sin(angle) * 0.22;
    scene.add(jet);
  }

  const heartStatue = new THREE.Mesh(
    makeHeartGeometry(0.74),
    new THREE.MeshStandardMaterial({
      color: 0xc42a4c,
      emissive: 0x7f122c,
      emissiveIntensity: 1.2,
      roughness: 0.42,
      metalness: 0.12,
    })
  );
  heartStatue.position.set(0, 4.65, -26.2);
  heartStatue.rotation.x = 0;
  heartStatue.castShadow = true;
  scene.add(heartStatue);
  heartStatue.material.userData.nightEmissiveIntensity = 1.2;
  nightGlowMaterials.push(heartStatue.material);
  animatedHearts.push({
    mesh: heartStatue,
    baseY: heartStatue.position.y,
    offset: 0.35,
  });

  const castleBase = new THREE.Mesh(
    new THREE.BoxGeometry(11.5, 6.2, 5.2),
    castleStoneMaterial
  );
  castleBase.position.set(0, 3.1, -37.4);
  castleBase.castShadow = true;
  castleBase.receiveShadow = true;
  scene.add(castleBase);
  addCollider(0, -37.4, 4.8);

  const gate = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 3.8, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x3f2321, roughness: 0.9 })
  );
  gate.position.set(0, 1.95, -34.7);
  gate.castShadow = true;
  scene.add(gate);

  const gateArch = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.16, 12, 28, Math.PI),
    castleAccentMaterial
  );
  gateArch.position.set(0, 3.82, -34.65);
  scene.add(gateArch);

  const gateHeart = new THREE.Mesh(
    makeHeartGeometry(0.42),
    goldMaterial
  );
  gateHeart.position.set(0, 5.1, -34.62);
  gateHeart.rotation.x = 0;
  gateHeart.scale.set(0.8, 0.8, 0.8);
  gateHeart.castShadow = true;
  scene.add(gateHeart);

  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 4.3, 3.8),
      castleStoneMaterial
    );
    wing.position.set(side * 7.0, 2.2, -37.8);
    wing.castShadow = true;
    wing.receiveShadow = true;
    scene.add(wing);
    addCollider(side * 7.0, -37.8, 2.1);
  }

  const towerPositions = [
    [-5.4, -35.2], [5.4, -35.2], [-10.1, -38.0], [10.1, -38.0],
  ];
  for (const [x, z] of towerPositions) {
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.7, 9.2, 18),
      castleStoneMaterial
    );
    tower.position.set(x, 4.6, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    addCollider(x, z, 1.5);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.75, 2.8, 18),
      castleAccentMaterial
    );
    roof.position.set(x, 10.1, z);
    roof.castShadow = true;
    scene.add(roof);

    const finial = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 10),
      goldMaterial
    );
    finial.position.set(x, 11.7, z);
    finial.castShadow = true;
    scene.add(finial);
  }

  for (let i = -4; i <= 4; i += 1) {
    const battlement = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.8, 0.8),
      castleStoneMaterial
    );
    battlement.position.set(i * 1.15, 6.95, -34.95);
    battlement.castShadow = true;
    scene.add(battlement);
  }

  const bannerOffsets = [-3.2, 3.2];
  for (const x of bannerOffsets) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2.7, 8),
      goldMaterial
    );
    pole.position.set(x, 7.9, -34.8);
    scene.add(pole);

    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.7),
      new THREE.MeshStandardMaterial({
        color: 0xca2e4e,
        side: THREE.DoubleSide,
        roughness: 0.7,
      })
    );
    banner.position.set(x + 0.62, 7.5, -34.55);
    scene.add(banner);

    const bannerHeart = new THREE.Mesh(
      makeHeartGeometry(0.16),
      goldMaterial
    );
    bannerHeart.position.set(x + 0.62, 7.45, -34.48);
    bannerHeart.rotation.x = 0;
    bannerHeart.scale.set(0.85, 0.85, 0.85);
    scene.add(bannerHeart);
  }

  for (const [x, z] of [
    [-8.5, -19.0], [8.5, -19.0], [-8.9, -28.6], [8.9, -28.6], [-6.8, -31.0], [6.8, -31.0],
  ]) {
    const topiary = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x46743d, roughness: 0.9 })
    );
    topiary.position.set(x, 1.02, z);
    topiary.scale.y = 1.15;
    topiary.castShadow = true;
    scene.add(topiary);

    for (const [dx, dy, dz, height, rot] of [
      [0.36, 0.26, 0.12, 0.42, 0.5],
      [-0.32, 0.18, -0.18, 0.38, -0.8],
      [0.05, 0.34, -0.31, 0.34, 1.3],
      [-0.08, 0.08, 0.33, 0.32, -1.1],
    ]) {
      placeRoseInstance(x + dx, 0.82 + dy, z + dz, height, rot);
    }
  }

  const cardGuards = [
    [-2.2, -31.6], [2.2, -31.6], [-4.8, -34.1], [4.8, -34.1],
  ];
  for (const [x, z] of cardGuards) {
    const guard = createCard(1.3, 2.15, nextCardTexture());
    guard.position.set(x, 1.15, z);
    guard.rotation.y = Math.PI;
    scene.add(guard);
  }

  const castleGlow = new THREE.PointLight(0xff7da4, 10, 22, 2);
  castleGlow.position.set(0, 7.4, -34.2);
  scene.add(castleGlow);

  const castleFireflyGeometry = new THREE.SphereGeometry(0.07, 10, 10);
  for (let i = 0; i < 14; i += 1) {
    const hue = 0.36 + seededRandom(180 + i) * 0.18;
    const castleFirefly = new THREE.Mesh(
      castleFireflyGeometry,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.9, 0.72),
      })
    );
    castleFirefly.position.set(
      (seededRandom(210 + i * 3) - 0.5) * 10,
      1.6 + seededRandom(260 + i * 5) * 3.1,
      -28 + (seededRandom(320 + i * 7) - 0.5) * 18
    );
    scene.add(castleFirefly);
    fireflies.push({
      mesh: castleFirefly,
      radius: 0.4 + seededRandom(390 + i) * 0.65,
      speed: 0.35 + seededRandom(450 + i) * 0.7,
      anchor: castleFirefly.position.clone(),
      offset: 30 + i * 0.81,
    });
  }
}

function setSceneTimeMode(dayMode) {
  isDayMode = dayMode;

  if (dayMode) {
    scene.background = new THREE.Color(0xc8e5fb);
    scene.fog.color.set(0xcfe6f5);
    scene.fog.density = 0.014;

    if (timeSensitiveLights.ambient) {
      timeSensitiveLights.ambient.intensity = 0.95;
    }
    if (timeSensitiveLights.hemi) {
      timeSensitiveLights.hemi.intensity = 1.28;
      timeSensitiveLights.hemi.color.set(0xe3f5ff);
      timeSensitiveLights.hemi.groundColor.set(0x557240);
    }
    if (timeSensitiveLights.mainDirectional) {
      timeSensitiveLights.mainDirectional.intensity = 2.3;
      timeSensitiveLights.mainDirectional.color.set(0xfff1c7);
      timeSensitiveLights.mainDirectional.position.set(-16, 24, 10);
    }
    if (timeSensitiveLights.portalSpot) {
      timeSensitiveLights.portalSpot.intensity = 6;
      timeSensitiveLights.portalSpot.color.set(0x8cd7ff);
    }

  for (const lantern of animatedLights) {
      lantern.baseIntensity = 3.2;
      lantern.light.color.set(0xfff3d5);
    }

    for (const material of nightGlowMaterials) {
      material.emissiveIntensity = 0;
    }
    for (const firefly of fireflies) {
      firefly.mesh.visible = false;
    }

    if (daySkyDecor) {
      daySkyDecor.visible = true;
    }
    if (nightSkyDecor) {
      nightSkyDecor.visible = false;
    }

    if (timeToggleButton) {
      timeToggleButton.textContent = "Switch to Night";
    }
    return;
  }

  scene.background = new THREE.Color(0x09111f);
  scene.fog.color.set(0x0b1720);
  scene.fog.density = 0.028;

  if (timeSensitiveLights.ambient) {
    timeSensitiveLights.ambient.intensity = 0.52;
  }
  if (timeSensitiveLights.hemi) {
    timeSensitiveLights.hemi.intensity = 0.9;
    timeSensitiveLights.hemi.color.set(0xa3d8ff);
    timeSensitiveLights.hemi.groundColor.set(0x12210f);
  }
  if (timeSensitiveLights.mainDirectional) {
    timeSensitiveLights.mainDirectional.intensity = 1.65;
    timeSensitiveLights.mainDirectional.color.set(0xcfe4ff);
    timeSensitiveLights.mainDirectional.position.set(12, 22, 8);
  }
  if (timeSensitiveLights.portalSpot) {
    timeSensitiveLights.portalSpot.intensity = 14;
    timeSensitiveLights.portalSpot.color.set(0x6ce0ff);
  }

  for (const lantern of animatedLights) {
    lantern.baseIntensity = 10;
    if (lantern.light.userData.baseColor) {
      lantern.light.color.copy(lantern.light.userData.baseColor);
    }
  }

  for (const material of nightGlowMaterials) {
    material.emissiveIntensity = material.userData.nightEmissiveIntensity ?? 0;
  }
  for (const firefly of fireflies) {
    firefly.mesh.visible = true;
  }

  if (daySkyDecor) {
    daySkyDecor.visible = false;
  }
  if (nightSkyDecor) {
    nightSkyDecor.visible = true;
  }

  if (timeToggleButton) {
    timeToggleButton.textContent = "Switch to Day";
  }
}

function makeForest() {
  makeGround();
  makeLights();
  makeDaySkyDecor();
  makeNightSkyDecor();
  makePortal();
  makeQueensCastleRealm();
  makeShapeGarden();
  makeCardArch();
  makeRabbitTrailBackdrop();
  makeFireflies();
  makeTeaParty();
  makeGrassBorders();

  const treeLayout = [
    [-18, 12, 1.35, -0.12], [-12, 6, 1.1, 0.09], [-18, -2, 1.45, 0.2], [-12, -12, 1.3, -0.14],
    [-8, 12, 1.2, 0.08], [8, 10, 1.15, -0.06], [15, -7, 1.36, 0.18], [10, -15, 1.28, -0.16],
    [-8, -18, 1.32, 0.15], [18, -16, 1.5, -0.08], [-20, 0, 1.22, 0.07], [20, 0, 1.26, -0.06],
    [-15, 18, 1.18, 0.12], [12, 18, 1.2, -0.12],
    [-25, 16, 1.42, -0.1], [-27, 6, 1.36, 0.12], [-26, -5, 1.5, -0.18], [-24, -16, 1.44, 0.09],
    [-15, -24, 1.34, 0.16], [11, -25, 1.38, 0.1], [24, -20, 1.46, -0.1],
    [27, -8, 1.4, 0.14], [27, 5, 1.35, -0.16], [24, 16, 1.47, 0.08], [2, 26, 1.33, -0.08],
    [-10, 25, 1.3, 0.12], [17, 24, 1.28, -0.14],
  ];

  for (const [x, z, scale, lean] of treeLayout) {
    makeTree(x, z, scale, lean);
  }

  const mushrooms = [
    [-7, 4, 1.2, 0xff4f76], [7, 5, 0.9, 0x87a6ff], [8, -2, 1.1, 0xf589ff], [-9, -3, 0.8, 0x6ffff0],
    [10, 3, 0.95, 0xffab5f], [6, -11, 1.25, 0x7de58b], [-10, 9, 0.7, 0xc195ff], [12, -6, 0.78, 0xff6689],
    [-6, -13, 0.74, 0xf0f36d], [14, 7, 0.86, 0x89ffba], [-14, 2, 0.72, 0x89d6ff], [6, 12, 0.68, 0xff8db7],
  ];

  for (const [x, z, scale, color] of mushrooms) {
    makeMushroom(x, z, scale, new THREE.Color(color));
  }

  const ferns = [
    [-10, 8, 1.1], [-12, 7, 0.8], [9, 8, 0.9], [11, 1, 1], [8, -4, 0.85], [-9, -6, 0.95], [14, -10, 1.1], [-12, -14, 1.2],
  ];
  for (const [x, z, scale] of ferns) {
    makeFernCluster(x, z, scale);
  }

  const crystalMaterial = new THREE.MeshStandardMaterial({
    color: 0x95f5ff,
    emissive: 0x4bd3ff,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.05,
  });
  crystalMaterial.userData.nightEmissiveIntensity = 0.9;
  nightGlowMaterials.push(crystalMaterial);
  for (let i = 0; i < 6; i += 1) {
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 6), crystalMaterial);
    const angle = i * (Math.PI / 3);
    crystal.position.set(Math.cos(angle) * 4.8, 0.9, -8 + Math.sin(angle) * 3.9);
    crystal.rotation.z = 0.1 + (i % 2) * 0.12;
    crystal.castShadow = true;
    scene.add(crystal);
  }
}

function loadRabbitMarker() {
  const mtlLoader = new MTLLoader();
  mtlLoader.load("./assets/models/rabbit-card.mtl", (materials) => {
    materials.preload();
    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.load("./assets/models/rabbit-card.obj", (object) => {
      object.scale.set(1.6, 1.6, 1.6);
      object.position.set(-3.8, 0.1, 11.2);
      object.rotation.y = Math.PI;
      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      rabbitMarker = object;
      scene.add(object);
      addCollider(-3.8, 11.2, 1.2);
    });
  });
}

function updateCameraRotation() {
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

function setupInput() {
  startButton.addEventListener("click", () => {
    instructions.classList.add("hidden");
  });

  if (timeToggleButton) {
    timeToggleButton.addEventListener("click", () => {
      setSceneTimeMode(!isDayMode);
    });
  }
  if (portalButton) {
    portalButton.addEventListener("click", () => {
      tryPortalTeleport();
    });
  }

  renderer.domElement.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }
    isDraggingLook = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  });

  document.addEventListener("mouseup", (event) => {
    if (event.button === 0) {
      isDraggingLook = false;
    }
  });

  document.addEventListener("mousemove", (event) => {
    if (!isDraggingLook) {
      return;
    }
    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    yaw -= deltaX * 0.0042;
    pitch -= deltaY * 0.0032;
    pitch = THREE.MathUtils.clamp(pitch, -Math.PI / 2.2, Math.PI / 2.2);
    updateCameraRotation();
  });

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "w") moveState.forward = true;
    if (key === "s") moveState.backward = true;
    if (key === "a") moveState.left = true;
    if (key === "d") moveState.right = true;
    if (key === "e") {
      tryPortalTeleport();
    }
  });

  document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    if (key === "w") moveState.forward = false;
    if (key === "s") moveState.backward = false;
    if (key === "a") moveState.left = false;
    if (key === "d") moveState.right = false;
  });
}

function updateMovement(delta) {
  const moveDirection = new THREE.Vector3();
  camera.getWorldDirection(moveDirection);
  moveDirection.y = 0;
  moveDirection.normalize();

  const right = new THREE.Vector3().crossVectors(moveDirection, camera.up).normalize();
  const nextOffset = new THREE.Vector3();
  const speed = 5.4 * delta;

  if (moveState.forward) nextOffset.add(moveDirection);
  if (moveState.backward) nextOffset.sub(moveDirection);
  if (moveState.left) nextOffset.sub(right);
  if (moveState.right) nextOffset.add(right);

  if (nextOffset.lengthSq() > 0) {
    nextOffset.normalize().multiplyScalar(speed);
    const nextPosition = camera.position.clone().add(nextOffset);
    nextPosition.y = 1.7;
    if (canMoveTo(nextPosition)) {
      camera.position.copy(nextPosition);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  updateMovement(delta);

  for (const card of animatedCards) {
    card.mesh.position.y = card.baseY + Math.sin(elapsed * 1.3 + card.offset) * 0.28;
    card.mesh.rotation.y += 0.004;
    card.mesh.rotation.x = 0.25 * Math.sin(elapsed * 0.8 + card.offset);
  }

  for (const lantern of animatedLights) {
    lantern.light.intensity = lantern.baseIntensity + Math.sin(elapsed * 2.1 + lantern.offset) * 1.8;
  }

  for (const grass of animatedGrass) {
    grass.mesh.rotation.z = Math.sin(elapsed * 1.2 + grass.offset) * 0.03;
  }

  for (const mushroom of animatedMushrooms) {
    mushroom.mesh.position.y = mushroom.baseY + Math.sin(elapsed * 1.8 + mushroom.offset) * 0.05;
  }

  for (const firefly of fireflies) {
    firefly.mesh.position.x = firefly.anchor.x + Math.cos(elapsed * firefly.speed + firefly.offset) * firefly.radius;
    firefly.mesh.position.y = firefly.anchor.y + Math.sin(elapsed * firefly.speed * 1.4 + firefly.offset) * 0.45;
    firefly.mesh.position.z = firefly.anchor.z + Math.sin(elapsed * firefly.speed + firefly.offset) * firefly.radius;
  }

  for (const heart of animatedHearts) {
    heart.mesh.position.y = heart.baseY + Math.sin(elapsed * 1.15 + heart.offset) * 0.12;
    heart.mesh.rotation.y += delta * 0.45;
  }

  if (rabbitMarker) {
    rabbitMarker.position.y = 0.15 + Math.sin(elapsed * 1.7) * 0.12;
    rabbitMarker.rotation.y = Math.PI + Math.sin(elapsed * 0.5) * 0.25;
  }

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

loadRoseModel();
makeForest();
loadRabbitMarker();
updateCameraRotation();
for (const lantern of animatedLights) {
  lantern.light.userData.baseColor = lantern.light.color.clone();
}
setupInput();
setSceneTimeMode(true);
animate();
