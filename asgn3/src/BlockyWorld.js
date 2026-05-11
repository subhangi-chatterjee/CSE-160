const VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform sampler2D u_Sampler5;
  uniform sampler2D u_Sampler6;
  uniform sampler2D u_Sampler7;
  uniform sampler2D u_Sampler8;
  uniform int u_WhichTexture;
  uniform float u_TexColorWeight;
  void main() {
    vec4 texColor = u_FragColor;

    if (u_WhichTexture == 0) {
      texColor = texture2D(u_Sampler0, v_UV);
    } else if (u_WhichTexture == 1) {
      texColor = texture2D(u_Sampler1, v_UV);
    } else if (u_WhichTexture == 2) {
      texColor = texture2D(u_Sampler2, v_UV);
    } else if (u_WhichTexture == 3) {
      texColor = texture2D(u_Sampler3, v_UV);
    } else if (u_WhichTexture == 4) {
      texColor = texture2D(u_Sampler4, v_UV);
    } else if (u_WhichTexture == 5) {
      texColor = texture2D(u_Sampler5, v_UV);
    } else if (u_WhichTexture == 6) {
      texColor = texture2D(u_Sampler6, v_UV);
    } else if (u_WhichTexture == 7) {
      texColor = texture2D(u_Sampler7, v_UV);
    } else if (u_WhichTexture == 8) {
      texColor = texture2D(u_Sampler8, v_UV);
    }

    gl_FragColor = mix(u_FragColor, texColor, clamp(u_TexColorWeight, 0.0, 1.0));
  }
`;

const WORLD_SIZE = 32;
const WORLD_HALF = WORLD_SIZE / 2;
const MAX_BLOCK_HEIGHT = 4;
const MOVE_SPEED = 0.28;
const TURN_SPEED = 5;
const BUILD_REACH = 1.35;
const PLAYER_HEIGHT = 1.65;
const PLAYER_HORSE_Y = 1.54;
const HIGHLIGHT_ALPHA = 0.28;
const APPLE_REACH = 1.35;

const VIEW_MODES = {
  first: 'first',
  second: 'second'
};

const GAME_MODES = {
  meadow: 'meadow',
  race: 'race',
  rainbow: 'rainbow'
};

const CONTROL_MODES = {
  hazel: 'hazel',
  explore: 'explore'
};

const TEXTURE_IDS = {
  grass: 0,
  stone: 1,
  plank: 2,
  water: 3,
  sky: 4,
  glass: 5,
  flowerWater: 6,
  pondStone: 7,
  pondStoneAccent: 8
};

const FIELD_GRASS_COLORS = {
  bladeBase: [0.18, 0.45, 0.12, 1.0],
  bladeMid: [0.24, 0.57, 0.16, 1.0],
  bladeTip: [0.33, 0.68, 0.21, 1.0]
};

const RAINBOW_GRASS_COLORS = {
  bladeBase: [0.23, 0.55, 0.17, 1.0],
  bladeMid: [0.32, 0.69, 0.24, 1.0],
  bladeTip: [0.45, 0.82, 0.33, 1.0]
};

const FIELD_GRASS_DENSITY = 0.29;
const FIELD_GRASS_ACCENT_DENSITY = 0.1;
const FIELD_GRASS_FIRST_PERSON_DISTANCE = 12.5;
const FIELD_GRASS_SECOND_PERSON_DISTANCE = 15.0;
const FIELD_FLOWER_DENSITY = 0.12;
const FIELD_FLOWER_ACCENT_DENSITY = 0.035;
const FIELD_FLOWER_FIRST_PERSON_DISTANCE = 11.5;
const FIELD_FLOWER_SECOND_PERSON_DISTANCE = 14.0;
const RAINBOW_HAND_FLOWER_RENDER_DISTANCE = 22.0;
const RAINBOW_FLOWER_RENDER_DISTANCE = 17.0;
const RAINBOW_TREE_RENDER_DISTANCE = 31.0;
const RAINBOW_BUSH_RENDER_DISTANCE = 19.0;
const RAINBOW_GRASS_RENDER_DISTANCE = 16.0;
const RAINBOW_LILYPAD_RENDER_DISTANCE = 20.0;
const RAINBOW_BUTTERFLY_RENDER_DISTANCE = 14.5;
const RAINBOW_FOUNTAIN_RENDER_DISTANCE = 18.0;
const RAINBOW_SMALL_POND_RENDER_DISTANCE = 21.0;
const RAINBOW_BRIDGE_RENDER_DISTANCE = 25.0;
const RAINBOW_DOME_RENDER_DISTANCE = 24.0;
const RAINBOW_PORTAL_RENDER_DISTANCE = 29.0;
const RAINBOW_HAND_FLOWER_MIN_DISTANCE = 1.7;
const RAINBOW_FIELD_FLOWER_MIN_DISTANCE = 2.2;
const RAINBOW_FLOWER_WATER_MARGIN = 0.16;
const FLOWER_TULIP_PALETTES = [
  [[0.95, 0.68, 0.8, 1.0], [0.74, 0.46, 0.63, 1.0]],
  [[0.98, 0.78, 0.85, 1.0], [0.79, 0.55, 0.7, 1.0]],
  [[0.88, 0.69, 0.95, 1.0], [0.67, 0.48, 0.8, 1.0]]
];
const FLOWER_BELL_PALETTES = [
  [[0.61, 0.29, 0.85, 1.0], [0.95, 0.8, 0.43, 1.0]],
  [[0.47, 0.7, 0.95, 1.0], [0.96, 0.84, 0.58, 1.0]],
  [[0.9, 0.58, 0.82, 1.0], [0.98, 0.82, 0.5, 1.0]]
];
const VICTORY_MESSAGE_DURATION = 5.0;
const RACE_RESULT_DURATION = 2.4;
const RACE_TRACK_START_X = -17.0;
const RACE_TRACK_FINISH_X = 17.0;
const RACE_TRACK_CENTER_Z = 0.0;
const RACE_TRACK_LANE_GAP = 3.2;
const RACE_TRACK_BASE_Y = 0.12;
const RACE_TRACK_HURDLE_XS = [-12.0, -8.0, -4.0, 0.0, 4.0, 8.0, 12.0];
const RACE_FORWARD_SPEED = 4.1;
const RACE_JUMP_VELOCITY = 6.2;
const RACE_GRAVITY = 15.5;
const RACE_HURDLE_CLEAR_HEIGHT = 0.65;
const RAINBOW_WORLD_LIMIT = 17.2;
const RAINBOW_GAZEBO_CENTER_X = -11.4;
const RAINBOW_GAZEBO_CENTER_Z = -5.8;
const RAINBOW_GAZEBO_RADIUS = 2.7;
const RAINBOW_PATH_HALF_WIDTH = 0.76;
const RAINBOW_MAIN_PATH_POINTS = [
  [13.35, 4.6],
  [13.5, 2.0],
  [13.2, -0.4],
  [11.6, -2.6],
  [8.9, -4.9],
  [5.8, -6.8],
  [2.8, -8.0],
  [0.0, -8.35]
];
const RAINBOW_GAZEBO_PATH_POINTS = [
  [-0.6, -4.8],
  [-3.4, -5.1],
  [-6.1, -5.45],
  [-8.2, -5.6],
  [RAINBOW_GAZEBO_CENTER_X + 2.2, RAINBOW_GAZEBO_CENTER_Z]
];
const RAINBOW_PORTAL_PATH_POINTS = [
  [-1.7, 13.0],
  [-1.1, 10.0],
  [-0.62, 6.6],
  [-0.2, 3.0],
  [0.0, -0.8],
  [0.0, -4.8],
  [0.0, -8.5]
];
const RAINBOW_TREE_SPOTS = [
  ['tree', -13.4, 9.6, 1.05],
  ['leaf', -10.6, -11.4, 1.2],
  ['tree', -5.8, -10.2, 1.0],
  ['leaf', 7.4, -11.9, 1.18],
  ['tree', 12.2, 8.6, 1.08],
  ['leaf', 10.8, 1.0, 1.0],
  ['tree', 2.4, 10.4, 1.0],
  ['leaf', -15.8, 2.2, 0.95]
];
const RAINBOW_BUSH_SPOTS = [
  [-14.6, 8.8, 1.0], [-13.4, 7.0, 0.86], [-12.8, -8.8, 0.92], [-10.8, -9.6, 0.84],
  [-8.9, 1.8, 0.9], [-5.2, 8.2, 0.82], [-2.8, 10.8, 0.92], [1.8, 10.6, 0.88],
  [7.2, 9.5, 1.0], [10.6, 7.2, 0.86], [12.9, 2.1, 0.96], [11.4, -5.8, 0.88],
  [5.8, -9.8, 0.92], [0.8, -10.4, 0.86], [-4.8, -10.0, 0.84], [-14.0, 3.8, 0.9]
];
const RAINBOW_TULIP_SPOTS = [
  [-14.8, 10.4, 1.0, 0], [-11.6, 9.2, 0.94, 1], [-9.8, 8.4, 0.98, 2], [-7.4, 8.0, 0.92, 0],
  [-13.8, 4.8, 0.9, 1], [-11.6, 5.6, 1.02, 2], [-8.2, 3.8, 0.88, 0], [-4.4, 9.6, 0.96, 1],
  [-3.2, 6.8, 0.9, 2], [-1.2, 9.8, 0.94, 0], [2.0, 9.8, 1.06, 1], [5.2, 9.2, 0.92, 2],
  [8.8, 8.4, 1.0, 0], [11.6, 6.8, 0.92, 1], [13.2, 3.4, 0.88, 2], [12.0, -0.6, 0.94, 0],
  [9.6, -3.0, 1.0, 1], [6.2, -8.6, 0.96, 2], [2.0, -9.6, 0.92, 0], [-1.8, -9.8, 0.96, 1],
  [-5.6, -8.8, 0.9, 2], [-9.8, -10.2, 1.04, 0], [-12.8, -8.6, 0.88, 1], [10.0, 1.8, 0.86, 2]
];
const RAINBOW_BELL_FLOWER_SPOTS = [
  [-15.0, 12.2, 1.02, 1, 0], [-10.6, 11.6, 0.92, -1, 1], [-6.6, 10.8, 0.96, 1, 0],
  [-13.8, 2.8, 0.9, -1, 2], [-10.0, 0.8, 0.84, 1, 1], [-7.0, -7.2, 0.92, -1, 0],
  [-3.0, 11.2, 0.88, 1, 2], [3.8, 10.8, 0.96, -1, 1], [8.8, 10.0, 1.0, 1, 0],
  [13.8, 6.4, 0.86, -1, 2], [13.0, -5.2, 0.92, 1, 1], [4.0, -10.8, 0.9, -1, 0],
  [-1.4, -11.2, 0.84, 1, 2], [1.8, -4.8, 0.8, -1, 1]
];
const RAINBOW_GRASS_SPOTS = [
  [-14.3, 7.8, 1.02, 18], [-13.1, 6.0, 0.94, 72], [-6.0, 6.8, 0.96, 130], [-13.5, 1.0, 0.88, 210],
  [-6.1, 0.9, 0.92, 302], [-12.8, -3.0, 0.9, 48], [-10.2, -1.5, 0.84, 168], [-8.2, -6.5, 1.0, 34],
  [-6.5, -8.6, 0.94, 114], [-4.2, -9.6, 0.88, 285], [-1.3, -9.3, 1.04, 40], [1.4, -9.1, 0.92, 156],
  [4.1, -8.4, 0.98, 330], [7.1, -7.6, 0.86, 84], [10.5, -7.1, 0.9, 240], [-2.0, 8.0, 0.96, 56],
  [1.2, 9.4, 1.08, 142], [4.4, 9.8, 0.92, 265], [7.8, 8.6, 0.95, 24], [11.2, 7.5, 1.04, 198],
  [13.2, 4.8, 0.88, 314], [12.0, -1.0, 0.96, 102], [9.1, -2.4, 0.82, 222], [-4.9, 2.2, 0.8, 146],
  [-2.1, 1.2, 0.76, 258], [-0.4, 8.7, 0.84, 6], [5.6, -9.8, 0.86, 188], [13.8, -4.0, 0.82, 292]
];
const RAINBOW_LILYPAD_SPOTS = [
  [4.4, 2.2, 0.72, [0.96, 0.59, 0.78, 1.0]],
  [6.8, 5.4, 0.76, [0.97, 0.74, 0.86, 1.0]],
  [9.1, 3.8, 0.7, [0.9, 0.56, 0.82, 1.0]],
  [11.0, 6.0, 0.66, [0.98, 0.66, 0.84, 1.0]],
  [3.2, 3.6, 0.64, [0.95, 0.7, 0.84, 1.0]],
  [5.6, 1.8, 0.68, [0.97, 0.76, 0.88, 1.0]],
  [7.8, 2.8, 0.62, [0.92, 0.63, 0.82, 1.0]],
  [8.2, 5.0, 0.7, [0.98, 0.72, 0.86, 1.0]],
  [10.2, 2.4, 0.6, [0.94, 0.68, 0.82, 1.0]],
  [11.6, 4.4, 0.64, [0.96, 0.78, 0.9, 1.0]],
  [-9.6, 4.2, 0.62, [0.96, 0.74, 0.88, 1.0]],
  [-11.8, 3.3, 0.66, [0.94, 0.66, 0.84, 1.0]],
  [-10.4, 1.9, 0.58, [0.97, 0.8, 0.9, 1.0]],
  [-8.8, 2.6, 0.6, [0.93, 0.62, 0.8, 1.0]]
];
const RAINBOW_BUTTERFLY_SPOTS = [
  [-12.8, 1.55, -7.2, [1.0, 0.28, 0.6, 1.0], 0.2, 1.0],
  [-8.4, 1.35, -2.8, [1.0, 0.48, 0.14, 1.0], 1.1, 0.92],
  [-2.6, 1.42, 8.4, [0.98, 0.84, 0.12, 1.0], 2.0, 0.96],
  [4.8, 1.48, 8.8, [0.9, 0.2, 0.28, 1.0], 2.8, 0.9],
  [9.8, 1.4, -3.8, [0.82, 0.22, 0.94, 1.0], 3.6, 0.94],
  [12.4, 1.58, 5.6, [0.72, 0.2, 0.96, 1.0], 4.4, 1.02]
];

const WORLD_ROWS = [
  '44444444444444444444444444444444',
  '40000000000000000000000000000004',
  '40000000000000000000000000000004',
  '40000000000000000000000000000004',
  '40002222222000000000000000000004',
  '40002000002000000000000000000004',
  '40002333002000000000000000000004',
  '40002000002000000111000000000004',
  '40002220222000000101000000000004',
  '40000000000000000111000000000004',
  '40000000000000000000000000000004',
  '40000000000000000000000000000004',
  '40000000000000000000000111111104',
  '40000000000000000000000100000104',
  '40000000011110000000000100000104',
  '40000000010010000000000100000104',
  '40000000010010000000000200000104',
  '40000000010010000000000200000104',
  '40000000011110000000000100000104',
  '40000000000000000000000100000104',
  '40000000000000000000000111111104',
  '40000000000000000000000000000004',
  '40000111000000000011110000000004',
  '40000101000000000010010000000004',
  '40000111000000000011110000000004',
  '40000000000000000000000000000004',
  '40000000000001110000000000000004',
  '40000000000001010000000000000004',
  '40000000000001110000000000000004',
  '40000000000000000000000000000004',
  '40000000000000000000000000000004',
  '44444444444444444444444444444444'
];

const GATE_CELLS = [
  { x: 23, z: 16 },
  { x: 23, z: 17 }
];

const APPLE_SITES = [
  { x: 6, z: 6, label: 'arch apple' },
  { x: 10, z: 23, label: 'pond apple' },
  { x: 17, z: 8, label: 'hill apple' }
];

let canvas;
let gl;
let a_Position;
let a_UV;
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_FragColor;
let u_WhichTexture;
let u_TexColorWeight;
let u_Samplers = [];

let g_camera;
let g_cube;
let g_cone;
let g_sphere;
let g_longDiamond;
let g_loadedTextures = {};
let g_cementPotModel = null;
let g_worldMap = [];
let g_apples = [];
let g_gateOpened = false;
let g_lastFrameTime = 0;
let g_seconds = 0;
let g_fps = 0;
let g_fpsSampleElapsed = 0;
let g_fpsSampleFrames = 0;
let g_isDragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;
let g_statusFlash = 'Textures are loading. Help Hazel collect the apples and meet Clover.';
let g_storyComplete = false;
let g_viewMode = VIEW_MODES.first;
let g_gameMode = GAME_MODES.meadow;
let g_controlMode = CONTROL_MODES.hazel;
let g_playerIsMoving = false;
let g_lastPlayerX = 0;
let g_lastPlayerZ = 0;
let g_metClover = false;
let g_fieldGrassPatches = [];
let g_fieldFlowerPatches = [];
let g_rainbowFlowerPatches = [];
let g_rainbowHandFlowerPatches = [];
let g_rainbowResolvedFlowerPatches = [];
let g_playerX = 0;
let g_playerZ = 0;
let g_playerYaw = -90;
let g_playerPitch = 0;
let g_victoryUiActive = false;
let g_victoryStartSeconds = -1;
let g_raceUnlocked = false;
let g_rainbowUnlocked = false;
let g_raceWinner = '';
let g_raceHorses = null;
let g_keyStates = {};
let g_raceResultStartSeconds = -1;
let g_rainbowChampion = null;
let g_graderMode = false;
let g_controlsGuideKey = '';

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get WebGL context');
    return false;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  return true;
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return false;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_WhichTexture = gl.getUniformLocation(gl.program, 'u_WhichTexture');
  u_TexColorWeight = gl.getUniformLocation(gl.program, 'u_TexColorWeight');
  u_Samplers = [
    gl.getUniformLocation(gl.program, 'u_Sampler0'),
    gl.getUniformLocation(gl.program, 'u_Sampler1'),
    gl.getUniformLocation(gl.program, 'u_Sampler2'),
    gl.getUniformLocation(gl.program, 'u_Sampler3'),
    gl.getUniformLocation(gl.program, 'u_Sampler4'),
    gl.getUniformLocation(gl.program, 'u_Sampler5'),
    gl.getUniformLocation(gl.program, 'u_Sampler6'),
    gl.getUniformLocation(gl.program, 'u_Sampler7'),
    gl.getUniformLocation(gl.program, 'u_Sampler8')
  ];

  if (
    a_Position < 0 ||
    a_UV < 0 ||
    !u_ModelMatrix ||
    !u_ViewMatrix ||
    !u_ProjectionMatrix ||
    !u_FragColor ||
    !u_WhichTexture ||
    !u_TexColorWeight ||
    u_Samplers.some((sampler) => !sampler)
  ) {
    console.log('Failed to find shader variables.');
    return false;
  }

  for (let i = 0; i < u_Samplers.length; i += 1) {
    gl.uniform1i(u_Samplers[i], i);
  }

  return true;
}

function buildWorldMap() {
  return WORLD_ROWS.map(function(row) {
    return row.split('').map(function(char) {
      return Number(char);
    });
  });
}

function initializeWorld() {
  g_worldMap = buildWorldMap();
  g_apples = APPLE_SITES.map(function(site) {
    return {
      x: site.x,
      z: site.z,
      label: site.label,
      collected: false
    };
  });
  g_gateOpened = false;
  g_storyComplete = false;
  g_metClover = false;
  g_fieldGrassPatches = buildFieldGrassPatches();
  g_fieldFlowerPatches = buildFieldFlowerPatches();
  g_rainbowFlowerPatches = buildRainbowFlowerPatches();
  const resolvedRainbowFlowers = buildResolvedRainbowFlowerPatches();
  g_rainbowHandFlowerPatches = resolvedRainbowFlowers.hand;
  g_rainbowResolvedFlowerPatches = resolvedRainbowFlowers.field;
  g_victoryUiActive = false;
  g_victoryStartSeconds = -1;
  g_rainbowUnlocked = false;
  g_raceResultStartSeconds = -1;
  g_rainbowChampion = null;
  g_graderMode = false;
  g_controlsGuideKey = '';
  setVictoryCelebrationActive(false);
  setTopNotice('', false);
}

function resizeCanvas() {
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
  if (canvas.width === displayWidth && canvas.height === displayHeight) {
    return;
  }

  canvas.width = displayWidth;
  canvas.height = displayHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  g_camera.setAspect(canvas.width / canvas.height);
}

function loadTexture(unit, source) {
  gl.uniform1i(u_Samplers[unit], unit);

  const image = new Image();
  image.onload = function() {
    const texture = gl.createTexture();
    const isPowerOfTwoTexture =
      (image.width & (image.width - 1)) === 0 &&
      (image.height & (image.height - 1)) === 0;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    if (isPowerOfTwoTexture) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Samplers[unit], unit);
    g_loadedTextures[unit] = texture;
    renderScene();
  };
  image.src = source;
}

function initTextures() {
  loadTexture(TEXTURE_IDS.grass, 'textures/grass.svg');
  loadTexture(TEXTURE_IDS.stone, 'textures/stone.svg');
  loadTexture(TEXTURE_IDS.plank, 'textures/planks.svg');
  loadTexture(TEXTURE_IDS.water, 'textures/water.jpeg');
  loadTexture(TEXTURE_IDS.sky, 'textures/sky.jpeg');
  loadTexture(TEXTURE_IDS.glass, 'textures/portal-rose-glass.jpeg?portal-rose-v3');
  loadTexture(TEXTURE_IDS.flowerWater, 'textures/water.jpeg');
  loadTexture(TEXTURE_IDS.pondStone, 'textures/stone.svg?rainbow-brick-v1');
  loadTexture(TEXTURE_IDS.pondStoneAccent, 'textures/stone.svg?rainbow-brick-cap-v1');
}

function initImportedModels() {
  g_cementPotModel = new MeshModel(CEMENT_POT_MODEL_DATA, 'textures/cement-pot.png');
  g_cementPotModel.color = [0.92, 0.92, 0.92, 1.0];
}

function setTopNotice(text, isVisible) {
  const topNotice = document.getElementById('topNotice');
  if (!topNotice) {
    return;
  }

  if (text) {
    topNotice.textContent = text;
  }
  topNotice.classList.toggle('visible', !!isVisible);
}

function updateControlsGuide() {
  const controlsList = document.getElementById('controlsList');
  if (!controlsList) {
    return;
  }

  let modeKey = g_gameMode;
  if (g_gameMode === GAME_MODES.meadow) {
    modeKey += ':' + (isExploreMode() ? 'explore' : 'hazel');
  }

  if (g_controlsGuideKey === modeKey) {
    return;
  }

  let items = [];

  if (g_gameMode === GAME_MODES.race) {
    items = [
      '<li><strong>Hazel:</strong> <code>W</code> runs forward and <code>S</code> jumps</li>',
      '<li><strong>Clover:</strong> <code>I</code> runs forward and <code>K</code> jumps</li>',
      '<li><strong>Goal:</strong> clear the hurdles and reach the finish line first</li>',
      '<li><strong>View:</strong> top-down race view stays locked on the whole track</li>'
    ];
  } else if (g_gameMode === GAME_MODES.rainbow) {
    items = [
      '<li><strong>Move:</strong> <code>W</code> <code>A</code> <code>S</code> <code>D</code></li>',
      '<li><strong>Turn:</strong> <code>Q</code> / <code>E</code> or drag with the mouse</li>',
      '<li><strong>Zoom:</strong> use the mouse wheel or <code>Z</code> / <code>X</code></li>'
    ];
  } else if (isExploreMode()) {
    items = [
      '<li><strong>Move:</strong> <code>W</code> <code>A</code> <code>S</code> <code>D</code></li>',
      '<li><strong>Look:</strong> drag with the mouse to look around freely</li>',
      '<li><strong>Zoom:</strong> use the mouse wheel or <code>Z</code> / <code>X</code></li>',
      '<li><strong>Return:</strong> click <code>Return to Hazel</code> to control Hazel again</li>'
    ];
  } else {
    items = [
      '<li><strong>Move:</strong> <code>W</code> <code>A</code> <code>S</code> <code>D</code></li>',
      '<li><strong>Turn:</strong> <code>Q</code> / <code>E</code> or drag with the mouse</li>',
      '<li><strong>Collect:</strong> walk up to an apple and press <code>Space</code></li>',
      '<li><strong>Build:</strong> <code>F</code> adds a block, <code>R</code> removes one</li>',
      '<li><strong>View:</strong> press <code>V</code> to switch between first-person and second-person horse view</li>',
      '<li><strong>Explore:</strong> click the button below, then drag to look around and use the mouse wheel or <code>Z</code> / <code>X</code> to zoom</li>'
    ];
  }

  controlsList.innerHTML = items.join('');
  g_controlsGuideKey = modeKey;
}

function getRaceLaneZ(index) {
  return index === 0 ? -RACE_TRACK_LANE_GAP * 0.5 : RACE_TRACK_LANE_GAP * 0.5;
}

function createRaceHorseState(name, laneIndex, colors, forwardKey, jumpKey) {
  return {
    name: name,
    laneIndex: laneIndex,
    laneZ: getRaceLaneZ(laneIndex),
    x: RACE_TRACK_START_X,
    jumpOffset: 0,
    velocityY: 0,
    colors: colors,
    forwardKey: forwardKey,
    jumpKey: jumpKey,
    finished: false,
    hurdleIndex: 0,
    moving: false
  };
}

function initializeRaceTrack() {
  g_raceHorses = {
    hazel: createRaceHorseState('Hazel', 0, HORSE_AVATAR_COLORS, 'w', 's'),
    clover: createRaceHorseState('Clover', 1, CLOVER_NPC_COLORS, 'i', 'k')
  };
  g_raceWinner = '';
  g_raceResultStartSeconds = -1;
  g_rainbowChampion = null;
  g_keyStates = {};
  g_isDragging = false;
  g_controlMode = CONTROL_MODES.hazel;
  g_viewMode = VIEW_MODES.first;
  g_camera.setFov(60);
  g_statusFlash = 'Race start! Hazel uses W to run and S to jump. Clover uses I to run and K to jump.';
  setVictoryCelebrationActive(false);
  setTopNotice('', false);
}

function isRaceTrackAccessible() {
  return g_graderMode || g_raceUnlocked;
}

function isRainbowLandAccessible() {
  return g_graderMode || g_rainbowUnlocked;
}

function switchToRaceTrack() {
  if (!isRaceTrackAccessible()) {
    g_statusFlash = 'Finish the Clover meadow first to unlock the race track.';
    return;
  }

  g_gameMode = GAME_MODES.race;
  initializeRaceTrack();
  updateRaceTrackButton();
  updateExploreButton();
  updateRainbowLandButton();
}

function switchToRainbowLand(championName) {
  if (!championName) {
    return;
  }

  const previousMode = g_gameMode;
  if (previousMode === GAME_MODES.race) {
    g_rainbowUnlocked = true;
  }
  g_gameMode = GAME_MODES.rainbow;
  g_rainbowChampion = championName.toLowerCase() === 'clover' ? 'clover' : 'hazel';
  g_keyStates = {};
  g_isDragging = false;
  g_controlMode = CONTROL_MODES.explore;
  g_viewMode = VIEW_MODES.first;
  const rainbowPose = getRainbowCameraStartPose();
  g_camera.setPosition(rainbowPose.x, rainbowPose.y, rainbowPose.z);
  g_camera.setYawPitch(rainbowPose.yaw, rainbowPose.pitch);
  g_camera.setFov(62);
  g_statusFlash = 'Move with W/A/S/D, drag to look around, and use the mouse wheel or Z/X to zoom.';
  setTopNotice(championName + ' enters Rainbow Land', true);
  updateRaceTrackButton();
  updateExploreButton();
  updateRainbowLandButton();
  updateGraderButton();
}

function switchToMeadowWorld() {
  g_gameMode = GAME_MODES.meadow;
  g_keyStates = {};
  g_isDragging = false;
  g_controlMode = CONTROL_MODES.hazel;
  g_raceResultStartSeconds = -1;
  g_rainbowChampion = null;
  syncCameraToPlayer();
  g_camera.setFov(60);
  g_statusFlash = g_raceUnlocked
    ? 'Back in the meadow. The race track is still open.'
    : 'Back in the meadow.';
  setTopNotice(g_raceUnlocked ? 'Race track is now open' : '', g_raceUnlocked);
  updateRaceTrackButton();
  updateExploreButton();
  updateRainbowLandButton();
  updateGraderButton();
}

function toggleRaceTrackMode() {
  if (g_gameMode === GAME_MODES.race || g_gameMode === GAME_MODES.rainbow) {
    switchToMeadowWorld();
  } else {
    switchToRaceTrack();
  }
}

function setButtonTooltip(buttonId, description) {
  const button = document.getElementById(buttonId);
  if (!button) {
    return;
  }

  button.setAttribute('title', description);
  const wrapper = button.parentElement;
  if (wrapper && wrapper.classList.contains('tooltip-wrap')) {
    wrapper.setAttribute('data-tooltip', description);
  }
}

function updateRaceTrackButton() {
  const raceTrackButton = document.getElementById('raceTrackButton');
  if (!raceTrackButton) {
    return;
  }

  raceTrackButton.textContent = (g_gameMode === GAME_MODES.race || g_gameMode === GAME_MODES.rainbow)
    ? 'Back to Meadow'
    : 'Race track';
  raceTrackButton.disabled = !isRaceTrackAccessible() && g_gameMode !== GAME_MODES.race && g_gameMode !== GAME_MODES.rainbow;

  let description = 'Play the two-horse hurdle race after it unlocks from the meadow game.';
  if (g_gameMode === GAME_MODES.race || g_gameMode === GAME_MODES.rainbow) {
    description = 'Go back to the meadow world.';
  } else if (!isRaceTrackAccessible()) {
    description = 'Locked until Hazel opens the gate and finishes the meadow game.';
  }
  setButtonTooltip('raceTrackButton', description);
}

function updateRainbowLandButton() {
  const rainbowLandButton = document.getElementById('rainbowLandButton');
  if (!rainbowLandButton) {
    return;
  }

  rainbowLandButton.textContent = g_gameMode === GAME_MODES.rainbow ? 'In Rainbow Land' : 'Rainbow Land';
  rainbowLandButton.disabled =
    !isRainbowLandAccessible() ||
    g_gameMode === GAME_MODES.race ||
    g_gameMode === GAME_MODES.rainbow;

  let description = 'Visit Rainbow Land after you win the race track.';
  if (!isRainbowLandAccessible()) {
    description = 'Locked until the race track is completed, unless grader mode is on.';
  } else if (g_gameMode === GAME_MODES.race) {
    description = 'Finish or leave the race track before jumping to Rainbow Land.';
  } else if (g_gameMode === GAME_MODES.rainbow) {
    description = 'You are already in Rainbow Land.';
  }
  setButtonTooltip('rainbowLandButton', description);
}

function updateGraderButton() {
  const graderButton = document.getElementById('graderButton');
  if (!graderButton) {
    return;
  }

  graderButton.textContent = g_graderMode ? 'Grader On' : 'Grader';
  graderButton.classList.toggle('active', g_graderMode);
  graderButton.setAttribute('aria-pressed', g_graderMode ? 'true' : 'false');
  setButtonTooltip(
    'graderButton',
    g_graderMode
      ? 'Grader mode is on. Race track and Rainbow Land can be opened directly.'
      : 'Turn on grader mode to access Race track and Rainbow Land without finishing earlier games.'
  );
}

function toggleGraderMode() {
  g_graderMode = !g_graderMode;
  g_statusFlash = g_graderMode
    ? 'Grader mode enabled. Race track and Rainbow Land are open for direct review.'
    : 'Grader mode disabled. Normal progression is restored: meadow, then race, then Rainbow Land.';
  updateRaceTrackButton();
  updateRainbowLandButton();
  updateGraderButton();
}

function goToRainbowLandFromMeadow() {
  if (!isRainbowLandAccessible()) {
    g_statusFlash = 'Finish the race track first to unlock Rainbow Land.';
    return;
  }
  switchToRainbowLand('Hazel');
}

function isExploreMode() {
  return g_controlMode === CONTROL_MODES.explore;
}

function getControlModeLabel() {
  return isExploreMode() ? 'explore' : 'hazel';
}

function syncPlayerPoseFromCamera() {
  g_playerX = g_camera.eye.elements[0];
  g_playerZ = g_camera.eye.elements[2];
  g_playerYaw = g_camera.yaw;
  g_playerPitch = g_camera.pitch;
}

function syncCameraToPlayer() {
  g_camera.setPosition(g_playerX, PLAYER_HEIGHT, g_playerZ);
  g_camera.setYawPitch(g_playerYaw, g_playerPitch);
}

function getPlayerFlatForward() {
  const yawRadians = degreesToRadians(g_playerYaw);
  return {
    x: Math.cos(yawRadians),
    z: Math.sin(yawRadians)
  };
}

function getPlayerRightVector() {
  const forward = getPlayerFlatForward();
  return {
    x: -forward.z,
    z: forward.x
  };
}

function getPlayerPosition() {
  return {
    x: g_playerX,
    z: g_playerZ
  };
}

function getYawPitchFromDirection(dx, dy, dz) {
  const planarLength = Math.sqrt(dx * dx + dz * dz);
  return {
    yaw: Math.atan2(dz, dx) * 180 / Math.PI,
    pitch: Math.atan2(dy, planarLength) * 180 / Math.PI
  };
}

function getSecondPersonCameraPlacement() {
  const forward = getPlayerFlatForward();
  const right = getPlayerRightVector();
  const playerX = g_playerX;
  const playerZ = g_playerZ;
  const cameraHeight = 2.15;
  const targetForwardDistance = 1.45;
  const targetHeight = 1.15;
  const followCandidates = [
    { back: 3.4, side: 1.15 },
    { back: 2.9, side: 0.95 },
    { back: 2.4, side: 0.75 },
    { back: 1.9, side: 0.55 },
    { back: 1.35, side: 0.28 },
    { back: 0.9, side: 0.0 }
  ];

  let eyeX = playerX;
  let eyeZ = playerZ;

  for (let i = 0; i < followCandidates.length; i += 1) {
    const candidateX = playerX - forward.x * followCandidates[i].back + right.x * followCandidates[i].side;
    const candidateZ = playerZ - forward.z * followCandidates[i].back + right.z * followCandidates[i].side;
    if (canUseFollowCameraPosition(candidateX, candidateZ)) {
      eyeX = candidateX;
      eyeZ = candidateZ;
      break;
    }
  }

  return {
    eyeX: eyeX,
    eyeY: cameraHeight,
    eyeZ: eyeZ,
    targetX: playerX + forward.x * targetForwardDistance,
    targetY: targetHeight,
    targetZ: playerZ + forward.z * targetForwardDistance
  };
}

function getExploreCameraStartPose() {
  if (g_viewMode === VIEW_MODES.second) {
    const placement = getSecondPersonCameraPlacement();
    const direction = getYawPitchFromDirection(
      placement.targetX - placement.eyeX,
      placement.targetY - placement.eyeY,
      placement.targetZ - placement.eyeZ
    );
    return {
      x: placement.eyeX,
      y: placement.eyeY,
      z: placement.eyeZ,
      yaw: direction.yaw,
      pitch: direction.pitch
    };
  }

  const forward = getPlayerFlatForward();
  const right = getPlayerRightVector();
  return {
    x: g_playerX - forward.x * 1.5 + right.x * 0.75,
    y: PLAYER_HEIGHT + 0.55,
    z: g_playerZ - forward.z * 1.5 + right.z * 0.75,
    yaw: g_playerYaw,
    pitch: -12
  };
}

function getRainbowCameraStartPose() {
  return {
    x: -2.4,
    y: 3.35,
    z: 13.6,
    yaw: -84,
    pitch: -9
  };
}

function canExplorePosition(x, z) {
  return !!worldToCell(x, z);
}

function canRainbowPosition(x, z) {
  return x >= -RAINBOW_WORLD_LIMIT &&
    x <= RAINBOW_WORLD_LIMIT &&
    z >= -RAINBOW_WORLD_LIMIT &&
    z <= RAINBOW_WORLD_LIMIT;
}

function getExploreMoveValidator() {
  return g_gameMode === GAME_MODES.rainbow ? canRainbowPosition : canExplorePosition;
}

function updateExploreButton() {
  const exploreButton = document.getElementById('exploreButton');
  if (!exploreButton) {
    return;
  }

  if (g_gameMode === GAME_MODES.rainbow) {
    exploreButton.textContent = 'Reset View';
    exploreButton.disabled = false;
    setButtonTooltip('exploreButton', 'Reset the Rainbow Land camera back to its default view.');
    return;
  }

  exploreButton.textContent = isExploreMode() ? 'Return to Hazel' : 'Explore';
  exploreButton.disabled = g_gameMode !== GAME_MODES.meadow;
  let description = 'Free-look around the meadow without moving Hazel. Use drag and zoom controls while exploring.';
  if (isExploreMode()) {
    description = 'Leave free-look mode and return control to Hazel.';
  } else if (g_gameMode !== GAME_MODES.meadow) {
    description = 'Explore mode is only available in the meadow, and Reset View is used in Rainbow Land.';
  }
  setButtonTooltip('exploreButton', description);
}

function toggleExploreMode() {
  if (g_gameMode === GAME_MODES.race) {
    g_statusFlash = 'Explore mode is only available in the meadow.';
    return;
  }

  if (g_gameMode === GAME_MODES.rainbow) {
    const rainbowPose = getRainbowCameraStartPose();
    g_controlMode = CONTROL_MODES.explore;
    g_camera.setPosition(rainbowPose.x, rainbowPose.y, rainbowPose.z);
    g_camera.setYawPitch(rainbowPose.yaw, rainbowPose.pitch);
    g_camera.setFov(62);
    g_statusFlash = 'Rainbow Land view reset. Move with W/A/S/D, drag to look, and use the mouse wheel or Z/X to zoom.';
    updateExploreButton();
    return;
  }

  if (isExploreMode()) {
    g_controlMode = CONTROL_MODES.hazel;
    syncCameraToPlayer();
    g_statusFlash = 'Returned to Hazel.';
    updateExploreButton();
    return;
  }

  const explorePose = getExploreCameraStartPose();
  g_controlMode = CONTROL_MODES.explore;
  g_camera.setPosition(explorePose.x, explorePose.y, explorePose.z);
  g_camera.setYawPitch(explorePose.yaw, explorePose.pitch);
  g_statusFlash = 'Explore mode enabled. Hazel stays put while you move, look around, and zoom.';
  updateExploreButton();
}

function cellToWorld(cell) {
  return cell - WORLD_HALF;
}

function cellCenter(cell) {
  return cellToWorld(cell) + 0.5;
}

function worldToCell(x, z) {
  const cellX = Math.floor(x + WORLD_HALF);
  const cellZ = Math.floor(z + WORLD_HALF);
  if (cellX < 0 || cellX >= WORLD_SIZE || cellZ < 0 || cellZ >= WORLD_SIZE) {
    return null;
  }

  return { x: cellX, z: cellZ };
}

function isProtectedBorder(cell) {
  return cell.x === 0 || cell.z === 0 || cell.x === WORLD_SIZE - 1 || cell.z === WORLD_SIZE - 1;
}

function canOccupyPosition(x, z) {
  const radius = 0.25;
  const probes = [
    [x - radius, z - radius],
    [x + radius, z - radius],
    [x - radius, z + radius],
    [x + radius, z + radius]
  ];

  for (let i = 0; i < probes.length; i += 1) {
    const cell = worldToCell(probes[i][0], probes[i][1]);
    if (!cell || g_worldMap[cell.z][cell.x] > 0) {
      return false;
    }
  }

  return true;
}

function canUseFollowCameraPosition(x, z) {
  const cell = worldToCell(x, z);
  if (!cell) {
    return false;
  }

  const samples = [
    [x, z],
    [x - 0.18, z],
    [x + 0.18, z],
    [x, z - 0.18],
    [x, z + 0.18]
  ];

  for (let i = 0; i < samples.length; i += 1) {
    const sampleCell = worldToCell(samples[i][0], samples[i][1]);
    if (!sampleCell || g_worldMap[sampleCell.z][sampleCell.x] > 0) {
      return false;
    }
  }

  return true;
}

function getFrontCell() {
  const forward = g_camera.getFlatForward().elements;
  const sampleX = g_camera.eye.elements[0] + forward[0] * BUILD_REACH;
  const sampleZ = g_camera.eye.elements[2] + forward[2] * BUILD_REACH;
  return worldToCell(sampleX, sampleZ);
}

function getNearbyApple(maxDistance) {
  let closestApple = null;
  let closestDistance = maxDistance;
  const playerPosition = getPlayerPosition();

  for (let i = 0; i < g_apples.length; i += 1) {
    if (g_apples[i].collected) {
      continue;
    }

    const dx = playerPosition.x - cellCenter(g_apples[i].x);
    const dz = playerPosition.z - cellCenter(g_apples[i].z);
    const distance = Math.sqrt(dx * dx + dz * dz);
    if (distance <= closestDistance) {
      closestApple = g_apples[i];
      closestDistance = distance;
    }
  }

  return closestApple;
}

function getAppleInCell(cell) {
  if (!cell) {
    return null;
  }

  for (let i = 0; i < g_apples.length; i += 1) {
    if (!g_apples[i].collected && g_apples[i].x === cell.x && g_apples[i].z === cell.z) {
      return g_apples[i];
    }
  }

  return null;
}

function updateStoryAfterAppleCollection() {
  const remaining = g_apples.filter(function(apple) {
    return !apple.collected;
  }).length;

  if (remaining === 0 && !g_gateOpened) {
    g_gateOpened = true;
    for (let i = 0; i < GATE_CELLS.length; i += 1) {
      g_worldMap[GATE_CELLS[i].z][GATE_CELLS[i].x] = 0;
    }
    g_statusFlash = 'The gate is open. Lead Hazel inside to meet Clover.';
  }
}

function collectNearbyApple() {
  const apple = getAppleInCell(getFrontCell()) || getNearbyApple(APPLE_REACH);
  if (!apple) {
    g_statusFlash = 'No apple is selected. Highlight an apple block and press Space.';
    return;
  }

  apple.collected = true;
  g_statusFlash = 'Collected the ' + apple.label + '.';
  updateStoryAfterAppleCollection();
}

function modifyBlockInFront(delta) {
  const cell = getFrontCell();
  if (!cell || isProtectedBorder(cell)) {
    g_statusFlash = 'You can only edit blocks inside the meadow walls.';
    return;
  }

  const currentHeight = g_worldMap[cell.z][cell.x];
  const nextHeight = Math.max(0, Math.min(MAX_BLOCK_HEIGHT, currentHeight + delta));
  if (nextHeight === currentHeight) {
    g_statusFlash = delta > 0 ? 'That stack is already at the max height.' : 'There is no block there to remove.';
    return;
  }

  g_worldMap[cell.z][cell.x] = nextHeight;
  g_statusFlash = delta > 0 ? 'Placed one block.' : 'Removed one block.';
}

function toggleViewMode() {
  if (isExploreMode()) {
    g_statusFlash = 'Return to Hazel before switching horse views.';
    return;
  }

  g_viewMode = g_viewMode === VIEW_MODES.first ? VIEW_MODES.second : VIEW_MODES.first;
  g_statusFlash = g_viewMode === VIEW_MODES.first
    ? 'First-person view enabled.'
    : 'Second-person view enabled. The camera now follows just behind your horse.';
}

function addKeyboardControls() {
  document.addEventListener('keydown', function(ev) {
    const key = ev.key.toLowerCase();
    g_keyStates[key] = true;
    let handled = true;

    if (g_gameMode === GAME_MODES.race) {
      if (key === 'w' || key === 'i') {
        handled = true;
      } else if (key === 's') {
        triggerRaceJump(g_raceHorses.hazel);
      } else if (key === 'k') {
        triggerRaceJump(g_raceHorses.clover);
      } else {
        handled = false;
      }

      if (handled) {
        ev.preventDefault();
        renderScene();
      }
      return;
    }

    if (key === 'w') {
      if (isExploreMode()) {
        g_camera.moveForward(MOVE_SPEED * 1.2, getExploreMoveValidator());
      } else if (g_camera.moveForward(MOVE_SPEED, canOccupyPosition)) {
        syncPlayerPoseFromCamera();
      }
    } else if (key === 's') {
      if (isExploreMode()) {
        g_camera.moveBackwards(MOVE_SPEED * 1.2, getExploreMoveValidator());
      } else if (g_camera.moveBackwards(MOVE_SPEED, canOccupyPosition)) {
        syncPlayerPoseFromCamera();
      }
    } else if (key === 'a') {
      if (isExploreMode()) {
        g_camera.moveLeft(MOVE_SPEED * 1.2, getExploreMoveValidator());
      } else if (g_camera.moveLeft(MOVE_SPEED, canOccupyPosition)) {
        syncPlayerPoseFromCamera();
      }
    } else if (key === 'd') {
      if (isExploreMode()) {
        g_camera.moveRight(MOVE_SPEED * 1.2, getExploreMoveValidator());
      } else if (g_camera.moveRight(MOVE_SPEED, canOccupyPosition)) {
        syncPlayerPoseFromCamera();
      }
    } else if (key === 'q') {
      g_camera.panLeft(TURN_SPEED);
      if (!isExploreMode()) {
        syncPlayerPoseFromCamera();
      }
    } else if (key === 'e') {
      g_camera.panRight(TURN_SPEED);
      if (!isExploreMode()) {
        syncPlayerPoseFromCamera();
      }
    } else if (key === 'f') {
      if (isExploreMode()) {
        g_statusFlash = 'Explore mode is camera-only. Return to Hazel to build.';
      } else {
        modifyBlockInFront(1);
      }
    } else if (key === 'r') {
      if (isExploreMode()) {
        g_statusFlash = 'Explore mode is camera-only. Return to Hazel to build.';
      } else {
        modifyBlockInFront(-1);
      }
    } else if (ev.code === 'Space') {
      if (isExploreMode()) {
        g_statusFlash = 'Return to Hazel to collect apples.';
      } else {
        collectNearbyApple();
      }
    } else if (key === 'v') {
      toggleViewMode();
    } else if (key === 'z') {
      if (isExploreMode()) {
        g_camera.adjustFov(-3);
      } else {
        handled = false;
      }
    } else if (key === 'x') {
      if (isExploreMode()) {
        g_camera.adjustFov(3);
      } else {
        handled = false;
      }
    } else {
      handled = false;
    }

    if (handled) {
      ev.preventDefault();
      renderScene();
    }
  });

  document.addEventListener('keyup', function(ev) {
    g_keyStates[ev.key.toLowerCase()] = false;
  });
}

function addMouseControls() {
  canvas.addEventListener('mousedown', function(ev) {
    g_isDragging = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
    canvas.focus();
  });

  canvas.addEventListener('mousemove', function(ev) {
    if (!g_isDragging) {
      return;
    }

    const deltaX = ev.clientX - g_lastMouseX;
    const deltaY = ev.clientY - g_lastMouseY;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;

    if (deltaX < 0) {
      g_camera.panLeft(Math.abs(deltaX) * 0.22);
    } else if (deltaX > 0) {
      g_camera.panRight(deltaX * 0.22);
    }

    g_camera.tilt(-deltaY * 0.18);
    if (!isExploreMode()) {
      syncPlayerPoseFromCamera();
    }
    renderScene();
  });

  canvas.addEventListener('wheel', function(ev) {
    if (!isExploreMode()) {
      return;
    }

    ev.preventDefault();
    g_camera.adjustFov(ev.deltaY > 0 ? 3 : -3);
    renderScene();
  }, { passive: false });

  function stopDrag() {
    g_isDragging = false;
  }

  canvas.addEventListener('mouseup', stopDrag);
  canvas.addEventListener('mouseleave', stopDrag);
}

function addInterfaceControls() {
  const exploreButton = document.getElementById('exploreButton');
  if (exploreButton) {
    exploreButton.addEventListener('click', function() {
      toggleExploreMode();
      renderScene();
      canvas.focus();
    });
  }

  const raceTrackButton = document.getElementById('raceTrackButton');
  if (raceTrackButton) {
    raceTrackButton.addEventListener('click', function() {
      toggleRaceTrackMode();
      renderScene();
      canvas.focus();
    });
  }

  const rainbowLandButton = document.getElementById('rainbowLandButton');
  if (rainbowLandButton) {
    rainbowLandButton.addEventListener('click', function() {
      goToRainbowLandFromMeadow();
      renderScene();
      canvas.focus();
    });
  }

  const graderButton = document.getElementById('graderButton');
  if (graderButton) {
    graderButton.addEventListener('click', function() {
      toggleGraderMode();
      renderScene();
      canvas.focus();
    });
  }

  updateExploreButton();
  updateRaceTrackButton();
  updateRainbowLandButton();
  updateGraderButton();
  setupVictoryCelebration();
}

function setupVictoryCelebration(forceRebuild) {
  const confettiBurst = document.getElementById('confettiBurst');
  if (!confettiBurst) {
    return;
  }

  if (forceRebuild) {
    confettiBurst.innerHTML = '';
  }

  if (confettiBurst.children.length > 0) {
    return;
  }

  const colors = ['#ff6b4f', '#ffd166', '#46c7bf', '#4c8dff', '#8d5cf6', '#84d34f', '#ff7ab6'];
  const shapes = ['square', 'circle', 'diamond', 'triangle', 'streamer'];

  for (let i = 0; i < 140; i += 1) {
    const piece = document.createElement('div');
    const jitter = Math.sin(i * 12.7) * 0.5 + 0.5;
    const left = ((i * 11.7) % 100) + jitter * 1.8;
    const size = 9 + ((i * 5) % 10) + jitter * 3;
    const duration = 2.6 + ((i * 3) % 6) * 0.22 + jitter * 0.35;
    const delay = ((i % 12) * 0.09) + jitter * 0.42;
    const drift = -180 + ((i * 37) % 360);
    const spinDirection = i % 2 === 0 ? 1 : -1;
    const spin = spinDirection * (240 + ((i * 41) % 620));

    piece.className = 'confetti-piece shape-' + shapes[i % shapes.length];
    piece.style.setProperty('--left', Math.max(0, Math.min(98, left)).toFixed(2) + '%');
    piece.style.setProperty('--size', size.toFixed(1) + 'px');
    piece.style.setProperty('--color', colors[i % colors.length]);
    piece.style.setProperty('--duration', duration.toFixed(2) + 's');
    piece.style.setProperty('--delay', delay.toFixed(2) + 's');
    piece.style.setProperty('--drift', drift.toFixed(0) + 'px');
    piece.style.setProperty('--spin', spin.toFixed(0) + 'deg');
    confettiBurst.appendChild(piece);
  }
}

function setVictoryCelebrationActive(isActive) {
  if (g_victoryUiActive === isActive) {
    return;
  }

  const victoryOverlay = document.getElementById('victoryOverlay');
  const confettiBurst = document.getElementById('confettiBurst');
  if (!victoryOverlay || !confettiBurst) {
    g_victoryUiActive = isActive;
    return;
  }

  if (isActive) {
    confettiBurst.classList.remove('active');
    setupVictoryCelebration(true);
    victoryOverlay.classList.add('visible');
    void confettiBurst.offsetWidth;
    confettiBurst.classList.add('active');
  } else {
    victoryOverlay.classList.remove('visible');
    confettiBurst.classList.remove('active');
  }

  g_victoryUiActive = isActive;
}

function getViewModeLabel() {
  return g_viewMode === VIEW_MODES.first ? 'first-person' : 'second-person';
}

function updatePlayerMovementState() {
  const dx = g_playerX - g_lastPlayerX;
  const dz = g_playerZ - g_lastPlayerZ;
  g_playerIsMoving = dx * dx + dz * dz > 0.0005;
  g_lastPlayerX = g_playerX;
  g_lastPlayerZ = g_playerZ;
}

function triggerRaceJump(horse) {
  if (!horse || horse.finished || horse.jumpOffset > 0.02) {
    return;
  }

  horse.jumpOffset = 0.02;
  horse.velocityY = RACE_JUMP_VELOCITY;
}

function checkRaceHorseHurdle(horse, previousX) {
  const hurdleX = RACE_TRACK_HURDLE_XS[horse.hurdleIndex];
  if (hurdleX === undefined) {
    return;
  }

  const hurdleRange = 0.42;
  if (previousX < hurdleX + hurdleRange && horse.x >= hurdleX - hurdleRange) {
    if (horse.jumpOffset < RACE_HURDLE_CLEAR_HEIGHT) {
      horse.x = hurdleX - 0.5;
      horse.jumpOffset = 0;
      horse.velocityY = 0;
      horse.moving = false;
    } else {
      horse.hurdleIndex += 1;
    }
  }
}

function updateRaceHorse(horse, deltaSeconds) {
  if (!horse) {
    return;
  }

  const previousX = horse.x;
  horse.moving = false;

  if (!horse.finished && g_keyStates[horse.forwardKey]) {
    horse.x = Math.min(RACE_TRACK_FINISH_X, horse.x + RACE_FORWARD_SPEED * deltaSeconds);
    horse.moving = true;
  }

  if (horse.jumpOffset > 0 || horse.velocityY !== 0) {
    horse.jumpOffset += horse.velocityY * deltaSeconds;
    horse.velocityY -= RACE_GRAVITY * deltaSeconds;
    if (horse.jumpOffset <= 0) {
      horse.jumpOffset = 0;
      horse.velocityY = 0;
    }
  }

  checkRaceHorseHurdle(horse, previousX);

  if (!horse.finished && horse.x >= RACE_TRACK_FINISH_X) {
    horse.x = RACE_TRACK_FINISH_X;
    horse.finished = true;
    if (!g_raceWinner) {
      g_raceWinner = horse.name;
      g_raceResultStartSeconds = g_seconds;
      g_statusFlash = horse.name + ' reached the finish line and wins the race!';
      setTopNotice(horse.name + ' wins the race!', true);
    }
  }
}

function updateRaceState(deltaSeconds) {
  if (!g_raceHorses) {
    return;
  }

  updateRaceHorse(g_raceHorses.hazel, deltaSeconds);
  updateRaceHorse(g_raceHorses.clover, deltaSeconds);

  if (g_raceWinner && g_raceResultStartSeconds >= 0 && g_seconds - g_raceResultStartSeconds >= RACE_RESULT_DURATION) {
    switchToRainbowLand(g_raceWinner);
  }
}

function updateVictorySequence() {
  if (g_gameMode !== GAME_MODES.meadow) {
    setVictoryCelebrationActive(false);
    return;
  }

  if (!g_storyComplete) {
    setVictoryCelebrationActive(false);
    if (!g_raceUnlocked) {
      setTopNotice('', false);
    }
    return;
  }

  if (g_victoryStartSeconds < 0) {
    g_victoryStartSeconds = g_seconds;
  }

  if (g_seconds - g_victoryStartSeconds < VICTORY_MESSAGE_DURATION) {
    setVictoryCelebrationActive(true);
    setTopNotice('', false);
    return;
  }

  setVictoryCelebrationActive(false);
  if (!g_raceUnlocked) {
    g_raceUnlocked = true;
    g_statusFlash = 'Race track is now open.';
    updateRaceTrackButton();
    updateRainbowLandButton();
  }
  setTopNotice('Race track is now open', true);
}

function isPlayerInGateZone() {
  if (!g_gateOpened) {
    return false;
  }

  const cell = worldToCell(g_playerX, g_playerZ);
  if (!cell) {
    return false;
  }

  return cell.x >= 22 && cell.x <= 24 && cell.z >= 15 && cell.z <= 18;
}

function isPlayerInBrownPaddockArea() {
  if (!g_gateOpened) {
    return false;
  }

  const cell = worldToCell(g_playerX, g_playerZ);
  if (!cell) {
    return false;
  }

  return cell.x >= 24 && cell.x <= 28 && cell.z >= 13 && cell.z <= 19;
}

function getPlayerAnimationMode() {
  if (isPlayerInBrownPaddockArea()) {
    return 4;
  }

  if (g_playerIsMoving) {
    return 1;
  }

  return 0;
}

function updateMeetingStory() {
  if (!g_gateOpened || g_metClover || !isPlayerInBrownPaddockArea()) {
    return;
  }

  g_metClover = true;
  g_storyComplete = true;
  g_victoryStartSeconds = g_seconds;
  g_statusFlash = 'VICTORY! Yey!! Hazel made it through the gate and met Clover.';
}

function updateHud() {
  const collectedCount = g_apples.filter(function(apple) {
    return apple.collected;
  }).length;
  const remainingApples = g_apples.length - collectedCount;
  const frontCell = getFrontCell();
  const selectedApple = getAppleInCell(frontCell);
  const nearbyApple = getNearbyApple(APPLE_REACH);
  const targetLine = document.getElementById('targetLine');
  const storyLine = document.getElementById('storyLine');
  const gateBanner = document.getElementById('gateBanner');
  updateControlsGuide();

  if (g_gameMode === GAME_MODES.rainbow) {
    document.getElementById('statusLine').textContent =
      'FPS ' + g_fps.toFixed(1) +
      ' | Rainbow Land' +
      ' | Camera roam' +
      ' | ' + g_statusFlash;

    targetLine.textContent = 'Move with W/A/S/D, turn with Q/E or drag with the mouse, and use the mouse wheel or Z/X to zoom.';
    storyLine.textContent = 'Welcome to Rainbow Land. Explore and enjoy';

    if (gateBanner) {
      gateBanner.classList.remove('visible');
    }
    return;
  }

  if (g_gameMode === GAME_MODES.race) {
    document.getElementById('statusLine').textContent =
      'FPS ' + g_fps.toFixed(1) +
      ' | Race track' +
      ' | ' + (g_raceWinner ? g_raceWinner + ' wins!' : 'Hazel W/S | Clover I/K');

    targetLine.textContent = g_raceWinner
      ? g_raceWinner + ' reached the finish line first. Rainbow Land is loading.'
      : 'Top-down race controls: Hazel uses W to run and S to jump. Clover uses I to run and K to jump.';

    storyLine.textContent = g_raceWinner
      ? g_raceWinner + ' won the hurdle race across the track.'
      : 'Race Hazel and Clover from left to right, and jump over the hurdles at the right time.';

    if (gateBanner) {
      gateBanner.classList.remove('visible');
    }
    return;
  }

  document.getElementById('statusLine').textContent =
    'FPS ' + g_fps.toFixed(1) +
    ' | Apples ' + collectedCount + '/' + g_apples.length +
    ' | Mode ' + getControlModeLabel() +
    ' | View ' + getViewModeLabel() +
    ' | Gate ' + (g_gateOpened ? 'open' : 'closed') +
    ' | ' + g_statusFlash;

  if (g_storyComplete) {
    targetLine.textContent = 'Goal complete: Hazel and Clover are together inside the paddock.';
  } else if (isExploreMode()) {
    targetLine.textContent = 'Explore mode: move with W/A/S/D, drag to look, use the mouse wheel or Z/X to zoom.';
  } else if (selectedApple) {
    targetLine.textContent =
      'Selected apple: press Space to collect the ' + selectedApple.label + '.';
  } else if (nearbyApple) {
    targetLine.textContent =
      'Apple nearby: press Space to collect the ' + nearbyApple.label + '.';
  } else if (g_gateOpened) {
    targetLine.textContent = 'Next goal: lead Hazel through the open gate to meet Clover.';
  } else if (remainingApples > 0) {
    targetLine.textContent =
      'Next goal: find the remaining ' + remainingApples + ' apple' + (remainingApples === 1 ? '' : 's') + ' to open the gate.';
  } else if (frontCell) {
    targetLine.textContent =
      'Build target: cell (' + frontCell.x + ', ' + frontCell.z + ') has height ' + g_worldMap[frontCell.z][frontCell.x] + '.';
  } else {
    targetLine.textContent = 'Build target: outside the map border.';
  }

  if (g_storyComplete) {
    storyLine.textContent = 'Hazel made it into the paddock and finally met Clover.';
  } else if (g_gateOpened) {
    storyLine.textContent = 'The gate is open. Lead Hazel into the paddock so she can meet Clover.';
  } else {
    storyLine.textContent = 'Collect the three apples to open the paddock gate, then guide Hazel inside to meet Clover.';
  }

  if (gateBanner) {
    gateBanner.classList.toggle('visible', g_gateOpened && !g_storyComplete && !g_raceUnlocked);
  }
}

function drawCube(matrix, color, textureNum, texWeight) {
  g_cube.matrix.set(matrix);
  g_cube.color = color;
  g_cube.textureNum = textureNum;
  g_cube.texColorWeight = texWeight;
  g_cube.render();
}

function drawBox(tx, ty, tz, sx, sy, sz, color, textureNum, texWeight) {
  const matrix = new Matrix4();
  matrix.translate(tx, ty, tz);
  matrix.scale(sx, sy, sz);
  drawCube(matrix, color, textureNum, texWeight);
}

function drawBoxFrom(baseMatrix, tx, ty, tz, sx, sy, sz, color, textureNum, texWeight) {
  const matrix = new Matrix4(baseMatrix);
  matrix.translate(tx, ty, tz);
  matrix.scale(sx, sy, sz);
  drawCube(matrix, color, textureNum, texWeight);
}

function drawCone(matrix, color, segments) {
  g_cone.matrix.set(matrix);
  g_cone.color = color;
  g_cone.segments = segments || 12;
  gl.uniform1i(u_WhichTexture, -1);
  gl.uniform1f(u_TexColorWeight, 0.0);
  g_cone.render();
}

function drawLongDiamond(matrix, color) {
  g_longDiamond.matrix.set(matrix);
  g_longDiamond.color = color;
  g_longDiamond.render();
}

function drawSphere(matrix, color) {
  g_sphere.matrix.set(matrix);
  g_sphere.color = color;
  g_sphere.render();
}

function drawConeShape(matrix, color, segments) {
  gl.uniform1i(u_WhichTexture, -1);
  gl.uniform1f(u_TexColorWeight, 0.0);

  const cone = new Cone();
  cone.color = color;
  cone.matrix = matrix;
  cone.segments = segments || 6;
  cone.render();
}

function renderFieldGrassBlade(baseMatrix, tx, ty, tz, sideSign, bendScale, sizeScale, colors) {
  const palette = colors || FIELD_GRASS_COLORS;
  const bladeBase = new Matrix4(baseMatrix);
  bladeBase.translate(tx, ty, tz);
  bladeBase.rotate(sideSign * (14 + 8 * bendScale), 0, 0, 1);
  bladeBase.rotate(sideSign * 16, 1, 0, 0);

  const bottom = new Matrix4(bladeBase);
  bottom.scale(0.03 * sizeScale, 0.09 * sizeScale, 0.03 * sizeScale);
  drawConeShape(bottom, palette.bladeBase, 8);

  const middleFrame = new Matrix4(bladeBase);
  middleFrame.translate(0.0, 0.065 * sizeScale, 0.0);
  middleFrame.rotate(sideSign * (12 + 10 * bendScale), 0, 0, 1);
  middleFrame.rotate(sideSign * 10, 1, 0, 0);

  const middle = new Matrix4(middleFrame);
  middle.scale(0.024 * sizeScale, 0.075 * sizeScale, 0.024 * sizeScale);
  drawConeShape(middle, palette.bladeMid, 8);

  const tipFrame = new Matrix4(middleFrame);
  tipFrame.translate(0.0, 0.055 * sizeScale, 0.0);
  tipFrame.rotate(sideSign * (18 + 8 * bendScale), 0, 0, 1);
  tipFrame.rotate(sideSign * 8, 1, 0, 0);

  const tip = new Matrix4(tipFrame);
  tip.scale(0.016 * sizeScale, 0.06 * sizeScale, 0.016 * sizeScale);
  drawConeShape(tip, palette.bladeTip, 8);
}

function renderFieldGrassClump(baseMatrix, tx, ty, tz, scale, colors) {
  const palette = colors || FIELD_GRASS_COLORS;
  renderFieldGrassBlade(baseMatrix, tx, ty, tz, -1, 0.2, scale, palette);
  renderFieldGrassBlade(baseMatrix, tx + 0.03 * scale, ty + 0.002, tz + 0.015 * scale, 1, 0.45, scale * 1.05, palette);
  renderFieldGrassBlade(baseMatrix, tx - 0.028 * scale, ty, tz - 0.012 * scale, -1, 0.65, scale * 0.92, palette);
}

function grassNoise(cellX, cellZ, seed) {
  return ((cellX * 67 + cellZ * 97 + seed * 53) % 1000) / 1000;
}

function sceneNoise(a, b, seed) {
  const raw = Math.sin(a * 12.9898 + b * 78.233 + seed * 39.425) * 43758.5453123;
  return raw - Math.floor(raw);
}

function isPondCell(cellX, cellZ) {
  return cellX >= 12 && cellX <= 15 && cellZ >= 22 && cellZ <= 25;
}

function isPathCell(cellX, cellZ) {
  return (cellZ === 27 && cellX >= 2 && cellX <= 23) || (cellX === 23 && cellZ >= 16 && cellZ <= 27);
}

function isPaddockFloorCell(cellX, cellZ) {
  return cellX >= 24 && cellX <= 28 && cellZ >= 13 && cellZ <= 19;
}

function isAppleStandCell(cellX, cellZ) {
  for (let i = 0; i < APPLE_SITES.length; i += 1) {
    if (APPLE_SITES[i].x === cellX && APPLE_SITES[i].z === cellZ) {
      return true;
    }
  }

  return false;
}

function canCellHostFieldGrass(cellX, cellZ) {
  if (g_worldMap[cellZ][cellX] !== 0) {
    return false;
  }

  if (isPathCell(cellX, cellZ) || isPondCell(cellX, cellZ) || isPaddockFloorCell(cellX, cellZ) || isAppleStandCell(cellX, cellZ)) {
    return false;
  }

  return true;
}

function shouldRenderFieldGrass(cellX, cellZ) {
  if (!canCellHostFieldGrass(cellX, cellZ)) {
    return false;
  }

  return grassNoise(cellX, cellZ, 1) < FIELD_GRASS_DENSITY;
}

function buildFieldGrassPatches() {
  const patches = [];

  for (let z = 1; z < WORLD_SIZE - 1; z += 1) {
    for (let x = 1; x < WORLD_SIZE - 1; x += 1) {
      if (!canCellHostFieldGrass(x, z)) {
        continue;
      }

      if (shouldRenderFieldGrass(x, z)) {
        patches.push({
          cellX: x,
          cellZ: z,
          x: cellToWorld(x) + 0.16 + grassNoise(x, z, 2) * 0.62,
          z: cellToWorld(z) + 0.14 + grassNoise(x, z, 3) * 0.64,
          yaw: grassNoise(x, z, 4) * 360,
          scale: 0.68 + grassNoise(x, z, 5) * 0.28
        });
      }

      if (grassNoise(x, z, 6) < FIELD_GRASS_ACCENT_DENSITY) {
        patches.push({
          cellX: x,
          cellZ: z,
          x: cellToWorld(x) + 0.48 + grassNoise(x, z, 7) * 0.24,
          z: cellToWorld(z) + 0.42 + grassNoise(x, z, 8) * 0.24,
          yaw: grassNoise(x, z, 9) * 360,
          scale: 0.5 + grassNoise(x, z, 10) * 0.18
        });
      }
    }
  }

  return patches;
}

function buildFieldFlowerPatches() {
  const patches = [];

  for (let z = 1; z < WORLD_SIZE - 1; z += 1) {
    for (let x = 1; x < WORLD_SIZE - 1; x += 1) {
      if (!canCellHostFieldGrass(x, z)) {
        continue;
      }

      if (grassNoise(x, z, 11) < FIELD_FLOWER_DENSITY) {
        patches.push({
          cellX: x,
          cellZ: z,
          x: cellToWorld(x) + 0.12 + grassNoise(x, z, 12) * 0.74,
          z: cellToWorld(z) + 0.1 + grassNoise(x, z, 13) * 0.76,
          scale: 0.62 + grassNoise(x, z, 14) * 0.2,
          type: grassNoise(x, z, 15) < 0.36 ? 'bell' : 'tulip',
          paletteIndex: Math.floor(grassNoise(x, z, 16) * FLOWER_TULIP_PALETTES.length),
          leanDir: grassNoise(x, z, 17) < 0.5 ? -1 : 1
        });
      }

      if (grassNoise(x, z, 18) < FIELD_FLOWER_ACCENT_DENSITY) {
        patches.push({
          cellX: x,
          cellZ: z,
          x: cellToWorld(x) + 0.26 + grassNoise(x, z, 19) * 0.46,
          z: cellToWorld(z) + 0.22 + grassNoise(x, z, 20) * 0.46,
          scale: 0.48 + grassNoise(x, z, 21) * 0.14,
          type: grassNoise(x, z, 22) < 0.28 ? 'bell' : 'tulip',
          paletteIndex: Math.floor(grassNoise(x, z, 23) * FLOWER_TULIP_PALETTES.length),
          leanDir: grassNoise(x, z, 24) < 0.5 ? -1 : 1
        });
      }
    }
  }

  return patches;
}

function isRainbowFlowerInsideRect(x, z, startX, startZ, width, depth, pad) {
  return x >= startX - pad &&
    x <= startX + width + pad &&
    z >= startZ - pad &&
    z <= startZ + depth + pad;
}

function getRainbowSegmentDistanceSq(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSq = dx * dx + dz * dz;

  if (lengthSq <= 0.0001) {
    const ox = px - ax;
    const oz = pz - az;
    return ox * ox + oz * oz;
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lengthSq));
  const closestX = ax + dx * t;
  const closestZ = az + dz * t;
  const ox = px - closestX;
  const oz = pz - closestZ;
  return ox * ox + oz * oz;
}

function isRainbowNearPolyline(x, z, points, halfWidth) {
  const maxDistanceSq = halfWidth * halfWidth;

  for (let i = 0; i < points.length - 1; i += 1) {
    if (getRainbowSegmentDistanceSq(
      x,
      z,
      points[i][0],
      points[i][1],
      points[i + 1][0],
      points[i + 1][1]
    ) <= maxDistanceSq) {
      return true;
    }
  }

  return false;
}

function isRainbowInsideGazeboFootprint(x, z, pad) {
  const dx = x - RAINBOW_GAZEBO_CENTER_X;
  const dz = z - RAINBOW_GAZEBO_CENTER_Z;
  const radius = RAINBOW_GAZEBO_RADIUS + (pad || 0);
  return dx * dx + dz * dz <= radius * radius;
}

function isRainbowOnGardenPath(x, z, pad) {
  const halfWidth = RAINBOW_PATH_HALF_WIDTH + (pad || 0);
  return isRainbowNearPolyline(x, z, RAINBOW_MAIN_PATH_POINTS, halfWidth) ||
    isRainbowNearPolyline(x, z, RAINBOW_GAZEBO_PATH_POINTS, halfWidth) ||
    isRainbowNearPolyline(x, z, RAINBOW_PORTAL_PATH_POINTS, halfWidth);
}

function isRainbowFlowerInsidePondWater(x, z, pondX, pondZ, width, depth, pad) {
  const surroundPad = 0.92;
  const borderThickness = 0.58;
  const waterInset = borderThickness - 0.02;
  const waterStartX = pondX - surroundPad + waterInset;
  const waterStartZ = pondZ - surroundPad + waterInset;
  const waterWidth = width + surroundPad * 2 - waterInset * 2;
  const waterDepth = depth + surroundPad * 2 - waterInset * 2;

  return isRainbowFlowerInsideRect(x, z, waterStartX, waterStartZ, waterWidth, waterDepth, pad);
}

function canRainbowHostFlower(x, z) {
  if (x < -15.8 || x > 15.8 || z < -15.8 || z > 15.8) {
    return false;
  }

  if (isRainbowFlowerInsidePondWater(x, z, 2.3, 1.0, 10.0, 6.4, RAINBOW_FLOWER_WATER_MARGIN)) {
    return false;
  }

  if (isRainbowFlowerInsidePondWater(x, z, -11.0, 2.8, 4.8, 3.2, RAINBOW_FLOWER_WATER_MARGIN)) {
    return false;
  }

  if (x >= 2.2 && x <= 12.3 && z >= 2.45 && z <= 6.1) {
    return false;
  }

  if (x >= -3.5 && x <= 3.5 && z >= -13.8 && z <= -6.8) {
    return false;
  }

  if (isRainbowInsideGazeboFootprint(x, z, 0.28) || isRainbowOnGardenPath(x, z, 0.08)) {
    return false;
  }

  return true;
}

function isRainbowFlowerFarEnough(x, z, placedFlowers, minDistanceSq) {
  for (let i = 0; i < placedFlowers.length; i += 1) {
    const dx = placedFlowers[i].x - x;
    const dz = placedFlowers[i].z - z;
    if (dx * dx + dz * dz < minDistanceSq) {
      return false;
    }
  }

  return true;
}

function buildRainbowFlowerPatches() {
  const patches = [];
  const step = 3.3;
  const minDistanceSq = RAINBOW_FIELD_FLOWER_MIN_DISTANCE * RAINBOW_FIELD_FLOWER_MIN_DISTANCE;
  let row = 0;

  for (let z = -14.7; z <= 14.7; z += step) {
    let col = 0;
    for (let x = -14.7; x <= 14.7; x += step) {
      if (sceneNoise(col, row, 1) > 0.24) {
        col += 1;
        continue;
      }

      const flowerX = x + (sceneNoise(col, row, 2) - 0.5) * 0.48;
      const flowerZ = z + (sceneNoise(col, row, 3) - 0.5) * 0.48;
      if (canRainbowHostFlower(flowerX, flowerZ) && isRainbowFlowerFarEnough(flowerX, flowerZ, patches, minDistanceSq)) {
        patches.push({
          x: flowerX,
          z: flowerZ,
          scale: 0.74 + sceneNoise(col, row, 4) * 0.24,
          type: sceneNoise(col, row, 5) < 0.34 ? 'bell' : 'tulip',
          paletteIndex: Math.floor(sceneNoise(col, row, 6) * FLOWER_TULIP_PALETTES.length),
          leanDir: sceneNoise(col, row, 7) < 0.5 ? -1 : 1
        });
      }

      if (sceneNoise(col, row, 8) < 0.045) {
        const accentX = flowerX + (sceneNoise(col, row, 9) - 0.5) * 1.0;
        const accentZ = flowerZ + (sceneNoise(col, row, 10) - 0.5) * 1.0;
        if (canRainbowHostFlower(accentX, accentZ) && isRainbowFlowerFarEnough(accentX, accentZ, patches, minDistanceSq * 0.78)) {
          patches.push({
            x: accentX,
            z: accentZ,
            scale: 0.52 + sceneNoise(col, row, 11) * 0.16,
            type: sceneNoise(col, row, 12) < 0.28 ? 'bell' : 'tulip',
            paletteIndex: Math.floor(sceneNoise(col, row, 13) * FLOWER_TULIP_PALETTES.length),
            leanDir: sceneNoise(col, row, 14) < 0.5 ? -1 : 1
          });
        }
      }

      col += 1;
    }
    row += 1;
  }

  return patches;
}

function getFieldGrassRenderDistanceSq() {
  const renderDistance = g_viewMode === VIEW_MODES.second
    ? FIELD_GRASS_SECOND_PERSON_DISTANCE
    : FIELD_GRASS_FIRST_PERSON_DISTANCE;
  return renderDistance * renderDistance;
}

function getFieldFlowerRenderDistanceSq() {
  const renderDistance = g_viewMode === VIEW_MODES.second
    ? FIELD_FLOWER_SECOND_PERSON_DISTANCE
    : FIELD_FLOWER_FIRST_PERSON_DISTANCE;
  return renderDistance * renderDistance;
}

function renderFlowerPatch(patch) {
  if (patch.type === 'bell') {
    const bellPalette = FLOWER_BELL_PALETTES[patch.paletteIndex % FLOWER_BELL_PALETTES.length];
    renderRainbowBellFlower(patch.x, patch.z, patch.scale, bellPalette[0], bellPalette[1], patch.leanDir);
    return;
  }

  const tulipPalette = FLOWER_TULIP_PALETTES[patch.paletteIndex % FLOWER_TULIP_PALETTES.length];
  renderRainbowFlower(patch.x, patch.z, patch.scale, tulipPalette[0], tulipPalette[1]);
}

function findRainbowFlowerPlacement(patch, placedFlowers, minDistanceSq) {
  const candidateOffsets = [
    [0.0, 0.0],
    [0.82, 0.0],
    [-0.82, 0.0],
    [0.0, 0.82],
    [0.0, -0.82],
    [0.64, 0.64],
    [0.64, -0.64],
    [-0.64, 0.64],
    [-0.64, -0.64],
    [1.24, 0.0],
    [-1.24, 0.0],
    [0.0, 1.24],
    [0.0, -1.24],
    [1.02, 0.56],
    [-1.02, 0.56],
    [1.02, -0.56],
    [-1.02, -0.56]
  ];

  for (let i = 0; i < candidateOffsets.length; i += 1) {
    const candidate = {
      x: patch.x + candidateOffsets[i][0],
      z: patch.z + candidateOffsets[i][1]
    };

    if (!canRainbowHostFlower(candidate.x, candidate.z)) {
      continue;
    }

    if (!isRainbowFlowerFarEnough(candidate.x, candidate.z, placedFlowers, minDistanceSq)) {
      continue;
    }

    return candidate;
  }

  return null;
}

function resolveRainbowFlowerPatch(patch, placedFlowers, minDistanceSq) {
  const placement = findRainbowFlowerPlacement(patch, placedFlowers, minDistanceSq);
  if (!placement) {
    return null;
  }

  const resolvedPatch = Object.assign({}, patch, placement);
  placedFlowers.push({ x: resolvedPatch.x, z: resolvedPatch.z });
  return resolvedPatch;
}

function buildResolvedRainbowFlowerPatches() {
  const placedFlowers = [];
  const handPatches = [];
  const fieldPatches = [];
  const handFlowerMinDistanceSq = RAINBOW_HAND_FLOWER_MIN_DISTANCE * RAINBOW_HAND_FLOWER_MIN_DISTANCE;
  const fieldFlowerMinDistanceSq = RAINBOW_FIELD_FLOWER_MIN_DISTANCE * RAINBOW_FIELD_FLOWER_MIN_DISTANCE;

  for (let i = 0; i < RAINBOW_TULIP_SPOTS.length; i += 1) {
    const patch = resolveRainbowFlowerPatch({
      x: RAINBOW_TULIP_SPOTS[i][0],
      z: RAINBOW_TULIP_SPOTS[i][1],
      scale: RAINBOW_TULIP_SPOTS[i][2],
      type: 'tulip',
      paletteIndex: RAINBOW_TULIP_SPOTS[i][3],
      leanDir: 1
    }, placedFlowers, handFlowerMinDistanceSq);

    if (patch) {
      handPatches.push(patch);
    }
  }

  for (let i = 0; i < RAINBOW_BELL_FLOWER_SPOTS.length; i += 1) {
    const patch = resolveRainbowFlowerPatch({
      x: RAINBOW_BELL_FLOWER_SPOTS[i][0],
      z: RAINBOW_BELL_FLOWER_SPOTS[i][1],
      scale: RAINBOW_BELL_FLOWER_SPOTS[i][2],
      type: 'bell',
      paletteIndex: RAINBOW_BELL_FLOWER_SPOTS[i][4],
      leanDir: RAINBOW_BELL_FLOWER_SPOTS[i][3]
    }, placedFlowers, handFlowerMinDistanceSq);

    if (patch) {
      handPatches.push(patch);
    }
  }

  for (let i = 0; i < g_rainbowFlowerPatches.length; i += 1) {
    const patch = resolveRainbowFlowerPatch(g_rainbowFlowerPatches[i], placedFlowers, fieldFlowerMinDistanceSq);
    if (patch) {
      fieldPatches.push(patch);
    }
  }

  return {
    hand: handPatches,
    field: fieldPatches
  };
}

function tryRenderRainbowFlowerPatch(patch, placedFlowers, minDistanceSq) {
  const placement = findRainbowFlowerPlacement(patch, placedFlowers, minDistanceSq);
  if (!placement) {
    return false;
  }

  const resolvedPatch = Object.assign({}, patch, placement);
  renderFlowerPatch(resolvedPatch);
  placedFlowers.push({ x: resolvedPatch.x, z: resolvedPatch.z });
  return true;
}

function isRainbowDetailVisible(x, z, maxDistance) {
  const dx = x - g_camera.eye.elements[0];
  const dz = z - g_camera.eye.elements[2];
  return dx * dx + dz * dz <= maxDistance * maxDistance;
}

function renderFieldGrass() {
  const playerX = g_camera.eye.elements[0];
  const playerZ = g_camera.eye.elements[2];
  const maxDistanceSq = getFieldGrassRenderDistanceSq();

  for (let i = 0; i < g_fieldGrassPatches.length; i += 1) {
    const patch = g_fieldGrassPatches[i];
    const dx = patch.x - playerX;
    const dz = patch.z - playerZ;

    if (dx * dx + dz * dz > maxDistanceSq || !canCellHostFieldGrass(patch.cellX, patch.cellZ)) {
      continue;
    }

    const clumpBase = new Matrix4();
    clumpBase.translate(patch.x, 0.02, patch.z);
    clumpBase.rotate(patch.yaw, 0, 1, 0);
    renderFieldGrassClump(clumpBase, 0.0, 0.0, 0.0, patch.scale);
  }
}

function renderFieldFlowers() {
  const playerX = g_camera.eye.elements[0];
  const playerZ = g_camera.eye.elements[2];
  const maxDistanceSq = getFieldFlowerRenderDistanceSq();

  for (let i = 0; i < g_fieldFlowerPatches.length; i += 1) {
    const patch = g_fieldFlowerPatches[i];
    const dx = patch.x - playerX;
    const dz = patch.z - playerZ;

    if (dx * dx + dz * dz > maxDistanceSq || !canCellHostFieldGrass(patch.cellX, patch.cellZ)) {
      continue;
    }

    renderFlowerPatch(patch);
  }
}

function renderSkyCloudLayer(centerX, y, centerZ, width, depth, yaw, tintAlpha, texWeight) {
  const matrix = new Matrix4();
  matrix.translate(centerX, y, centerZ);
  matrix.rotate(yaw, 0, 1, 0);
  matrix.scale(width, 0.16, depth);
  matrix.translate(-0.5, 0.0, -0.5);
  drawCube(matrix, [0.96, 0.98, 1.0, tintAlpha], TEXTURE_IDS.sky, texWeight);
}

function renderSky() {
  renderSkyCloudLayer(0.0, 54.0, 0.0, 270, 270, 0, 0.08, 0.48);
  renderSkyCloudLayer(0.0, 64.0, 0.0, 330, 330, 24, 0.04, 0.34);
}

function renderGround() {
  drawBox(-WORLD_HALF, -0.75, -WORLD_HALF, WORLD_SIZE, 0.75, WORLD_SIZE, [0.88, 0.96, 0.82, 1.0], TEXTURE_IDS.grass, 0.9);
}

function drawTile(cellX, cellZ, color, textureNum, texWeight, height, inset) {
  const padding = inset || 0;
  const matrix = new Matrix4();
  matrix.translate(cellToWorld(cellX) + padding, height, cellToWorld(cellZ) + padding);
  matrix.scale(1 - padding * 2, 0.08, 1 - padding * 2);
  drawCube(matrix, color, textureNum, texWeight);
}

function renderPathsAndWater() {
  for (let x = 2; x <= 23; x += 1) {
    drawTile(x, 27, [0.91, 0.8, 0.61, 1.0], TEXTURE_IDS.plank, 0.78, 0.01, 0.08);
  }

  for (let z = 16; z <= 27; z += 1) {
    drawTile(23, z, [0.91, 0.8, 0.61, 1.0], TEXTURE_IDS.plank, 0.78, 0.01, 0.08);
  }

  for (let x = 24; x <= 28; x += 1) {
    for (let z = 13; z <= 19; z += 1) {
      drawTile(x, z, [0.83, 0.72, 0.52, 1.0], TEXTURE_IDS.plank, 0.85, 0.01, 0.06);
    }
  }

  drawBox(
    cellToWorld(12) + 0.02,
    0.02,
    cellToWorld(22) + 0.02,
    3.96,
    0.08,
    3.96,
    [0.96, 0.99, 1.0, 0.94],
    TEXTURE_IDS.water,
    0.98
  );
}

function getWallTexture(x, z) {
  if (x >= 23 && x <= 29 && z >= 12 && z <= 20) {
    return TEXTURE_IDS.plank;
  }

  return TEXTURE_IDS.stone;
}

function getWallColor(x, z, y) {
  if (x >= 23 && x <= 29 && z >= 12 && z <= 20) {
    return y === 0 ? [0.84, 0.7, 0.49, 1.0] : [0.79, 0.64, 0.43, 1.0];
  }

  return y === 0 ? [0.86, 0.89, 0.93, 1.0] : [0.75, 0.78, 0.84, 1.0];
}

function renderWorldBlocks() {
  for (let z = 0; z < WORLD_SIZE; z += 1) {
    for (let x = 0; x < WORLD_SIZE; x += 1) {
      const columnHeight = g_worldMap[z][x];
      if (columnHeight <= 0) {
        continue;
      }

      for (let y = 0; y < columnHeight; y += 1) {
        const matrix = new Matrix4();
        matrix.translate(cellToWorld(x), y, cellToWorld(z));
        drawCube(matrix, getWallColor(x, z, y), getWallTexture(x, z), 0.92);
      }
    }
  }
}

function renderAppleModel(baseX, baseY, baseZ, faded) {
  const bodyColor = faded ? [0.83, 0.88, 0.67, 0.45] : [0.86, 0.16, 0.12, 1.0];
  const bodySide = faded ? [0.79, 0.86, 0.61, 0.42] : [0.79, 0.12, 0.1, 1.0];
  const stemColor = faded ? [0.62, 0.49, 0.3, 0.4] : [0.45, 0.28, 0.12, 1.0];
  const leafColor = faded ? [0.69, 0.84, 0.54, 0.4] : [0.31, 0.68, 0.24, 1.0];

  drawBox(baseX + 0.25, baseY + 0.02, baseZ + 0.24, 0.32, 0.26, 0.32, bodyColor, -1, 0.0);
  drawBox(baseX + 0.18, baseY + 0.08, baseZ + 0.29, 0.12, 0.14, 0.22, bodySide, -1, 0.0);
  drawBox(baseX + 0.52, baseY + 0.08, baseZ + 0.29, 0.12, 0.14, 0.22, bodySide, -1, 0.0);
  drawBox(baseX + 0.32, baseY + 0.17, baseZ + 0.18, 0.18, 0.12, 0.12, bodySide, -1, 0.0);
  drawBox(baseX + 0.39, baseY + 0.28, baseZ + 0.35, 0.05, 0.14, 0.05, stemColor, -1, 0.0);
  drawBox(baseX + 0.43, baseY + 0.36, baseZ + 0.3, 0.14, 0.05, 0.1, leafColor, -1, 0.0);
}

function renderAppleStand(apple) {
  const x = cellToWorld(apple.x);
  const z = cellToWorld(apple.z);
  drawBox(x + 0.18, 0.0, z + 0.18, 0.64, 0.2, 0.64, [0.82, 0.7, 0.5, 1.0], TEXTURE_IDS.plank, 0.86);
  drawBox(x + 0.34, 0.2, z + 0.34, 0.32, 0.82, 0.32, [0.76, 0.62, 0.41, 1.0], TEXTURE_IDS.plank, 0.8);
  drawBox(x + 0.22, 0.96, z + 0.22, 0.56, 0.12, 0.56, [0.86, 0.76, 0.54, 1.0], TEXTURE_IDS.plank, 0.82);
  renderAppleModel(x + 0.04, 1.07, z + 0.04, apple.collected);
}

function renderApples() {
  for (let i = 0; i < g_apples.length; i += 1) {
    renderAppleStand(g_apples[i]);
  }
}

function renderMiniApple(baseX, baseY, baseZ) {
  drawBox(baseX + 0.03, baseY + 0.02, baseZ + 0.03, 0.18, 0.14, 0.18, [0.86, 0.16, 0.12, 1.0], -1, 0.0);
  drawBox(baseX + 0.1, baseY + 0.15, baseZ + 0.1, 0.025, 0.07, 0.025, [0.45, 0.28, 0.12, 1.0], -1, 0.0);
  drawBox(baseX + 0.12, baseY + 0.18, baseZ + 0.06, 0.075, 0.025, 0.05, [0.31, 0.68, 0.24, 1.0], -1, 0.0);
}

function renderMiniCarrot(baseX, baseY, baseZ) {
  drawBox(baseX + 0.02, baseY + 0.02, baseZ + 0.05, 0.24, 0.06, 0.06, [0.93, 0.49, 0.14, 1.0], -1, 0.0);
  drawBox(baseX + 0.22, baseY + 0.035, baseZ + 0.065, 0.065, 0.035, 0.035, [0.98, 0.64, 0.24, 1.0], -1, 0.0);
  drawBox(baseX + 0.0, baseY + 0.07, baseZ + 0.035, 0.05, 0.06, 0.09, [0.31, 0.68, 0.24, 1.0], -1, 0.0);
}

function renderProduceBasket(baseX, baseY, baseZ) {
  const basketColor = [0.82, 0.66, 0.42, 1.0];
  drawBox(baseX, baseY, baseZ, 1.2, 0.16, 0.84, basketColor, TEXTURE_IDS.plank, 0.82);
  drawBox(baseX, baseY + 0.16, baseZ, 0.1, 0.28, 0.84, basketColor, TEXTURE_IDS.plank, 0.82);
  drawBox(baseX + 1.1, baseY + 0.16, baseZ, 0.1, 0.28, 0.84, basketColor, TEXTURE_IDS.plank, 0.82);
  drawBox(baseX + 0.1, baseY + 0.16, baseZ, 1.0, 0.22, 0.1, basketColor, TEXTURE_IDS.plank, 0.82);
  drawBox(baseX + 0.1, baseY + 0.16, baseZ + 0.74, 1.0, 0.22, 0.1, basketColor, TEXTURE_IDS.plank, 0.82);
  drawBox(baseX + 0.22, baseY + 0.38, baseZ + 0.12, 0.76, 0.06, 0.58, [0.9, 0.78, 0.56, 1.0], TEXTURE_IDS.plank, 0.72);

  renderMiniApple(baseX + 0.12, baseY + 0.35, baseZ + 0.12);
  renderMiniApple(baseX + 0.34, baseY + 0.37, baseZ + 0.34);
  renderMiniApple(baseX + 0.62, baseY + 0.34, baseZ + 0.16);
  renderMiniApple(baseX + 0.78, baseY + 0.36, baseZ + 0.42);
  renderMiniCarrot(baseX + 0.18, baseY + 0.36, baseZ + 0.5);
  renderMiniCarrot(baseX + 0.48, baseY + 0.38, baseZ + 0.44);
  renderMiniCarrot(baseX + 0.74, baseY + 0.35, baseZ + 0.58);
}

function renderPaddockProps() {
  drawBox(cellToWorld(27) + 0.16, 0.02, cellToWorld(14) + 0.14, 0.68, 0.28, 0.68, [0.87, 0.77, 0.45, 1.0], TEXTURE_IDS.plank, 0.7);
  drawBox(cellToWorld(27) + 0.95, 0.02, cellToWorld(18) + 0.18, 0.6, 0.24, 0.6, [0.87, 0.77, 0.45, 1.0], TEXTURE_IDS.plank, 0.7);
  drawBox(cellToWorld(25) + 0.2, 0.02, cellToWorld(18) + 0.1, 1.4, 0.24, 0.74, [0.42, 0.28, 0.18, 1.0], -1, 0.0);
  drawBox(cellToWorld(25) + 0.3, 0.18, cellToWorld(18) + 0.2, 1.18, 0.11, 0.54, [0.96, 0.99, 1.0, 0.92], TEXTURE_IDS.water, 0.96);
  renderProduceBasket(cellToWorld(26) + 0.66, 0.06, cellToWorld(14) + 0.76);

  const gateBaseX = cellToWorld(24) - 0.18;
  const gateBaseZ = cellToWorld(16);

  drawBox(gateBaseX, 0.0, gateBaseZ - 0.1, 0.32, 4.85, 0.34, [0.73, 0.24, 0.16, 1.0], -1, 0.0);
  drawBox(gateBaseX, 0.0, gateBaseZ + 1.8, 0.32, 4.85, 0.34, [0.73, 0.24, 0.16, 1.0], -1, 0.0);
  drawBox(gateBaseX - 0.12, 4.48, gateBaseZ - 0.16, 0.56, 0.34, 2.4, [0.94, 0.76, 0.28, 1.0], -1, 0.0);
  drawBox(gateBaseX - 0.03, 3.86, gateBaseZ + 0.08, 0.34, 0.2, 1.82, [0.84, 0.64, 0.19, 1.0], -1, 0.0);

  drawBox(gateBaseX - 0.16, 0.08, gateBaseZ - 0.24, 0.54, 0.18, 0.54, [0.89, 0.8, 0.59, 1.0], TEXTURE_IDS.plank, 0.72);
  drawBox(gateBaseX - 0.16, 0.08, gateBaseZ + 1.66, 0.54, 0.18, 0.54, [0.89, 0.8, 0.59, 1.0], TEXTURE_IDS.plank, 0.72);

  if (!g_gateOpened) {
    drawBox(gateBaseX, 0.22, gateBaseZ + 0.06, 0.11, 3.55, 0.86, [0.55, 0.21, 0.15, 1.0], -1, 0.0);
    drawBox(gateBaseX, 0.22, gateBaseZ + 1.1, 0.11, 3.55, 0.86, [0.55, 0.21, 0.15, 1.0], -1, 0.0);
    drawBox(gateBaseX + 0.02, 3.34, gateBaseZ + 0.14, 0.05, 0.12, 1.72, [0.95, 0.78, 0.32, 1.0], -1, 0.0);
    drawBox(gateBaseX + 0.02, 1.62, gateBaseZ + 0.14, 0.05, 0.12, 1.72, [0.95, 0.78, 0.32, 1.0], -1, 0.0);
  } else {
    drawBox(gateBaseX - 0.24, 4.9, gateBaseZ + 0.24, 0.78, 0.18, 1.56, [0.98, 0.87, 0.35, 0.94], -1, 0.0);
  }

  renderHorseAvatar({
    x: cellCenter(26),
    y: PLAYER_HORSE_Y,
    z: cellCenter(16),
    yaw: 180,
    seconds: g_seconds,
    isMoving: false,
    animationMode: isPlayerInBrownPaddockArea() ? 4 : 0,
    scale: 1.62,
    colors: CLOVER_NPC_COLORS
  });
}

function getPlayerHeadingDegrees() {
  const forward = getPlayerFlatForward();
  return Math.atan2(-forward.z, forward.x) * 180 / Math.PI;
}

function renderPlayerHorse() {
  if (g_viewMode === VIEW_MODES.first && !isExploreMode()) {
    return;
  }

  renderHorseAvatar({
    x: g_playerX,
    y: PLAYER_HORSE_Y,
    z: g_playerZ,
    yaw: getPlayerHeadingDegrees(),
    seconds: g_seconds,
    isMoving: g_playerIsMoving,
    animationMode: getPlayerAnimationMode(),
    scale: 1.62
  });
}

function getRaceViewMatrix() {
  const raceView = new Matrix4();
  raceView.setLookAt(0, 26.5, 0, 0, 0, 0, 0, 0, -1);
  return raceView;
}

function renderRaceTrackBase() {
  const trackLength = (RACE_TRACK_FINISH_X - RACE_TRACK_START_X) + 2.6;
  const meadowPadding = 7.0;
  drawBox(
    RACE_TRACK_START_X - meadowPadding,
    -0.75,
    -11.5,
    trackLength + (meadowPadding * 2),
    0.75,
    23.0,
    [0.9, 0.97, 0.87, 1.0],
    TEXTURE_IDS.grass,
    0.88
  );
  drawBox(RACE_TRACK_START_X - 1.3, 0.0, -4.6, trackLength, 0.18, 9.2, [0.78, 0.68, 0.55, 1.0], TEXTURE_IDS.plank, 0.84);
  drawBox(RACE_TRACK_START_X - 1.3, 0.16, -0.18, trackLength, 0.02, 0.36, [0.97, 0.95, 0.82, 1.0], -1, 0.0);
  drawBox(RACE_TRACK_START_X - 1.3, 0.16, -4.1, trackLength, 0.02, 0.24, [0.62, 0.44, 0.25, 1.0], -1, 0.0);
  drawBox(RACE_TRACK_START_X - 1.3, 0.16, 3.86, trackLength, 0.02, 0.24, [0.62, 0.44, 0.25, 1.0], -1, 0.0);

  const stripeCount = Math.ceil(trackLength / 2.2);
  for (let i = 0; i < stripeCount; i += 1) {
    const stripeX = RACE_TRACK_START_X - 0.5 + i * 2.2;
    drawBox(stripeX, 0.17, -0.1, 0.9, 0.02, 0.16, [0.99, 0.99, 0.94, 1.0], -1, 0.0);
  }
}

function renderRaceTrackFinishLine() {
  drawBox(RACE_TRACK_FINISH_X + 0.18, 0.22, -4.55, 0.16, 3.1, 0.3, [0.92, 0.29, 0.25, 1.0], -1, 0.0);
  drawBox(RACE_TRACK_FINISH_X + 0.18, 0.22, 4.25, 0.16, 3.1, 0.3, [0.92, 0.29, 0.25, 1.0], -1, 0.0);
  drawBox(RACE_TRACK_FINISH_X + 0.02, 3.08, -4.55, 0.48, 0.22, 9.1, [0.98, 0.86, 0.34, 1.0], -1, 0.0);

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      drawBox(
        RACE_TRACK_FINISH_X + row * 0.16,
        0.18,
        -3.2 + col * 1.05,
        0.16,
        0.02,
        1.05,
        (row + col) % 2 === 0 ? [0.12, 0.12, 0.12, 1.0] : [0.98, 0.98, 0.96, 1.0],
        -1,
        0.0
      );
    }
  }
}

function renderRaceTrackHurdles() {
  for (let i = 0; i < RACE_TRACK_HURDLE_XS.length; i += 1) {
    for (let lane = 0; lane < 2; lane += 1) {
      const laneZ = getRaceLaneZ(lane);
      drawBox(RACE_TRACK_HURDLE_XS[i] - 0.16, RACE_TRACK_BASE_Y, laneZ - 0.82, 0.32, 0.62, 1.64, [0.9, 0.4, 0.22, 1.0], -1, 0.0);
      drawBox(RACE_TRACK_HURDLE_XS[i] - 0.06, RACE_TRACK_BASE_Y + 0.62, laneZ - 0.82, 0.12, 0.2, 1.64, [0.98, 0.86, 0.36, 1.0], -1, 0.0);
      drawBox(RACE_TRACK_HURDLE_XS[i] - 0.3, 0.18, laneZ - 0.86, 0.6, 0.02, 1.72, [0.62, 0.27, 0.14, 0.55], -1, 0.0);
    }
  }
}

function renderRaceHorse(horse) {
  if (!horse) {
    return;
  }

  renderHorseAvatar({
    x: horse.x,
    y: PLAYER_HORSE_Y + horse.jumpOffset,
    z: horse.laneZ,
    yaw: 0,
    seconds: g_seconds,
    isMoving: horse.moving,
    animationMode: horse.jumpOffset > 0.1 ? 4 : (horse.moving ? 1 : 0),
    scale: 1.04,
    colors: horse.colors
  });
}

function drawCenteredRainbowNatureBox(baseMatrix, cx, cy, cz, sx, sy, sz, color, yaw, pitch, roll) {
  const box = new Matrix4(baseMatrix);
  box.translate(cx, cy, cz);

  if (yaw) {
    box.rotate(yaw, 0, 1, 0);
  }
  if (pitch) {
    box.rotate(pitch, 1, 0, 0);
  }
  if (roll) {
    box.rotate(roll, 0, 0, 1);
  }

  box.translate(-sx * 0.5, 0.0, -sz * 0.5);
  box.scale(sx, sy, sz);
  drawCube(box, color, -1, 0.0);
}

function drawCenteredRainbowCone(baseMatrix, cx, cy, cz, sx, sy, sz, color, segments, yaw, pitch, roll) {
  const coneMatrix = new Matrix4(baseMatrix);
  coneMatrix.translate(cx, cy, cz);

  if (yaw) {
    coneMatrix.rotate(yaw, 0, 1, 0);
  }
  if (pitch) {
    coneMatrix.rotate(pitch, 1, 0, 0);
  }
  if (roll) {
    coneMatrix.rotate(roll, 0, 0, 1);
  }

  coneMatrix.translate(-sx * 0.5, 0.0, -sz * 0.5);
  coneMatrix.scale(sx, sy, sz);
  drawCone(coneMatrix, color, segments);
}

function drawCenteredLongDiamond(baseMatrix, cx, cy, cz, sx, sy, sz, color, yaw, pitch, roll) {
  const diamondMatrix = new Matrix4(baseMatrix);
  diamondMatrix.translate(cx, cy, cz);

  if (yaw) {
    diamondMatrix.rotate(yaw, 0, 1, 0);
  }
  if (pitch) {
    diamondMatrix.rotate(pitch, 1, 0, 0);
  }
  if (roll) {
    diamondMatrix.rotate(roll, 0, 0, 1);
  }

  diamondMatrix.scale(sx, sy, sz);
  drawLongDiamond(diamondMatrix, color);
}

function drawCenteredRainbowSphere(baseMatrix, cx, cy, cz, sx, sy, sz, color, yaw, pitch, roll) {
  const sphereMatrix = new Matrix4(baseMatrix);
  sphereMatrix.translate(cx, cy, cz);

  if (yaw) {
    sphereMatrix.rotate(yaw, 0, 1, 0);
  }
  if (pitch) {
    sphereMatrix.rotate(pitch, 1, 0, 0);
  }
  if (roll) {
    sphereMatrix.rotate(roll, 0, 0, 1);
  }

  sphereMatrix.translate(-sx * 0.5, -sy * 0.5, -sz * 0.5);
  sphereMatrix.scale(sx, sy, sz);
  drawSphere(sphereMatrix, color);
}

function renderRainbowVineChain(baseMatrix, cx, topY, cz, segments, step, color, sway) {
  for (let i = 0; i < segments; i += 1) {
    const xOffset = Math.sin(i * 0.55) * 0.025 * sway;
    const zOffset = Math.cos(i * 0.45) * 0.018 * sway;
    drawCenteredRainbowNatureBox(
      baseMatrix,
      cx + xOffset,
      topY - i * step,
      cz + zOffset,
      0.05,
      step,
      0.05,
      color,
      0,
      0,
      sway * (i % 2 === 0 ? 5 : -5)
    );
  }
}

function renderRainbowLeafCluster(baseMatrix, cx, cy, cz, sx, sy, sz, color, vineSpecs) {
  drawCenteredRainbowNatureBox(baseMatrix, cx, cy, cz, sx, sy, sz, color, 0, 0, 0);

  if (!vineSpecs) {
    return;
  }

  for (let i = 0; i < vineSpecs.length; i += 1) {
    const vine = vineSpecs[i];
    renderRainbowVineChain(
      baseMatrix,
      cx + vine[0],
      cy + vine[1],
      cz + vine[2],
      vine[3],
      vine[4],
      vine[5],
      vine[6]
    );
  }
}

function renderRainbowBlockPath(baseMatrix, points, thickness, color) {
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
    const span = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
    const steps = Math.max(1, Math.ceil(span / Math.max(0.06, thickness * 0.78)));

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      drawCenteredRainbowNatureBox(
        baseMatrix,
        start[0] + dx * t,
        start[1] + dy * t,
        start[2] + dz * t,
        thickness,
        thickness,
        thickness,
        color,
        0,
        0,
        0
      );
    }
  }
}

function renderRainbowStemPath(baseMatrix, points, thickness, color) {
  renderRainbowBlockPath(baseMatrix, points, thickness, color);
}

function renderRainbowTree(x, z, scale) {
  const barkDark = [0.39, 0.24, 0.12, 1.0];
  const barkMid = [0.52, 0.33, 0.17, 1.0];
  const barkLight = [0.63, 0.43, 0.22, 1.0];
  const leafA = [0.36, 0.62, 0.25, 1.0];
  const leafB = [0.46, 0.74, 0.32, 1.0];
  const leafC = [0.58, 0.82, 0.42, 1.0];
  const vineColor = [0.54, 0.78, 0.34, 1.0];
  const base = new Matrix4();
  base.translate(x, 0.0, z);

  drawCenteredRainbowNatureBox(base, -0.08 * scale, 0.0, 0.0, 0.42 * scale, 1.7 * scale, 0.42 * scale, barkDark, 0, 0, 6);
  drawCenteredRainbowNatureBox(base, 0.02 * scale, 1.35 * scale, 0.0, 0.36 * scale, 1.2 * scale, 0.36 * scale, barkMid, 0, 0, -10);
  drawCenteredRainbowNatureBox(base, 0.16 * scale, 2.26 * scale, -0.04 * scale, 0.28 * scale, 1.02 * scale, 0.28 * scale, barkLight, 0, 0, 10);

  drawCenteredRainbowNatureBox(base, -0.38 * scale, 0.0, 0.2 * scale, 0.15 * scale, 0.72 * scale, 0.15 * scale, barkDark, 0, 0, 30);
  drawCenteredRainbowNatureBox(base, 0.34 * scale, 0.0, 0.22 * scale, 0.15 * scale, 0.8 * scale, 0.15 * scale, barkDark, 0, 0, -28);
  drawCenteredRainbowNatureBox(base, -0.24 * scale, 0.0, -0.28 * scale, 0.14 * scale, 0.62 * scale, 0.14 * scale, barkMid, 0, 0, 18);
  drawCenteredRainbowNatureBox(base, 0.22 * scale, 0.0, -0.24 * scale, 0.14 * scale, 0.66 * scale, 0.14 * scale, barkMid, 0, 0, -20);

  renderRainbowBlockPath(base, [
    [-0.08 * scale, 0.04 * scale, 0.0],
    [-0.04 * scale, 0.48 * scale, 0.02 * scale],
    [0.0, 0.98 * scale, 0.0],
    [0.02 * scale, 1.54 * scale, 0.0],
    [0.06 * scale, 2.36 * scale, -0.02 * scale]
  ], 0.2 * scale, barkDark);
  renderRainbowBlockPath(base, [
    [-0.08 * scale, 0.16 * scale, 0.0],
    [-0.24 * scale, 0.34 * scale, 0.14 * scale],
    [-0.38 * scale, 0.52 * scale, 0.2 * scale]
  ], 0.14 * scale, barkDark);
  renderRainbowBlockPath(base, [
    [-0.02 * scale, 0.18 * scale, 0.0],
    [0.16 * scale, 0.38 * scale, 0.14 * scale],
    [0.34 * scale, 0.58 * scale, 0.22 * scale]
  ], 0.14 * scale, barkDark);
  renderRainbowBlockPath(base, [
    [-0.1 * scale, 0.16 * scale, -0.04 * scale],
    [-0.18 * scale, 0.32 * scale, -0.14 * scale],
    [-0.24 * scale, 0.5 * scale, -0.28 * scale]
  ], 0.13 * scale, barkMid);
  renderRainbowBlockPath(base, [
    [0.0, 0.18 * scale, -0.02 * scale],
    [0.12 * scale, 0.34 * scale, -0.12 * scale],
    [0.22 * scale, 0.54 * scale, -0.24 * scale]
  ], 0.13 * scale, barkMid);

  renderRainbowBlockPath(base, [
    [0.06 * scale, 2.36 * scale, -0.02 * scale],
    [-0.12 * scale, 2.6 * scale, -0.06 * scale],
    [-0.34 * scale, 2.82 * scale, -0.12 * scale],
    [-0.56 * scale, 2.98 * scale, -0.18 * scale],
    [-0.72 * scale, 3.08 * scale, -0.22 * scale]
  ], 0.16 * scale, barkMid);
  renderRainbowBlockPath(base, [
    [0.1 * scale, 2.54 * scale, 0.02 * scale],
    [0.26 * scale, 2.76 * scale, 0.04 * scale],
    [0.42 * scale, 2.9 * scale, 0.06 * scale],
    [0.58 * scale, 2.98 * scale, 0.06 * scale]
  ], 0.15 * scale, barkLight);
  renderRainbowBlockPath(base, [
    [0.14 * scale, 2.88 * scale, 0.12 * scale],
    [0.12 * scale, 3.2 * scale, 0.18 * scale],
    [0.0, 3.56 * scale, 0.22 * scale],
    [-0.12 * scale, 3.88 * scale, 0.18 * scale]
  ], 0.13 * scale, barkLight);
  renderRainbowBlockPath(base, [
    [0.14 * scale, 3.28 * scale, 0.02 * scale],
    [0.18 * scale, 3.74 * scale, -0.04 * scale],
    [0.18 * scale, 4.12 * scale, -0.08 * scale]
  ], 0.11 * scale, barkLight);

  renderRainbowLeafCluster(base, -0.72 * scale, 3.08 * scale, -0.22 * scale, 1.22 * scale, 0.54 * scale, 1.0 * scale, leafA, [
    [-0.44 * scale, 0.08 * scale, -0.12 * scale, 5, 0.15 * scale, vineColor, -1],
    [0.42 * scale, 0.12 * scale, 0.2 * scale, 6, 0.14 * scale, vineColor, 1]
  ]);
  renderRainbowLeafCluster(base, 0.08 * scale, 3.32 * scale, -0.52 * scale, 1.04 * scale, 0.5 * scale, 0.96 * scale, leafB, [
    [-0.28 * scale, 0.04 * scale, -0.18 * scale, 6, 0.15 * scale, vineColor, -1],
    [0.24 * scale, 0.06 * scale, 0.12 * scale, 5, 0.13 * scale, vineColor, 1]
  ]);
  renderRainbowLeafCluster(base, 0.58 * scale, 2.98 * scale, 0.06 * scale, 1.02 * scale, 0.5 * scale, 0.9 * scale, leafC, [
    [-0.22 * scale, 0.06 * scale, 0.22 * scale, 5, 0.13 * scale, vineColor, -1],
    [0.3 * scale, 0.04 * scale, -0.14 * scale, 6, 0.15 * scale, vineColor, 1]
  ]);
  renderRainbowLeafCluster(base, -0.12 * scale, 3.88 * scale, 0.18 * scale, 1.1 * scale, 0.56 * scale, 1.02 * scale, leafB, [
    [-0.34 * scale, 0.0, 0.12 * scale, 6, 0.14 * scale, vineColor, -1],
    [0.26 * scale, 0.08 * scale, -0.16 * scale, 5, 0.13 * scale, vineColor, 1]
  ]);
  renderRainbowLeafCluster(base, 0.18 * scale, 4.28 * scale, -0.1 * scale, 0.84 * scale, 0.46 * scale, 0.78 * scale, leafC, [
    [-0.18 * scale, 0.02 * scale, 0.0, 4, 0.13 * scale, vineColor, -1],
    [0.16 * scale, 0.02 * scale, 0.0, 4, 0.13 * scale, vineColor, 1]
  ]);
}

function renderRainbowLeafTree(x, z, scale) {
  const barkDark = [0.47, 0.26, 0.14, 1.0];
  const barkMid = [0.61, 0.36, 0.2, 1.0];
  const barkLight = [0.72, 0.46, 0.28, 1.0];
  const leafA = [0.52, 0.76, 0.34, 1.0];
  const leafB = [0.62, 0.83, 0.43, 1.0];
  const leafC = [0.73, 0.9, 0.52, 1.0];
  const vineColor = [0.64, 0.84, 0.4, 1.0];
  const base = new Matrix4();
  base.translate(x, 0.0, z);

  drawCenteredRainbowNatureBox(base, -0.24 * scale, 0.0, 0.04 * scale, 0.5 * scale, 1.42 * scale, 0.5 * scale, barkDark, 0, 0, 22);
  drawCenteredRainbowNatureBox(base, 0.12 * scale, 1.06 * scale, 0.04 * scale, 0.42 * scale, 1.18 * scale, 0.42 * scale, barkMid, 0, 0, -22);
  drawCenteredRainbowNatureBox(base, 0.7 * scale, 1.92 * scale, 0.08 * scale, 0.34 * scale, 1.36 * scale, 0.34 * scale, barkLight, 0, 0, 52);
  drawCenteredRainbowNatureBox(base, -0.58 * scale, 0.0, 0.36 * scale, 0.16 * scale, 0.72 * scale, 0.16 * scale, barkDark, 0, 0, 34);
  drawCenteredRainbowNatureBox(base, 0.38 * scale, 0.0, 0.32 * scale, 0.16 * scale, 0.64 * scale, 0.16 * scale, barkDark, 0, 0, -30);
  drawCenteredRainbowNatureBox(base, -0.02 * scale, 0.0, -0.34 * scale, 0.14 * scale, 0.58 * scale, 0.14 * scale, barkMid, 0, 0, -14);

  renderRainbowBlockPath(base, [
    [-0.16 * scale, 0.04 * scale, 0.04 * scale],
    [-0.08 * scale, 0.46 * scale, 0.06 * scale],
    [0.0, 0.98 * scale, 0.05 * scale],
    [0.08 * scale, 1.5 * scale, 0.04 * scale],
    [0.18 * scale, 1.9 * scale, 0.04 * scale]
  ], 0.22 * scale, barkDark);
  renderRainbowBlockPath(base, [
    [-0.18 * scale, 0.16 * scale, 0.08 * scale],
    [-0.36 * scale, 0.34 * scale, 0.2 * scale],
    [-0.58 * scale, 0.52 * scale, 0.36 * scale]
  ], 0.14 * scale, barkDark);
  renderRainbowBlockPath(base, [
    [-0.04 * scale, 0.16 * scale, 0.08 * scale],
    [0.16 * scale, 0.34 * scale, 0.2 * scale],
    [0.38 * scale, 0.5 * scale, 0.32 * scale]
  ], 0.14 * scale, barkDark);
  renderRainbowBlockPath(base, [
    [-0.1 * scale, 0.16 * scale, 0.0],
    [-0.08 * scale, 0.32 * scale, -0.14 * scale],
    [-0.02 * scale, 0.46 * scale, -0.34 * scale]
  ], 0.13 * scale, barkMid);

  renderRainbowBlockPath(base, [
    [0.18 * scale, 1.9 * scale, 0.04 * scale],
    [0.42 * scale, 2.16 * scale, 0.04 * scale],
    [0.72 * scale, 2.42 * scale, 0.02 * scale],
    [1.06 * scale, 2.62 * scale, 0.0]
  ], 0.16 * scale, barkLight);
  renderRainbowBlockPath(base, [
    [0.12 * scale, 1.82 * scale, -0.04 * scale],
    [0.32 * scale, 2.1 * scale, -0.18 * scale],
    [0.54 * scale, 2.3 * scale, -0.34 * scale],
    [0.76 * scale, 2.44 * scale, -0.52 * scale]
  ], 0.14 * scale, barkMid);
  renderRainbowBlockPath(base, [
    [-0.04 * scale, 1.82 * scale, 0.08 * scale],
    [-0.24 * scale, 2.1 * scale, 0.14 * scale],
    [-0.54 * scale, 2.42 * scale, 0.18 * scale],
    [-0.92 * scale, 2.78 * scale, 0.18 * scale]
  ], 0.15 * scale, barkMid);

  renderRainbowLeafCluster(base, 0.08 * scale, 3.16 * scale, 0.12 * scale, 1.98 * scale, 0.58 * scale, 1.54 * scale, leafA, [
    [-0.84 * scale, 0.04 * scale, -0.4 * scale, 9, 0.15 * scale, vineColor, -1],
    [-0.42 * scale, 0.02 * scale, 0.5 * scale, 8, 0.15 * scale, vineColor, -1],
    [0.46 * scale, 0.06 * scale, -0.34 * scale, 8, 0.14 * scale, vineColor, 1],
    [0.8 * scale, 0.04 * scale, 0.42 * scale, 9, 0.15 * scale, vineColor, 1]
  ]);
  renderRainbowLeafCluster(base, 0.82 * scale, 2.82 * scale, 0.0, 1.42 * scale, 0.5 * scale, 1.18 * scale, leafB, [
    [-0.5 * scale, 0.0, -0.22 * scale, 7, 0.14 * scale, vineColor, -1],
    [0.32 * scale, 0.02 * scale, 0.26 * scale, 8, 0.14 * scale, vineColor, 1]
  ]);
  renderRainbowLeafCluster(base, -0.92 * scale, 2.78 * scale, 0.18 * scale, 1.28 * scale, 0.46 * scale, 1.1 * scale, leafB, [
    [-0.34 * scale, 0.0, 0.1 * scale, 7, 0.14 * scale, vineColor, -1],
    [0.28 * scale, 0.0, -0.2 * scale, 6, 0.13 * scale, vineColor, 1]
  ]);
  renderRainbowLeafCluster(base, 1.46 * scale, 3.02 * scale, 0.0, 1.0 * scale, 0.42 * scale, 0.9 * scale, leafC, [
    [-0.24 * scale, 0.0, 0.0, 6, 0.13 * scale, vineColor, -1],
    [0.2 * scale, 0.0, 0.1 * scale, 6, 0.13 * scale, vineColor, 1]
  ]);
}

function renderRainbowTulipHead(baseMatrix, cx, cy, cz, scale, petalColor, innerColor) {
  drawCenteredRainbowNatureBox(baseMatrix, cx, cy, cz, 0.18 * scale, 0.13 * scale, 0.18 * scale, innerColor, 0, 0, 0);
  drawCenteredRainbowNatureBox(baseMatrix, cx - 0.11 * scale, cy + 0.03 * scale, cz, 0.12 * scale, 0.28 * scale, 0.1 * scale, petalColor, 0, 0, -12);
  drawCenteredRainbowNatureBox(baseMatrix, cx + 0.11 * scale, cy + 0.03 * scale, cz, 0.12 * scale, 0.28 * scale, 0.1 * scale, petalColor, 0, 0, 12);
  drawCenteredRainbowNatureBox(baseMatrix, cx, cy + 0.04 * scale, cz - 0.11 * scale, 0.1 * scale, 0.26 * scale, 0.12 * scale, petalColor, 0, 12, 0);
  drawCenteredRainbowNatureBox(baseMatrix, cx, cy + 0.04 * scale, cz + 0.11 * scale, 0.1 * scale, 0.26 * scale, 0.12 * scale, petalColor, 0, -12, 0);
  drawCenteredRainbowNatureBox(baseMatrix, cx, cy + 0.11 * scale, cz, 0.14 * scale, 0.24 * scale, 0.14 * scale, petalColor, 0, 0, 0);
}

function renderRainbowFlower(x, z, scale, petalColor, innerColor) {
  const stemColor = [0.43, 0.61, 0.18, 1.0];
  const leafColor = [0.55, 0.74, 0.26, 1.0];
  const base = new Matrix4();
  base.translate(x, 0.0, z);

  const stems = [
    { x: -0.22, z: -0.02, topY: 0.9, bendX: -0.18, bendZ: -0.02 },
    { x: 0.0, z: 0.0, topY: 1.08, bendX: 0.0, bendZ: 0.0 },
    { x: 0.22, z: 0.02, topY: 0.86, bendX: 0.18, bendZ: 0.02 }
  ];

  for (let i = 0; i < stems.length; i += 1) {
    const stem = stems[i];
    const offsetX = stem.x * scale;
    const offsetZ = stem.z * scale;
    const topY = stem.topY * scale;
    const bendX = stem.bendX * scale;
    const bendZ = stem.bendZ * scale;
    const leafSign = i === 1 ? 1 : (i === 0 ? -1 : 1);

    renderRainbowStemPath(base, [
      [offsetX, 0.0, offsetZ],
      [offsetX, topY * 0.34, offsetZ],
      [bendX, topY * 0.7, bendZ],
      [bendX, topY, bendZ]
    ], 0.075 * scale, stemColor);

    drawCenteredRainbowNatureBox(base, offsetX + 0.12 * leafSign * scale, topY * 0.32, offsetZ, 0.18 * scale, 0.05 * scale, 0.08 * scale, leafColor, 0, 0, 20 * leafSign);
    drawCenteredRainbowNatureBox(base, bendX - 0.1 * leafSign * scale, topY * 0.56, bendZ, 0.16 * scale, 0.05 * scale, 0.08 * scale, leafColor, 0, 0, -16 * leafSign);
    renderRainbowTulipHead(base, bendX, topY, bendZ, 0.92 * scale, petalColor, innerColor);
  }
}

function renderRainbowBellBloom(baseMatrix, cx, cy, cz, scale, petalColor, innerColor) {
  drawCenteredRainbowNatureBox(baseMatrix, cx, cy + 0.07 * scale, cz, 0.16 * scale, 0.12 * scale, 0.16 * scale, petalColor, 0, 0, 0);
  drawCenteredRainbowNatureBox(baseMatrix, cx, cy - 0.03 * scale, cz, 0.26 * scale, 0.18 * scale, 0.26 * scale, petalColor, 0, 0, 0);
  drawCenteredRainbowNatureBox(baseMatrix, cx, cy - 0.17 * scale, cz, 0.36 * scale, 0.2 * scale, 0.36 * scale, petalColor, 0, 0, 0);
  drawCenteredRainbowNatureBox(baseMatrix, cx - 0.19 * scale, cy - 0.17 * scale, cz, 0.12 * scale, 0.12 * scale, 0.12 * scale, petalColor, 0, 0, -12);
  drawCenteredRainbowNatureBox(baseMatrix, cx + 0.19 * scale, cy - 0.17 * scale, cz, 0.12 * scale, 0.12 * scale, 0.12 * scale, petalColor, 0, 0, 12);
  drawCenteredRainbowNatureBox(baseMatrix, cx, cy - 0.24 * scale, cz, 0.14 * scale, 0.2 * scale, 0.14 * scale, innerColor, 0, 0, 0);
  drawCenteredRainbowNatureBox(baseMatrix, cx, cy - 0.38 * scale, cz, 0.04 * scale, 0.16 * scale, 0.04 * scale, [0.76, 0.56, 0.22, 1.0], 0, 0, 0);
}

function renderRainbowBellFlower(x, z, scale, petalColor, innerColor, leanDir) {
  const stemColor = [0.45, 0.59, 0.18, 1.0];
  const leafColor = [0.56, 0.72, 0.24, 1.0];
  const base = new Matrix4();
  base.translate(x, 0.0, z);

  renderRainbowStemPath(base, [
    [0.0, 0.0, 0.0],
    [0.0, 0.78 * scale, 0.0],
    [0.1 * leanDir * scale, 1.1 * scale, 0.0],
    [0.34 * leanDir * scale, 1.42 * scale, 0.0]
  ], 0.08 * scale, stemColor);
  renderRainbowStemPath(base, [
    [0.0, 0.72 * scale, 0.0],
    [-0.12 * leanDir * scale, 0.96 * scale, 0.02 * scale],
    [-0.26 * leanDir * scale, 1.16 * scale, 0.02 * scale]
  ], 0.065 * scale, stemColor);

  drawCenteredRainbowNatureBox(base, 0.08 * leanDir * scale, 0.46 * scale, 0.0, 0.2 * scale, 0.05 * scale, 0.08 * scale, leafColor, 0, 0, 22 * leanDir);
  drawCenteredRainbowNatureBox(base, -0.12 * leanDir * scale, 0.78 * scale, 0.02 * scale, 0.18 * scale, 0.05 * scale, 0.08 * scale, leafColor, 0, 0, -18 * leanDir);
  drawCenteredRainbowNatureBox(base, 0.0, 0.08 * scale, 0.0, 0.18 * scale, 0.12 * scale, 0.18 * scale, [0.36, 0.48, 0.14, 1.0], 0, 0, 0);

  renderRainbowBellBloom(base, 0.42 * leanDir * scale, 1.46 * scale, 0.0, 0.88 * scale, petalColor, innerColor);
  renderRainbowBellBloom(base, -0.28 * leanDir * scale, 1.18 * scale, 0.02 * scale, 0.7 * scale, petalColor, innerColor);
}

function renderRainbowBush(x, z, scale, colorA, colorB) {
  drawBox(x - 0.42 * scale, 0.0, z - 0.34 * scale, 0.84 * scale, 0.26 * scale, 0.68 * scale, colorA, -1, 0.0);
  drawBox(x - 0.3 * scale, 0.2 * scale, z - 0.46 * scale, 0.6 * scale, 0.22 * scale, 0.92 * scale, colorB, -1, 0.0);
  drawBox(x - 0.54 * scale, 0.1 * scale, z - 0.18 * scale, 0.34 * scale, 0.2 * scale, 0.36 * scale, colorB, -1, 0.0);
  drawBox(x + 0.2 * scale, 0.12 * scale, z - 0.24 * scale, 0.34 * scale, 0.18 * scale, 0.42 * scale, colorB, -1, 0.0);
}

function renderRainbowGrassPatch(x, z, scale, yaw) {
  const clumpBase = new Matrix4();
  clumpBase.translate(x, 0.02, z);
  clumpBase.rotate(yaw, 0, 1, 0);
  renderFieldGrassClump(clumpBase, 0.0, 0.0, 0.0, scale, RAINBOW_GRASS_COLORS);
}

function renderResolvedRainbowFlowers(patches, maxDistance) {
  for (let i = 0; i < patches.length; i += 1) {
    if (!isRainbowDetailVisible(patches[i].x, patches[i].z, maxDistance)) {
      continue;
    }

    renderFlowerPatch(patches[i]);
  }
}

function renderRainbowOctagonLayer(baseMatrix, cx, cy, cz, width, depth, height, cornerSize, color) {
  const innerWidth = Math.max(0.04, width - cornerSize * 2);
  const innerDepth = Math.max(0.04, depth - cornerSize * 2);
  const cornerWidth = cornerSize * 1.2;
  const cornerOffsetX = width * 0.5 - cornerSize * 0.7;
  const cornerOffsetZ = depth * 0.5 - cornerSize * 0.7;

  drawCenteredRainbowNatureBox(baseMatrix, cx, cy, cz, innerWidth, height, depth, color, 0, 0, 0);
  drawCenteredRainbowNatureBox(baseMatrix, cx, cy, cz, width, height, innerDepth, color, 0, 0, 0);

  const cornerDirections = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1]
  ];

  for (let i = 0; i < cornerDirections.length; i += 1) {
    drawCenteredRainbowNatureBox(
      baseMatrix,
      cx + cornerDirections[i][0] * cornerOffsetX,
      cy,
      cz + cornerDirections[i][1] * cornerOffsetZ,
      cornerWidth,
      height,
      cornerWidth,
      color,
      45,
      0,
      0
    );
  }
}

function renderRainbowFountainWaterJet(baseMatrix, cx, bottomY, cz, height, width, color) {
  drawCenteredRainbowNatureBox(baseMatrix, cx, bottomY + height * 0.5, cz, width, height, width, color, 0, 0, 0);

  for (let i = 0; i < 3; i += 1) {
    const drift = Math.sin(g_seconds * 4.0 + cx * 7.0 + cz * 5.0 + i * 1.4) * 0.03;
    drawCenteredRainbowNatureBox(
      baseMatrix,
      cx + drift,
      bottomY + height * (0.18 + i * 0.3),
      cz - drift * 0.6,
      width * 0.85,
      width * 0.85,
      width * 0.85,
      [0.96, 0.99, 1.0, 0.58],
      0,
      0,
      0
    );
  }
}

function renderRainbowFountainMist(baseMatrix, cx, cy, cz, radiusX, radiusZ, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    const ripple = 0.82 + 0.16 * Math.sin(g_seconds * 3.2 + i * 0.7);
    const x = cx + Math.cos(angle) * radiusX * ripple;
    const z = cz + Math.sin(angle) * radiusZ * ripple;
    const y = cy + 0.05 * Math.sin(g_seconds * 4.8 + i * 0.9);
    drawCenteredRainbowNatureBox(
      baseMatrix,
      x,
      y,
      z,
      0.08,
      0.08,
      0.08,
      [0.93, 0.97, 1.0, 0.24],
      0,
      0,
      0
    );
  }
}

function renderRainbowFountainCornerOrnament(baseMatrix, cx, cz, scale, stoneBase, stoneShade) {
  drawCenteredRainbowNatureBox(baseMatrix, cx, 0.28 * scale, cz, 0.18 * scale, 0.12 * scale, 0.18 * scale, stoneShade, 0, 0, 0);
  drawCenteredRainbowNatureBox(baseMatrix, cx, 0.38 * scale, cz, 0.14 * scale, 0.08 * scale, 0.14 * scale, stoneBase, 0, 0, 0);
  drawCenteredRainbowCone(baseMatrix, cx, 0.46 * scale, cz, 0.16 * scale, 0.18 * scale, 0.16 * scale, stoneBase, 12, 0, 0, 0);
  drawCenteredRainbowCone(baseMatrix, cx, 0.62 * scale, cz, 0.08 * scale, 0.14 * scale, 0.08 * scale, stoneShade, 12, 0, 180, 0);
}

function renderRainbowFountain(centerX, centerZ, scale) {
  const stoneBase = [0.94, 0.92, 0.88, 1.0];
  const stoneShade = [0.84, 0.81, 0.76, 1.0];
  const stoneDark = [0.72, 0.69, 0.64, 1.0];
  const waterColor = [0.7, 0.9, 0.99, 0.56];
  const waterGlow = [0.91, 0.98, 1.0, 0.28];
  const base = new Matrix4();
  base.translate(centerX, 0.0, centerZ);

  renderRainbowOctagonLayer(base, 0.0, 0.07 * scale, 0.0, 2.1 * scale, 2.1 * scale, 0.16 * scale, 0.36 * scale, stoneDark);
  renderRainbowOctagonLayer(base, 0.0, 0.18 * scale, 0.0, 1.84 * scale, 1.84 * scale, 0.12 * scale, 0.32 * scale, stoneBase);
  renderRainbowOctagonLayer(base, 0.0, 0.28 * scale, 0.0, 1.58 * scale, 1.58 * scale, 0.12 * scale, 0.28 * scale, stoneShade);

  const ornamentOffsets = [
    [-0.96, -0.96],
    [0.96, -0.96],
    [-0.96, 0.96],
    [0.96, 0.96]
  ];
  for (let i = 0; i < ornamentOffsets.length; i += 1) {
    renderRainbowFountainCornerOrnament(base, ornamentOffsets[i][0] * scale, ornamentOffsets[i][1] * scale, scale, stoneBase, stoneShade);
  }

  renderRainbowOctagonLayer(base, 0.0, 0.44 * scale, 0.0, 0.82 * scale, 0.82 * scale, 0.46 * scale, 0.18 * scale, stoneShade);
  renderRainbowOctagonLayer(base, 0.0, 1.0 * scale, 0.0, 1.52 * scale, 1.52 * scale, 0.12 * scale, 0.26 * scale, stoneBase);
  renderRainbowOctagonLayer(base, 0.0, 1.1 * scale, 0.0, 1.34 * scale, 1.34 * scale, 0.1 * scale, 0.22 * scale, stoneShade);
  drawCenteredRainbowCone(base, 0.0, 0.58 * scale, 0.0, 1.24 * scale, 0.54 * scale, 1.24 * scale, stoneBase, 16, 0, 180, 0);
  drawCenteredRainbowNatureBox(base, 0.0, 1.14 * scale, 0.0, 1.02 * scale, 0.05 * scale, 1.02 * scale, waterColor, 0, 0, 0);

  renderRainbowOctagonLayer(base, 0.0, 1.34 * scale, 0.0, 0.5 * scale, 0.5 * scale, 0.48 * scale, 0.1 * scale, stoneShade);
  renderRainbowOctagonLayer(base, 0.0, 1.88 * scale, 0.0, 0.88 * scale, 0.88 * scale, 0.1 * scale, 0.16 * scale, stoneBase);
  renderRainbowOctagonLayer(base, 0.0, 1.96 * scale, 0.0, 0.74 * scale, 0.74 * scale, 0.08 * scale, 0.14 * scale, stoneShade);
  drawCenteredRainbowCone(base, 0.0, 1.56 * scale, 0.0, 0.66 * scale, 0.46 * scale, 0.66 * scale, stoneBase, 14, 0, 180, 0);
  drawCenteredRainbowNatureBox(base, 0.0, 1.99 * scale, 0.0, 0.48 * scale, 0.04 * scale, 0.48 * scale, waterColor, 0, 0, 0);

  drawCenteredRainbowNatureBox(base, 0.0, 2.12 * scale, 0.0, 0.1 * scale, 0.32 * scale, 0.1 * scale, stoneShade, 0, 0, 0);
  drawCenteredRainbowNatureBox(base, 0.0, 2.36 * scale, 0.0, 0.18 * scale, 0.08 * scale, 0.18 * scale, stoneBase, 0, 0, 0);
  drawCenteredRainbowCone(base, 0.0, 2.44 * scale, 0.0, 0.12 * scale, 0.14 * scale, 0.12 * scale, stoneBase, 12, 0, 0, 0);

  renderRainbowFountainWaterJet(base, 0.0, 2.04 * scale, 0.0, 0.38 * scale, 0.06 * scale, waterColor);

  const upperSpouts = [
    [-0.28, 0.0],
    [0.28, 0.0],
    [0.0, -0.28],
    [0.0, 0.28]
  ];
  for (let i = 0; i < upperSpouts.length; i += 1) {
    renderRainbowFountainWaterJet(
      base,
      upperSpouts[i][0] * scale,
      1.72 * scale,
      upperSpouts[i][1] * scale,
      0.46 * scale,
      0.045 * scale,
      waterColor
    );
  }

  const lowerSpouts = [
    [-0.6, -0.18],
    [0.6, -0.18],
    [-0.6, 0.18],
    [0.6, 0.18]
  ];
  for (let i = 0; i < lowerSpouts.length; i += 1) {
    renderRainbowFountainWaterJet(
      base,
      lowerSpouts[i][0] * scale,
      0.72 * scale,
      lowerSpouts[i][1] * scale,
      0.62 * scale,
      0.05 * scale,
      waterGlow
    );
  }

  renderRainbowFountainMist(base, 0.0, 1.16 * scale, 0.0, 0.42 * scale, 0.42 * scale, 14);
  renderRainbowFountainMist(base, 0.0, 2.02 * scale, 0.0, 0.22 * scale, 0.22 * scale, 10);
}

function transformRainbowPoint(matrix, point) {
  const e = matrix.elements;
  const x = point[0];
  const y = point[1];
  const z = point[2];
  return [
    e[0] * x + e[4] * y + e[8] * z + e[12],
    e[1] * x + e[5] * y + e[9] * z + e[13],
    e[2] * x + e[6] * y + e[10] * z + e[14]
  ];
}

function insetRainbowTriangle(points, factor) {
  const centroid = [0.0, 0.0, 0.0];
  for (let i = 0; i < points.length; i += 1) {
    centroid[0] += points[i][0];
    centroid[1] += points[i][1];
    centroid[2] += points[i][2];
  }
  centroid[0] /= points.length;
  centroid[1] /= points.length;
  centroid[2] /= points.length;

  const inset = [];
  for (let i = 0; i < points.length; i += 1) {
    inset.push([
      centroid[0] + (points[i][0] - centroid[0]) * factor,
      centroid[1] + (points[i][1] - centroid[1]) * factor,
      centroid[2] + (points[i][2] - centroid[2]) * factor
    ]);
  }
  return inset;
}

function drawRainbowTriangleWorld(baseMatrix, points, color) {
  const vertices = [];
  for (let i = 0; i < points.length; i += 1) {
    const transformed = transformRainbowPoint(baseMatrix, points[i]);
    vertices.push(transformed[0], transformed[1], transformed[2]);
  }

  gl.uniformMatrix4fv(u_ModelMatrix, false, new Matrix4().elements);
  gl.uniform1i(u_WhichTexture, -1);
  gl.uniform1f(u_TexColorWeight, 0.0);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  drawTriangle3D(vertices);
}

function drawRainbowButterflyPiece(baseMatrix, points, fillColor) {
  drawRainbowTriangleWorld(baseMatrix, points, fillColor);
}

function renderRainbowButterfly(x, y, z, wingColor, phase, scale) {
  const butterflyScale = scale || 1.0;
  const flutter = 0.04 * Math.sin(g_seconds * 4.2 + phase);
  const bob = 0.05 * Math.sin(g_seconds * 1.8 + phase * 1.7);
  const bodyColor = [
    wingColor[0] * 0.55,
    wingColor[1] * 0.55,
    wingColor[2] * 0.55,
    wingColor[3]
  ];
  const base = new Matrix4();
  base.translate(x, y + bob, z);
  base.rotate(phase * 19, 0, 1, 0);
  base.rotate(6 * Math.sin(g_seconds * 2.2 + phase), 0, 1, 0);
  base.scale(butterflyScale, butterflyScale, butterflyScale);

  const upperLeft = [
    [-0.02, 0.04, 0.0],
    [-0.38 - flutter, 0.28, 0.0],
    [-0.15, 0.0, 0.0]
  ];
  const upperLeftInner = [
    [-0.12, 0.0, 0.0],
    [-0.28 - flutter * 0.7, 0.15, 0.0],
    [-0.04, 0.16, 0.0]
  ];
  const lowerLeft = [
    [-0.02, -0.02, 0.0],
    [-0.32 - flutter * 0.8, -0.06, 0.0],
    [-0.2, -0.28, 0.0]
  ];
  const lowerLeftInner = [
    [-0.1, -0.04, 0.0],
    [-0.26 - flutter * 0.5, -0.16, 0.0],
    [-0.08, -0.22, 0.0]
  ];
  const bodyTop = [
    [-0.03, 0.02, 0.0],
    [0.03, 0.02, 0.0],
    [0.0, 0.2, 0.0]
  ];
  const bodyBottom = [
    [-0.03, 0.0, 0.0],
    [0.03, 0.0, 0.0],
    [0.0, -0.2, 0.0]
  ];

  function mirrorTriangle(points) {
    const mirrored = [];
    for (let i = 0; i < points.length; i += 1) {
      mirrored.push([-points[i][0], points[i][1], points[i][2]]);
    }
    return mirrored;
  }

  drawRainbowButterflyPiece(base, upperLeft, wingColor);
  drawRainbowButterflyPiece(base, upperLeftInner, wingColor);
  drawRainbowButterflyPiece(base, lowerLeft, wingColor);
  drawRainbowButterflyPiece(base, lowerLeftInner, wingColor);
  drawRainbowButterflyPiece(base, mirrorTriangle(upperLeft), wingColor);
  drawRainbowButterflyPiece(base, mirrorTriangle(upperLeftInner), wingColor);
  drawRainbowButterflyPiece(base, mirrorTriangle(lowerLeft), wingColor);
  drawRainbowButterflyPiece(base, mirrorTriangle(lowerLeftInner), wingColor);
  drawRainbowTriangleWorld(base, bodyTop, bodyColor);
  drawRainbowTriangleWorld(base, bodyBottom, bodyColor);
}

function renderRainbowPond(x, z, width, depth, textureNum) {
  const pondTexture = textureNum === undefined ? TEXTURE_IDS.water : textureNum;
  const surroundPad = 0.92;
  const outerStartX = x - surroundPad;
  const outerStartZ = z - surroundPad;
  const outerWidth = width + surroundPad * 2;
  const outerDepth = depth + surroundPad * 2;
  const borderThickness = 0.58;
  const borderHeight = 0.34;
  const borderTopCapHeight = 0.08;
  const borderSegment = 0.86;
  const waterInset = borderThickness - 0.02;
  const waterStartX = outerStartX + waterInset;
  const waterStartZ = outerStartZ + waterInset;
  const waterWidth = outerWidth - waterInset * 2;
  const waterDepth = outerDepth - waterInset * 2;
  const waterY = 0.145;
  const waterHeight = 0.055;
  const borderBaseColor = [0.98, 0.98, 0.99, 1.0];
  const borderShadeColor = [0.88, 0.89, 0.93, 1.0];
  const borderCapColor = [0.99, 0.99, 1.0, 1.0];

  drawBox(outerStartX, -0.04, outerStartZ, outerWidth, 0.14, outerDepth, [0.76, 0.78, 0.82, 1.0], TEXTURE_IDS.stone, 0.3);
  drawBox(waterStartX, waterY, waterStartZ, waterWidth, waterHeight, waterDepth, [0.98, 0.99, 1.0, 0.98], pondTexture, 0.995);

  for (let borderX = outerStartX; borderX < outerStartX + outerWidth - 0.001; borderX += borderSegment) {
    const currentWidth = Math.min(borderSegment, (outerStartX + outerWidth) - borderX);
    const colorA = Math.floor((borderX - outerStartX) / borderSegment) % 2 === 0 ? borderBaseColor : borderShadeColor;
    const colorB = colorA === borderBaseColor ? borderShadeColor : borderBaseColor;

    drawBox(borderX, 0.0, outerStartZ, currentWidth, borderHeight, borderThickness, colorA, TEXTURE_IDS.stone, 0.92);
    drawBox(borderX, borderHeight, outerStartZ + 0.08, currentWidth, borderTopCapHeight, borderThickness - 0.16, borderCapColor, TEXTURE_IDS.stone, 0.86);
    drawBox(borderX, 0.0, outerStartZ + outerDepth - borderThickness, currentWidth, borderHeight, borderThickness, colorB, TEXTURE_IDS.stone, 0.92);
    drawBox(borderX, borderHeight, outerStartZ + outerDepth - borderThickness + 0.08, currentWidth, borderTopCapHeight, borderThickness - 0.16, borderCapColor, TEXTURE_IDS.stone, 0.86);
  }

  for (let borderZ = outerStartZ + borderSegment; borderZ < outerStartZ + outerDepth - borderSegment - 0.001; borderZ += borderSegment) {
    const currentDepth = Math.min(borderSegment, (outerStartZ + outerDepth - borderSegment) - borderZ);
    const colorA = Math.floor((borderZ - outerStartZ) / borderSegment) % 2 === 0 ? borderShadeColor : borderBaseColor;
    const colorB = colorA === borderBaseColor ? borderShadeColor : borderBaseColor;

    drawBox(outerStartX, 0.0, borderZ, borderThickness, borderHeight, currentDepth, colorA, TEXTURE_IDS.stone, 0.92);
    drawBox(outerStartX + 0.08, borderHeight, borderZ, borderThickness - 0.16, borderTopCapHeight, currentDepth, borderCapColor, TEXTURE_IDS.stone, 0.86);
    drawBox(outerStartX + outerWidth - borderThickness, 0.0, borderZ, borderThickness, borderHeight, currentDepth, colorB, TEXTURE_IDS.stone, 0.92);
    drawBox(outerStartX + outerWidth - borderThickness + 0.08, borderHeight, borderZ, borderThickness - 0.16, borderTopCapHeight, currentDepth, borderCapColor, TEXTURE_IDS.stone, 0.86);
  }
}

function renderRainbowLilyPad(x, z, size, flowerColor) {
  const padColor = [0.58, 0.88, 0.48, 1.0];
  const padShade = [0.39, 0.68, 0.34, 1.0];
  const petalLight = [
    Math.min(1.0, flowerColor[0] + 0.12),
    Math.min(1.0, flowerColor[1] + 0.12),
    Math.min(1.0, flowerColor[2] + 0.12),
    1.0
  ];
  const petalShade = [
    Math.max(0.0, flowerColor[0] - 0.14),
    Math.max(0.0, flowerColor[1] - 0.16),
    Math.max(0.0, flowerColor[2] - 0.12),
    1.0
  ];
  const petalBaseY = 0.215;

  drawCenteredRainbowNatureBox(new Matrix4(), x, 0.202, z, size * 0.9, 0.022, size * 0.78, padColor, 0, 0, 0);
  drawCenteredRainbowNatureBox(new Matrix4(), x - size * 0.21, 0.202, z - size * 0.2, size * 0.28, 0.022, size * 0.28, padShade, 45, 0, 0);
  drawCenteredRainbowNatureBox(new Matrix4(), x + size * 0.23, 0.202, z - size * 0.12, size * 0.26, 0.022, size * 0.26, padColor, 45, 0, 0);
  drawCenteredRainbowNatureBox(new Matrix4(), x - size * 0.06, 0.202, z + size * 0.26, size * 0.28, 0.022, size * 0.28, padColor, 45, 0, 0);
  drawCenteredRainbowNatureBox(new Matrix4(), x + size * 0.26, 0.202, z + size * 0.16, size * 0.24, 0.022, size * 0.24, padShade, 45, 0, 0);
  drawCenteredRainbowNatureBox(new Matrix4(), x - size * 0.32, 0.202, z + size * 0.04, size * 0.18, 0.018, size * 0.22, [0.34, 0.58, 0.29, 1.0], -26, 0, 0);

  drawCenteredRainbowNatureBox(new Matrix4(), x, petalBaseY, z + size * 0.02, size * 0.2, size * 0.18, size * 0.14, petalLight, 0, -8, 0);
  drawCenteredRainbowNatureBox(new Matrix4(), x - size * 0.12, petalBaseY, z + size * 0.02, size * 0.16, size * 0.17, size * 0.12, flowerColor, -18, 0, 18);
  drawCenteredRainbowNatureBox(new Matrix4(), x + size * 0.12, petalBaseY, z + size * 0.02, size * 0.16, size * 0.17, size * 0.12, flowerColor, 18, 0, -18);
  drawCenteredRainbowNatureBox(new Matrix4(), x - size * 0.1, petalBaseY + size * 0.01, z - size * 0.08, size * 0.14, size * 0.16, size * 0.12, petalShade, -36, 8, 12);
  drawCenteredRainbowNatureBox(new Matrix4(), x + size * 0.1, petalBaseY + size * 0.01, z - size * 0.08, size * 0.14, size * 0.16, size * 0.12, petalShade, 36, 8, -12);
  drawCenteredRainbowNatureBox(new Matrix4(), x, petalBaseY + size * 0.02, z - size * 0.12, size * 0.18, size * 0.19, size * 0.12, petalShade, 0, 12, 0);
  drawCenteredRainbowNatureBox(new Matrix4(), x - size * 0.02, petalBaseY + size * 0.04, z - size * 0.02, size * 0.12, size * 0.14, size * 0.1, [0.99, 0.93, 0.98, 1.0], 0, 0, 0);

  for (let i = 0; i < 7; i += 1) {
    const angle = (-18 + i * 6) * Math.PI / 180;
    drawCenteredRainbowNatureBox(
      new Matrix4(),
      x + Math.sin(angle) * size * 0.03,
      0.252,
      z - size * 0.025 + Math.cos(angle) * size * 0.01,
      size * 0.02,
      size * 0.11,
      size * 0.02,
      [0.92, 0.82, 0.34, 1.0],
      0,
      0,
      0
    );
  }
}

function renderRainbowLantern(x, y, z) {
  drawBox(x - 0.03, y, z - 0.03, 0.06, 0.32, 0.06, [0.54, 0.36, 0.18, 1.0], -1, 0.0);
  drawBox(x - 0.12, y + 0.26, z - 0.12, 0.24, 0.22, 0.24, [0.95, 0.85, 0.48, 1.0], -1, 0.0);
  drawBox(x - 0.07, y + 0.48, z - 0.07, 0.14, 0.06, 0.14, [0.38, 0.27, 0.14, 1.0], -1, 0.0);
}

function renderRainbowPathStone(x, z, width, depth, yaw, color) {
  const stone = new Matrix4();
  stone.translate(x, 0.03, z);
  stone.rotate(yaw, 0, 1, 0);
  stone.translate(-width * 0.5, 0.0, -depth * 0.5);
  stone.scale(width, 0.1, depth);
  drawCube(stone, color, TEXTURE_IDS.stone, 0.88);

  const cap = new Matrix4();
  cap.translate(x, 0.11, z);
  cap.rotate(yaw, 0, 1, 0);
  cap.translate(-width * 0.42, 0.0, -depth * 0.42);
  cap.scale(width * 0.84, 0.03, depth * 0.84);
  drawCube(cap, [0.98, 0.98, 1.0, 1.0], TEXTURE_IDS.stone, 0.74);
}

function renderRainbowPavementPath(points, slabLength, slabWidth, colorA, colorB) {
  let stoneIndex = 0;

  for (let segment = 0; segment < points.length - 1; segment += 1) {
    const start = points[segment];
    const end = points[segment + 1];
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const segmentLength = Math.sqrt(dx * dx + dz * dz);

    if (segmentLength < 0.001) {
      continue;
    }

    const yaw = -Math.atan2(dz, dx) * 180 / Math.PI;
    const steps = Math.max(1, Math.floor(segmentLength / (slabLength * 0.82)));
    const startStep = segment === 0 ? 0 : 1;

    for (let step = startStep; step <= steps; step += 1) {
      const t = step / steps;
      const cx = start[0] + dx * t;
      const cz = start[1] + dz * t;
      if (!isRainbowDetailVisible(cx, cz, RAINBOW_BRIDGE_RENDER_DISTANCE)) {
        continue;
      }

      const lengthScale = stoneIndex % 2 === 0 ? 1.0 : 0.9;
      const widthScale = stoneIndex % 3 === 0 ? 1.06 : 0.92;
      renderRainbowPathStone(
        cx,
        cz,
        slabLength * lengthScale,
        slabWidth * widthScale,
        yaw,
        stoneIndex % 2 === 0 ? colorA : colorB
      );
      stoneIndex += 1;
    }
  }
}

function renderRainbowRoundedDome(baseMatrix, scale) {
  const rimColor = [0.97, 0.98, 1.0, 1.0];
  const ribShade = [0.9, 0.92, 0.97, 1.0];
  const gold = [0.88, 0.78, 0.46, 1.0];
  const ringSpecs = [
    { y: 2.98, rx: 1.72, rz: 1.42, segments: 18, thickness: 0.1, color: ribShade },
    { y: 3.24, rx: 1.52, rz: 1.25, segments: 16, thickness: 0.09, color: rimColor },
    { y: 3.52, rx: 1.26, rz: 1.02, segments: 14, thickness: 0.085, color: ribShade },
    { y: 3.78, rx: 0.98, rz: 0.78, segments: 12, thickness: 0.08, color: rimColor },
    { y: 4.02, rx: 0.72, rz: 0.56, segments: 10, thickness: 0.075, color: ribShade },
    { y: 4.2, rx: 0.46, rz: 0.36, segments: 8, thickness: 0.07, color: rimColor }
  ];
  const ribAngles = [-120, -80, -40, 0, 40, 80, 120];

  drawCenteredRainbowNatureBox(baseMatrix, 0.0, 2.86 * scale, 0.0, 3.48 * scale, 0.12 * scale, 2.86 * scale, rimColor, 0, 0, 0);
  drawCenteredRainbowNatureBox(baseMatrix, 0.0, 2.92 * scale, 0.0, 3.18 * scale, 0.06 * scale, 2.58 * scale, ribShade, 0, 0, 0);

  for (let row = 0; row < ringSpecs.length; row += 1) {
    const ring = ringSpecs[row];
    const ringPoints = [];
    for (let i = 0; i <= ring.segments; i += 1) {
      const angle = (Math.PI * 2 * i) / ring.segments;
      ringPoints.push([
        Math.cos(angle) * ring.rx * scale,
        ring.y * scale,
        Math.sin(angle) * ring.rz * scale
      ]);
    }
    renderRainbowBlockPath(baseMatrix, ringPoints, ring.thickness * scale, ring.color);
  }

  for (let rib = 0; rib < ribAngles.length; rib += 1) {
    const radians = ribAngles[rib] * Math.PI / 180;
    const ribPoints = [];
    for (let row = 0; row < ringSpecs.length; row += 1) {
      ribPoints.push([
        Math.cos(radians) * ringSpecs[row].rx * scale,
        ringSpecs[row].y * scale,
        Math.sin(radians) * ringSpecs[row].rz * scale
      ]);
    }
    ribPoints.push([0.0, 4.4 * scale, 0.0]);
    renderRainbowBlockPath(baseMatrix, ribPoints, 0.09 * scale, rimColor);
  }

  renderRainbowBlockPath(baseMatrix, [
    [0.0, 4.3 * scale, 0.0],
    [0.0, 4.72 * scale, 0.0]
  ], 0.1 * scale, gold);
  drawCenteredRainbowNatureBox(baseMatrix, 0.0, 4.76 * scale, 0.0, 0.2 * scale, 0.08 * scale, 0.2 * scale, gold, 0, 0, 0);
  renderRainbowBlockPath(baseMatrix, [
    [0.0, 4.78 * scale, 0.0],
    [0.0, 5.28 * scale, 0.0]
  ], 0.06 * scale, gold);
}

function renderRainbowAngelWingFeather(baseMatrix, side, scale, feather, edgeColor, bodyColor, coreColor) {
  const wingSide = side < 0 ? -1 : 1;
  const roll = feather.roll * wingSide;
  const pitch = feather.pitch || 0;
  const yaw = (feather.yaw || 0) * wingSide;
  const sx = feather.sx * scale * wingSide;
  const sy = feather.sy * scale;
  const sz = feather.sz * scale;
  const rootX = feather.x * wingSide * scale;
  const rootY = feather.y * scale;
  const rootZ = feather.z * scale;

  drawCenteredLongDiamond(baseMatrix, rootX, rootY, rootZ, sx, sy, sz, edgeColor, yaw, pitch, roll);
  drawCenteredLongDiamond(
    baseMatrix,
    rootX + feather.insetShiftX * wingSide * scale,
    rootY + feather.insetShiftY * scale,
    rootZ + 0.01 * scale,
    sx * feather.insetScale,
    sy * feather.insetScale,
    sz * 0.76,
    bodyColor,
    yaw,
    pitch,
    roll
  );
  drawCenteredLongDiamond(
    baseMatrix,
    rootX + feather.coreShiftX * wingSide * scale,
    rootY + feather.coreShiftY * scale,
    rootZ + 0.02 * scale,
    sx * feather.coreScale,
    sy * feather.coreScale,
    sz * 0.58,
    coreColor,
    yaw,
    pitch,
    roll
  );
}

function renderRainbowAngelWing(baseMatrix, side, scale) {
  const wingSide = side < 0 ? -1 : 1;
  const edgeGold = [0.99, 0.91, 0.5, 1.0];
  const warmGold = [0.95, 0.67, 0.18, 1.0];
  const wingCoral = [0.95, 0.38, 0.22, 1.0];
  const wingScarlet = [0.89, 0.12, 0.08, 1.0];
  const softBlush = [0.98, 0.72, 0.5, 1.0];
  const shoulderX = 0.18;
  const shoulderY = 1.56;
  const shoulderZ = -0.12;

  renderRainbowBlockPath(baseMatrix, [
    [0.08 * wingSide * scale, 1.58 * scale, -0.06 * scale],
    [shoulderX * wingSide * scale, shoulderY * scale, shoulderZ * scale],
    [0.22 * wingSide * scale, 1.44 * scale, -0.2 * scale]
  ], 0.065 * scale, edgeGold);

  drawCenteredRainbowNatureBox(
    baseMatrix,
    shoulderX * wingSide * scale,
    shoulderY * scale,
    shoulderZ * scale,
    0.14 * scale,
    0.16 * scale,
    0.1 * scale,
    edgeGold,
    0,
    -8,
    22 * wingSide
  );

  const feathers = [
    { x: 0.2, y: 1.48, z: -0.19, sx: 0.58, sy: 0.92, sz: 0.046, roll: 2, pitch: -10, yaw: 12, insetScale: 0.84, coreScale: 0.58, insetShiftX: 0.024, insetShiftY: 0.06, coreShiftX: 0.05, coreShiftY: 0.114, bodyColor: warmGold, coreColor: wingScarlet, edgeColor: edgeGold },
    { x: 0.19, y: 1.32, z: -0.18, sx: 0.26, sy: 0.28, sz: 0.028, roll: -86, pitch: -8, yaw: 4, insetScale: 0.82, coreScale: 0.52, insetShiftX: 0.008, insetShiftY: 0.018, coreShiftX: 0.018, coreShiftY: 0.034, bodyColor: softBlush, coreColor: wingCoral, edgeColor: edgeGold },
    { x: 0.22, y: 1.38, z: -0.195, sx: 0.34, sy: 0.36, sz: 0.03, roll: -36, pitch: -8, yaw: 6, insetScale: 0.82, coreScale: 0.54, insetShiftX: 0.01, insetShiftY: 0.022, coreShiftX: 0.024, coreShiftY: 0.046, bodyColor: softBlush, coreColor: wingScarlet, edgeColor: edgeGold },
    { x: 0.23, y: 1.28, z: -0.175, sx: 0.38, sy: 0.32, sz: 0.028, roll: -16, pitch: -10, yaw: 8, insetScale: 0.82, coreScale: 0.54, insetShiftX: 0.016, insetShiftY: 0.022, coreShiftX: 0.034, coreShiftY: 0.042, bodyColor: warmGold, coreColor: wingCoral, edgeColor: edgeGold }
  ];

  for (let i = 0; i < feathers.length; i += 1) {
    renderRainbowAngelWingFeather(
      baseMatrix,
      wingSide,
      scale,
      feathers[i],
      feathers[i].edgeColor,
      feathers[i].bodyColor,
      feathers[i].coreColor
    );
  }
}

function renderRainbowAngelStatue(baseMatrix, scale) {
  const marbleLight = [0.99, 0.95, 0.93, 1.0];
  const marbleMid = [0.94, 0.86, 0.89, 1.0];
  const marbleShade = [0.82, 0.76, 0.8, 1.0];
  const skinLight = [0.97, 0.9, 0.84, 1.0];
  const haloGold = [0.92, 0.84, 0.58, 1.0];
  const crownGold = [0.97, 0.83, 0.32, 1.0];
  const crownGoldLight = [0.99, 0.91, 0.56, 1.0];

  drawCenteredRainbowNatureBox(baseMatrix, 0.0, 0.36 * scale, 0.0, 0.94 * scale, 0.16 * scale, 0.94 * scale, marbleShade, 0, 0, 0);
  drawCenteredRainbowNatureBox(baseMatrix, 0.0, 0.5 * scale, 0.0, 0.72 * scale, 0.12 * scale, 0.72 * scale, marbleLight, 0, 0, 0);

  drawCenteredRainbowCone(baseMatrix, 0.0, 0.52 * scale, 0.0, 0.96 * scale, 1.28 * scale, 0.84 * scale, marbleLight, 18, 0, 0, 0);
  drawCenteredRainbowNatureBox(baseMatrix, 0.0, 0.74 * scale, 0.0, 0.44 * scale, 0.8 * scale, 0.28 * scale, marbleLight, 0, 0, 0);
  drawCenteredRainbowNatureBox(baseMatrix, 0.0, 1.38 * scale, 0.0, 0.42 * scale, 0.48 * scale, 0.24 * scale, marbleMid, 0, 0, 0);
  drawCenteredRainbowNatureBox(baseMatrix, 0.0, 1.9 * scale, 0.02 * scale, 0.16 * scale, 0.14 * scale, 0.14 * scale, skinLight, 0, 0, 0);
  drawCenteredRainbowSphere(baseMatrix, 0.0, 2.08 * scale, 0.0, 0.31 * scale, 0.33 * scale, 0.29 * scale, skinLight, 0, 0, 0);

  drawCenteredRainbowCone(baseMatrix, 0.0, 0.56 * scale, 0.22 * scale, 0.6 * scale, 0.96 * scale, 0.18 * scale, marbleMid, 12, 0, 0, 0);
  drawCenteredRainbowCone(baseMatrix, 0.0, 0.56 * scale, -0.18 * scale, 0.52 * scale, 0.9 * scale, 0.16 * scale, marbleShade, 12, 0, 0, 0);

  renderRainbowAngelWing(baseMatrix, -1, scale);
  renderRainbowAngelWing(baseMatrix, 1, scale);

  renderRainbowBlockPath(baseMatrix, [
    [-0.18 * scale, 1.66 * scale, 0.02 * scale],
    [-0.3 * scale, 1.48 * scale, 0.16 * scale],
    [-0.22 * scale, 1.22 * scale, 0.26 * scale],
    [-0.11 * scale, 1.0 * scale, 0.34 * scale]
  ], 0.08 * scale, marbleMid);
  renderRainbowBlockPath(baseMatrix, [
    [0.18 * scale, 1.66 * scale, 0.02 * scale],
    [0.3 * scale, 1.48 * scale, 0.16 * scale],
    [0.22 * scale, 1.22 * scale, 0.26 * scale],
    [0.11 * scale, 1.0 * scale, 0.34 * scale]
  ], 0.08 * scale, marbleMid);

  drawCenteredRainbowNatureBox(baseMatrix, -0.1 * scale, 0.98 * scale, 0.34 * scale, 0.08 * scale, 0.12 * scale, 0.08 * scale, skinLight, 0, 0, 8);
  drawCenteredRainbowNatureBox(baseMatrix, 0.1 * scale, 0.98 * scale, 0.34 * scale, 0.08 * scale, 0.12 * scale, 0.08 * scale, skinLight, 0, 0, -8);

  drawCenteredRainbowNatureBox(baseMatrix, -0.1 * scale, 0.38 * scale, 0.0, 0.12 * scale, 0.44 * scale, 0.12 * scale, marbleLight, 0, 0, 8);
  drawCenteredRainbowNatureBox(baseMatrix, 0.1 * scale, 0.38 * scale, 0.0, 0.12 * scale, 0.44 * scale, 0.12 * scale, marbleLight, 0, 0, -8);

  renderRainbowAngelPot(baseMatrix, scale);

  renderRainbowBlockPath(baseMatrix, [
    [-0.24 * scale, 2.12 * scale, -0.08 * scale],
    [-0.14 * scale, 2.2 * scale, -0.08 * scale],
    [0.0, 2.25 * scale, -0.08 * scale],
    [0.14 * scale, 2.2 * scale, -0.08 * scale],
    [0.24 * scale, 2.12 * scale, -0.08 * scale]
  ], 0.05 * scale, crownGold);

  const crownSpikes = [
    [-0.22, 2.16, -0.08, 0.08, 0.08, 0.08, 0.11],
    [-0.12, 2.24, -0.08, 0.08, 0.08, 0.08, 0.15],
    [0.0, 2.3, -0.08, 0.09, 0.09, 0.09, 0.22],
    [0.12, 2.24, -0.08, 0.08, 0.08, 0.08, 0.15],
    [0.22, 2.16, -0.08, 0.08, 0.08, 0.08, 0.11]
  ];

  for (let i = 0; i < crownSpikes.length; i += 1) {
    const spike = crownSpikes[i];
    drawCenteredRainbowNatureBox(
      baseMatrix,
      spike[0] * scale,
      spike[1] * scale,
      spike[2] * scale,
      spike[3] * scale,
      spike[4] * scale,
      spike[5] * scale,
      crownGold,
      0,
      0,
      0
    );
    drawCenteredRainbowCone(
      baseMatrix,
      spike[0] * scale,
      (spike[1] + spike[4] * 0.5 + 0.03) * scale,
      spike[2] * scale,
      spike[3] * 0.62 * scale,
      spike[6] * scale,
      spike[5] * 0.62 * scale,
      crownGoldLight,
      12,
      0,
      0,
      0
    );
  }
}

function renderRainbowAngelPot(baseMatrix, scale) {
  if (!g_cementPotModel) {
    return;
  }

  const potBounds = g_cementPotModel.bounds;
  const centerX = (potBounds.min[0] + potBounds.max[0]) * 0.5;
  const centerZ = (potBounds.min[2] + potBounds.max[2]) * 0.5;
  const potMatrix = new Matrix4(baseMatrix);
  potMatrix.translate(0.0, 0.84 * scale, 0.35 * scale);
  potMatrix.rotate(180, 0, 1, 0);
  potMatrix.rotate(-8, 1, 0, 0);
  potMatrix.scale(0.16 * scale, 0.16 * scale, 0.16 * scale);
  potMatrix.translate(-centerX, -potBounds.min[1], -centerZ);
  g_cementPotModel.matrix.set(potMatrix);
  g_cementPotModel.render();
}

function renderRainbowGardenDome(centerX, centerZ, scale) {
  const stoneBase = [0.97, 0.98, 1.0, 1.0];
  const stoneShade = [0.85, 0.88, 0.94, 1.0];
  const stoneAccent = [0.74, 0.79, 0.86, 1.0];
  const base = new Matrix4();
  base.translate(centerX, 0.0, centerZ);

  drawCenteredRainbowNatureBox(base, 0.0, 0.0, 0.0, 4.42 * scale, 0.14 * scale, 4.02 * scale, stoneAccent, 0, 0, 0);
  drawCenteredRainbowNatureBox(base, 0.0, 0.08 * scale, 0.0, 3.84 * scale, 0.1 * scale, 3.46 * scale, stoneBase, 0, 0, 0);

  const floorCorners = [
    [-1.74, -1.18], [0.0, -1.62], [1.74, -1.18], [2.0, 0.0],
    [1.74, 1.18], [0.0, 1.62], [-1.74, 1.18], [-2.0, 0.0]
  ];
  for (let i = 0; i < floorCorners.length; i += 1) {
    drawCenteredRainbowNatureBox(
      base,
      floorCorners[i][0] * scale,
      0.08 * scale,
      floorCorners[i][1] * scale,
      0.52 * scale,
      0.1 * scale,
      0.52 * scale,
      stoneBase,
      0,
      0,
      0
    );
  }

  drawCenteredRainbowNatureBox(base, 2.14 * scale, 0.04 * scale, 0.0, 0.62 * scale, 0.08 * scale, 1.18 * scale, stoneBase, 0, 0, 0);
  drawCenteredRainbowNatureBox(base, 2.46 * scale, 0.0, 0.0, 0.38 * scale, 0.06 * scale, 0.86 * scale, stoneShade, 0, 0, 0);

  drawCenteredRainbowNatureBox(base, 0.0, 0.12 * scale, 0.0, 1.18 * scale, 0.14 * scale, 1.02 * scale, stoneBase, 0, 0, 0);
  drawCenteredRainbowNatureBox(base, 0.0, 0.24 * scale, 0.0, 0.84 * scale, 0.1 * scale, 0.7 * scale, stoneShade, 0, 0, 0);
  drawCenteredRainbowNatureBox(base, 0.0, 0.32 * scale, 0.0, 0.62 * scale, 0.06 * scale, 0.52 * scale, stoneBase, 0, 0, 0);

  const columns = [
    [-1.56, -1.02], [1.56, -1.02],
    [1.56, 1.02], [-1.56, 1.02]
  ];

  for (let i = 0; i < columns.length; i += 1) {
    drawCenteredRainbowNatureBox(base, columns[i][0] * scale, 0.14 * scale, columns[i][1] * scale, 0.48 * scale, 0.18 * scale, 0.48 * scale, stoneShade, 0, 0, 0);
    drawCenteredRainbowNatureBox(base, columns[i][0] * scale, 0.32 * scale, columns[i][1] * scale, 0.26 * scale, 2.36 * scale, 0.26 * scale, stoneBase, 0, 0, 0);
    drawCenteredRainbowNatureBox(base, columns[i][0] * scale, 2.66 * scale, columns[i][1] * scale, 0.46 * scale, 0.18 * scale, 0.46 * scale, stoneShade, 0, 0, 0);
  }

  for (let i = 0; i < columns.length; i += 1) {
    const next = columns[(i + 1) % columns.length];
    renderRainbowBlockPath(base, [
      [columns[i][0] * scale, 2.84 * scale, columns[i][1] * scale],
      [next[0] * scale, 2.84 * scale, next[1] * scale]
    ], 0.16 * scale, stoneBase);
  }

  renderRainbowBlockPath(base, [
    [1.56 * scale, 2.16 * scale, -1.02 * scale],
    [1.94 * scale, 3.1 * scale, 0.0],
    [1.56 * scale, 2.16 * scale, 1.02 * scale]
  ], 0.13 * scale, stoneBase);
  renderRainbowBlockPath(base, [
    [-1.56 * scale, 2.14 * scale, -1.02 * scale],
    [-1.86 * scale, 2.94 * scale, 0.0],
    [-1.56 * scale, 2.14 * scale, 1.02 * scale]
  ], 0.11 * scale, stoneShade);
  renderRainbowRoundedDome(base, scale);
  renderRainbowAngelStatue(base, 0.9 * scale);
}

function renderRainbowPortal(x, z, scale) {
  const base = new Matrix4();
  base.translate(x, 0.0, z);

  drawBoxFrom(base, -2.2 * scale, 0.0, -1.7 * scale, 4.4 * scale, 0.24 * scale, 3.4 * scale, [0.95, 0.83, 0.9, 1.0], TEXTURE_IDS.plank, 0.44);
  drawBoxFrom(base, -1.55 * scale, 0.24 * scale, -0.3 * scale, 0.42 * scale, 3.45 * scale, 0.42 * scale, [0.96, 0.9, 0.95, 1.0], -1, 0.0);
  drawBoxFrom(base, 1.13 * scale, 0.24 * scale, -0.3 * scale, 0.42 * scale, 3.45 * scale, 0.42 * scale, [0.96, 0.9, 0.95, 1.0], -1, 0.0);
  drawBoxFrom(base, -1.9 * scale, 0.0, -0.54 * scale, 0.32 * scale, 4.1 * scale, 0.32 * scale, [0.85, 0.74, 0.82, 1.0], -1, 0.0);
  drawBoxFrom(base, 1.58 * scale, 0.0, -0.54 * scale, 0.32 * scale, 4.1 * scale, 0.32 * scale, [0.85, 0.74, 0.82, 1.0], -1, 0.0);
  drawBoxFrom(base, -1.55 * scale, 3.42 * scale, -0.34 * scale, 3.1 * scale, 0.34 * scale, 0.5 * scale, [0.98, 0.92, 0.97, 1.0], -1, 0.0);
  drawBoxFrom(base, -1.84 * scale, 3.76 * scale, -0.7 * scale, 3.68 * scale, 0.24 * scale, 1.22 * scale, [0.95, 0.8, 0.9, 1.0], TEXTURE_IDS.plank, 0.48);
  drawBoxFrom(base, -1.74 * scale, 4.0 * scale, -0.86 * scale, 3.48 * scale, 0.16 * scale, 1.54 * scale, [0.99, 0.98, 1.0, 1.0], -1, 0.0);
  drawBoxFrom(base, -1.42 * scale, 4.16 * scale, -0.54 * scale, 2.84 * scale, 0.18 * scale, 0.9 * scale, [0.96, 0.86, 0.92, 1.0], TEXTURE_IDS.plank, 0.5);
  drawBoxFrom(base, -1.18 * scale, 4.34 * scale, -0.38 * scale, 2.36 * scale, 0.16 * scale, 0.58 * scale, [0.99, 0.96, 1.0, 1.0], -1, 0.0);
  drawBoxFrom(base, -0.88 * scale, 4.5 * scale, -0.28 * scale, 1.76 * scale, 0.18 * scale, 0.38 * scale, [0.97, 0.86, 0.93, 1.0], TEXTURE_IDS.plank, 0.42);
  drawBoxFrom(base, -1.0 * scale, 0.42 * scale, -0.05 * scale, 2.0 * scale, 2.65 * scale, 0.16 * scale, [1.0, 1.0, 1.0, 1.0], TEXTURE_IDS.glass, 1.0);
  drawBoxFrom(base, -1.02 * scale, 0.22 * scale, -0.42 * scale, 2.04 * scale, 0.2 * scale, 0.9 * scale, [0.8, 0.69, 0.78, 1.0], -1, 0.0);
  drawBoxFrom(base, -2.08 * scale, 0.1 * scale, -1.5 * scale, 0.22 * scale, 3.55 * scale, 0.26 * scale, [0.46, 0.72, 0.32, 1.0], -1, 0.0);
  drawBoxFrom(base, 1.86 * scale, 0.1 * scale, -1.5 * scale, 0.22 * scale, 3.55 * scale, 0.26 * scale, [0.46, 0.72, 0.32, 1.0], -1, 0.0);
  drawBoxFrom(base, -2.26 * scale, 0.4 * scale, -1.42 * scale, 0.16 * scale, 0.16 * scale, 0.16 * scale, [0.94, 0.58, 0.74, 1.0], -1, 0.0);
  drawBoxFrom(base, -2.22 * scale, 0.92 * scale, -1.42 * scale, 0.16 * scale, 0.16 * scale, 0.16 * scale, [0.98, 0.87, 0.4, 1.0], -1, 0.0);
  drawBoxFrom(base, 1.9 * scale, 0.6 * scale, -1.42 * scale, 0.16 * scale, 0.16 * scale, 0.16 * scale, [0.74, 0.58, 0.98, 1.0], -1, 0.0);

  for (let i = 0; i < 9; i += 1) {
    const flowerX = (-1.48 + i * 0.36) * scale;
    drawBoxFrom(base, flowerX, 3.84 * scale, -0.62 * scale, 0.16 * scale, 0.1 * scale, 0.22 * scale, [0.95, 0.72, 0.82, 1.0], -1, 0.0);
    drawBoxFrom(base, flowerX + 0.04 * scale, 3.87 * scale, -0.58 * scale, 0.08 * scale, 0.08 * scale, 0.14 * scale, [0.56, 0.78, 0.34, 1.0], -1, 0.0);
  }

  const finialCenters = [-0.82, 0.0, 0.82];
  for (let i = 0; i < finialCenters.length; i += 1) {
    const finialX = finialCenters[i] * scale;
    const baseHeight = i === 1 ? 4.74 : 4.66;
    const stemHeight = i === 1 ? 0.78 : 0.68;
    drawBoxFrom(base, finialX - 0.16 * scale, baseHeight * scale, -0.18 * scale, 0.32 * scale, 0.42 * scale, 0.24 * scale, [0.3, 0.28, 0.31, 1.0], TEXTURE_IDS.stone, 0.52);
    drawBoxFrom(base, finialX - 0.11 * scale, (baseHeight + 0.42) * scale, -0.12 * scale, 0.22 * scale, stemHeight * scale, 0.12 * scale, [0.93, 0.8, 0.87, 1.0], TEXTURE_IDS.plank, 0.42);
    drawBoxFrom(base, finialX - 0.07 * scale, (baseHeight + 0.42 + stemHeight) * scale, -0.08 * scale, 0.14 * scale, 0.56 * scale, 0.08 * scale, [0.99, 0.99, 0.98, 1.0], -1, 0.0);
  }

  renderRainbowLantern(x - 1.55 * scale, 0.84 * scale, z + 0.82 * scale);
  renderRainbowLantern(x + 1.55 * scale, 0.84 * scale, z + 0.82 * scale);
}

function renderRainbowBridge(centerX, centerZ, scale) {
  const bridgeDepth = 2.45 * scale;
  const deckThickness = 0.18 * scale;
  const profile = [0.08, 0.28, 0.62, 0.98, 1.3, 1.5, 1.3, 0.98, 0.62, 0.28, 0.08];
  const archOpen = [0.0, 0.08, 0.28, 0.58, 0.92, 1.14, 0.92, 0.58, 0.28, 0.08, 0.0];
  const segmentCount = profile.length;
  const totalLength = 9.8 * scale;
  const segmentWidth = totalLength / segmentCount;
  const startX = centerX - totalLength * 0.5;
  const parapetInset = 0.2 * scale;
  const parapetThickness = 0.22 * scale;
  const deckColor = [0.74, 0.55, 0.33, 1.0];
  const railColor = [0.58, 0.39, 0.21, 1.0];
  const supportColor = [0.43, 0.28, 0.14, 1.0];
  const trimColor = [0.86, 0.68, 0.42, 1.0];

  drawBox(startX - 0.68 * scale, 0.0, centerZ - bridgeDepth * 0.72, 0.82 * scale, 0.48 * scale, bridgeDepth * 1.46, supportColor, TEXTURE_IDS.plank, 0.88);
  drawBox(startX + totalLength - 0.14 * scale, 0.0, centerZ - bridgeDepth * 0.72, 0.82 * scale, 0.48 * scale, bridgeDepth * 1.46, supportColor, TEXTURE_IDS.plank, 0.88);
  drawBox(startX - 1.2 * scale, 0.02, centerZ - bridgeDepth * 0.36, 0.52 * scale, 0.12 * scale, bridgeDepth * 0.72, deckColor, TEXTURE_IDS.plank, 0.92);
  drawBox(startX + totalLength + 0.14 * scale, 0.02, centerZ - bridgeDepth * 0.36, 0.52 * scale, 0.12 * scale, bridgeDepth * 0.72, deckColor, TEXTURE_IDS.plank, 0.92);

  for (let i = 0; i < segmentCount; i += 1) {
    const segmentX = startX + i * segmentWidth;
    const deckY = 0.14 + profile[i] * scale;
    const archBaseY = 0.08 + archOpen[i] * scale;
    const sideWallHeight = Math.max(0.2 * scale, (deckY + deckThickness) - archBaseY);

    drawBox(segmentX, deckY, centerZ - bridgeDepth * 0.5, segmentWidth, deckThickness, bridgeDepth, deckColor, TEXTURE_IDS.plank, 0.94);
    drawBox(segmentX, archBaseY, centerZ - bridgeDepth * 0.6, segmentWidth, sideWallHeight, parapetThickness, supportColor, TEXTURE_IDS.plank, 0.88);
    drawBox(segmentX, archBaseY, centerZ + bridgeDepth * 0.38, segmentWidth, sideWallHeight, parapetThickness, supportColor, TEXTURE_IDS.plank, 0.88);
    drawBox(segmentX, deckY + deckThickness, centerZ - bridgeDepth * 0.5 + parapetInset, segmentWidth, 0.1 * scale, 0.16 * scale, railColor, TEXTURE_IDS.plank, 0.92);
    drawBox(segmentX, deckY + deckThickness, centerZ + bridgeDepth * 0.34 - parapetInset, segmentWidth, 0.1 * scale, 0.16 * scale, railColor, TEXTURE_IDS.plank, 0.92);

    if (i < segmentCount - 1) {
      const postX = segmentX + segmentWidth - 0.05 * scale;
      drawBox(postX, deckY + deckThickness, centerZ - bridgeDepth * 0.4, 0.1 * scale, 0.28 * scale, 0.1 * scale, trimColor, TEXTURE_IDS.plank, 0.9);
      drawBox(postX, deckY + deckThickness, centerZ + bridgeDepth * 0.3, 0.1 * scale, 0.28 * scale, 0.1 * scale, trimColor, TEXTURE_IDS.plank, 0.9);
    }
  }

  drawBox(centerX - 0.36 * scale, 1.66 * scale, centerZ - bridgeDepth * 0.56, 0.72 * scale, 0.14 * scale, bridgeDepth * 1.12, trimColor, TEXTURE_IDS.plank, 0.92);
}

function renderRainbowArc(centerX, baseY, centerZ, radius) {
  const rainbowColors = [
    [0.94, 0.36, 0.31, 0.88],
    [0.97, 0.58, 0.25, 0.86],
    [0.98, 0.82, 0.34, 0.84],
    [0.48, 0.79, 0.38, 0.82],
    [0.42, 0.72, 0.92, 0.82],
    [0.43, 0.52, 0.9, 0.82],
    [0.71, 0.48, 0.9, 0.84]
  ];
  const startAngle = 24;
  const endAngle = 156;
  const angleStep = 4.8;

  for (let band = 0; band < rainbowColors.length; band += 1) {
    const bandRadius = radius - band * 0.42;
    const glowColor = [
      rainbowColors[band][0],
      rainbowColors[band][1],
      rainbowColors[band][2],
      0.2
    ];

    for (let angleDegrees = startAngle; angleDegrees <= endAngle; angleDegrees += angleStep) {
      const angle = angleDegrees * Math.PI / 180;
      const x = centerX + Math.cos(angle) * bandRadius;
      const y = baseY + Math.sin(angle) * bandRadius;
      drawBox(x - 0.62, y - 0.04, centerZ - 0.22, 1.24, 0.18, 0.44, glowColor, -1, 0.0);
      drawBox(x - 0.42, y, centerZ - 0.18, 0.84, 0.14, 0.36, rainbowColors[band], -1, 0.0);
    }
  }
}

function renderRainbowLandScene() {
  gl.clearColor(0.42, 0.62, 0.91, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);

  renderSky();
  drawBox(-18, -0.75, -18, 36, 0.75, 36, [0.92, 0.98, 0.9, 1.0], TEXTURE_IDS.grass, 0.9);

  renderRainbowArc(0.0, -5.4, -16.8, 17.4);
  if (isRainbowDetailVisible(7.3, 4.2, RAINBOW_BRIDGE_RENDER_DISTANCE)) {
    renderRainbowPond(2.3, 1.0, 10.0, 6.4, TEXTURE_IDS.water);
    renderRainbowBridge(7.2, 4.25, 1.0);
  }
  if (isRainbowDetailVisible(-8.6, 4.4, RAINBOW_SMALL_POND_RENDER_DISTANCE)) {
    renderRainbowPond(-11.0, 2.8, 4.8, 3.2, TEXTURE_IDS.water);
  }
  if (isRainbowDetailVisible(-8.6, 4.4, RAINBOW_FOUNTAIN_RENDER_DISTANCE)) {
    renderRainbowFountain(-8.6, 4.4, 0.78);
  }
  if (isRainbowDetailVisible(0.0, -11.1, RAINBOW_PORTAL_RENDER_DISTANCE)) {
    renderRainbowPortal(0.0, -11.1, 1.18);
  }
  if (isRainbowDetailVisible(RAINBOW_GAZEBO_CENTER_X, RAINBOW_GAZEBO_CENTER_Z, RAINBOW_DOME_RENDER_DISTANCE)) {
    renderRainbowGardenDome(RAINBOW_GAZEBO_CENTER_X, RAINBOW_GAZEBO_CENTER_Z, 0.94);
  }

  renderRainbowPavementPath(
    RAINBOW_MAIN_PATH_POINTS,
    1.02,
    0.74,
    [0.95, 0.96, 0.99, 1.0],
    [0.84, 0.88, 0.94, 1.0]
  );
  renderRainbowPavementPath(
    RAINBOW_GAZEBO_PATH_POINTS,
    0.96,
    0.7,
    [0.95, 0.96, 0.99, 1.0],
    [0.84, 0.88, 0.94, 1.0]
  );
  renderRainbowPavementPath(
    RAINBOW_PORTAL_PATH_POINTS,
    1.02,
    0.8,
    [0.96, 0.97, 1.0, 1.0],
    [0.86, 0.9, 0.95, 1.0]
  );
  if (isRainbowDetailVisible(0.0, -11.1, RAINBOW_PORTAL_RENDER_DISTANCE)) {
    drawBox(-2.35, 0.02, -9.2, 4.7, 0.1, 1.9, [0.94, 0.96, 0.99, 1.0], TEXTURE_IDS.stone, 0.9);
    drawBox(-1.96, 0.1, -8.92, 3.92, 0.04, 1.34, [0.99, 0.99, 1.0, 1.0], TEXTURE_IDS.stone, 0.74);
  }

  for (let i = 0; i < RAINBOW_TREE_SPOTS.length; i += 1) {
    const spot = RAINBOW_TREE_SPOTS[i];
    if (!isRainbowDetailVisible(spot[1], spot[2], RAINBOW_TREE_RENDER_DISTANCE)) {
      continue;
    }

    if (spot[0] === 'leaf') {
      renderRainbowLeafTree(spot[1], spot[2], spot[3]);
    } else {
      renderRainbowTree(spot[1], spot[2], spot[3]);
    }
  }

  for (let i = 0; i < RAINBOW_BUSH_SPOTS.length; i += 1) {
    const spot = RAINBOW_BUSH_SPOTS[i];
    if (!isRainbowDetailVisible(spot[0], spot[1], RAINBOW_BUSH_RENDER_DISTANCE)) {
      continue;
    }

    renderRainbowBush(spot[0], spot[1], spot[2], [0.39, 0.66, 0.27, 1.0], [0.56, 0.79, 0.38, 1.0]);
  }

  renderResolvedRainbowFlowers(g_rainbowHandFlowerPatches, RAINBOW_HAND_FLOWER_RENDER_DISTANCE);
  renderResolvedRainbowFlowers(g_rainbowResolvedFlowerPatches, RAINBOW_FLOWER_RENDER_DISTANCE);

  for (let i = 0; i < RAINBOW_GRASS_SPOTS.length; i += 1) {
    const spot = RAINBOW_GRASS_SPOTS[i];
    if (!isRainbowDetailVisible(spot[0], spot[1], RAINBOW_GRASS_RENDER_DISTANCE)) {
      continue;
    }

    if (isRainbowOnGardenPath(spot[0], spot[1], 0.2) ||
      isRainbowInsideGazeboFootprint(spot[0], spot[1], 0.2)) {
      continue;
    }

    renderRainbowGrassPatch(spot[0], spot[1], spot[2], spot[3]);
  }

  for (let i = 0; i < RAINBOW_LILYPAD_SPOTS.length; i += 1) {
    const spot = RAINBOW_LILYPAD_SPOTS[i];
    if (!isRainbowDetailVisible(spot[0], spot[1], RAINBOW_LILYPAD_RENDER_DISTANCE)) {
      continue;
    }

    renderRainbowLilyPad(spot[0], spot[1], spot[2], spot[3]);
  }

  for (let i = 0; i < RAINBOW_BUTTERFLY_SPOTS.length; i += 1) {
    const spot = RAINBOW_BUTTERFLY_SPOTS[i];
    if (!isRainbowDetailVisible(spot[0], spot[2], RAINBOW_BUTTERFLY_RENDER_DISTANCE)) {
      continue;
    }

    renderRainbowButterfly(spot[0], spot[1], spot[2], spot[3], spot[4], spot[5]);
  }

  const championColors = g_rainbowChampion === 'clover' ? CLOVER_NPC_COLORS : HORSE_AVATAR_COLORS;
  renderHorseAvatar({
    x: 0.0,
    y: PLAYER_HORSE_Y + 0.05,
    z: -7.65,
    yaw: 180,
    seconds: g_seconds,
    isMoving: false,
    animationMode: 4,
    scale: 1.36,
    colors: championColors
  });
  updateHud();
}

function renderRaceScene() {
  gl.clearColor(0.8, 0.9, 0.98, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const raceViewMatrix = getRaceViewMatrix();
  gl.uniformMatrix4fv(u_ViewMatrix, false, raceViewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);

  renderRaceTrackBase();
  renderRaceTrackFinishLine();
  renderRaceTrackHurdles();
  renderRaceHorse(g_raceHorses.hazel);
  renderRaceHorse(g_raceHorses.clover);
  updateHud();
}

function renderHighlight() {
  const cell = getFrontCell();
  if (!cell) {
    return;
  }

  const matrix = new Matrix4();
  matrix.translate(cellToWorld(cell.x) + 0.03, g_worldMap[cell.z][cell.x] + 0.01, cellToWorld(cell.z) + 0.03);
  matrix.scale(0.94, 0.06, 0.94);
  drawCube(matrix, [1.0, 0.84, 0.24, HIGHLIGHT_ALPHA], -1, 0.0);
}

function getActiveViewMatrix() {
  if (isExploreMode() || g_viewMode === VIEW_MODES.first) {
    return g_camera.viewMatrix;
  }
  const secondView = new Matrix4();
  const placement = getSecondPersonCameraPlacement();

  secondView.setLookAt(
    placement.eyeX,
    placement.eyeY,
    placement.eyeZ,
    placement.targetX,
    placement.targetY,
    placement.targetZ,
    0,
    1,
    0
  );

  return secondView;
}

function renderScene() {
  resizeCanvas();
  if (g_gameMode === GAME_MODES.race) {
    renderRaceScene();
    return;
  }
  if (g_gameMode === GAME_MODES.rainbow) {
    renderRainbowLandScene();
    return;
  }

  gl.clearColor(0.57, 0.73, 0.95, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const activeViewMatrix = getActiveViewMatrix();
  gl.uniformMatrix4fv(u_ViewMatrix, false, activeViewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);

  renderSky();
  renderGround();
  renderFieldGrass();
  renderFieldFlowers();
  renderPathsAndWater();
  renderWorldBlocks();
  renderApples();
  renderPaddockProps();
  renderPlayerHorse();
  renderHighlight();
  updateHud();
}

function tick(now) {
  if (!g_lastFrameTime) {
    g_lastFrameTime = now;
  }

  const delta = now - g_lastFrameTime;
  g_lastFrameTime = now;
  if (delta > 0) {
    g_fpsSampleElapsed += delta;
    g_fpsSampleFrames += 1;

    if (g_fpsSampleElapsed >= 300) {
      g_fps = (g_fpsSampleFrames * 1000) / g_fpsSampleElapsed;
      g_fpsSampleElapsed = 0;
      g_fpsSampleFrames = 0;
    }
  }

  g_seconds = now / 1000;
  if (g_gameMode === GAME_MODES.race) {
    updateRaceState(delta / 1000);
  } else if (g_gameMode === GAME_MODES.meadow) {
    updatePlayerMovementState();
    updateMeetingStory();
  }
  updateVictorySequence();
  renderScene();
  requestAnimationFrame(tick);
}

function main() {
  if (!setupWebGL()) {
    return;
  }

  if (!connectVariablesToGLSL()) {
    return;
  }

  initializeWorld();
  g_cube = new Cube();
  g_cone = new Cone();
  g_sphere = new Sphere();
  g_longDiamond = new LongDiamond();
  g_camera = new Camera(canvas);
  g_camera.setPosition(cellCenter(2), PLAYER_HEIGHT, cellCenter(28));
  g_camera.setYawPitch(-30, -10);
  syncPlayerPoseFromCamera();
  g_lastPlayerX = g_playerX;
  g_lastPlayerZ = g_playerZ;

  addKeyboardControls();
  addMouseControls();
  addInterfaceControls();
  initTextures();
  initImportedModels();
  updateControlsGuide();
  canvas.focus();

  requestAnimationFrame(tick);
}
