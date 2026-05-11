var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;

  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;

  void main() {
    gl_FragColor = u_FragColor;
  }`;

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let g_globalAngle = 20;
let g_globalXAngle = -12;
let g_isDragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

let g_animationOn = false;
let g_animationMode = 0;
let g_pokeActive = false;
let g_pokeStartSeconds = 0;
let g_pokeBaseHeadAngle = 0;
let g_pokeBaseTailAngle = 0;
let g_pokeBaseTailTipAngle = 0;
let g_pokeBaseTailCurlAngle = 0;

let g_startTime = performance.now() / 1000.0;
let g_seconds = 0;
let g_lastFrameTime = performance.now();
let g_fps = 0;

const HORSE_COLORS = {
  coat: [0.58, 0.39, 0.24, 1.0],
  coatLight: [0.68, 0.49, 0.31, 1.0],
  mane: [0.22, 0.12, 0.06, 1.0],
  hoof: [0.14, 0.09, 0.07, 1.0],
  sock: [0.97, 0.95, 0.93, 1.0],
  muzzle: [0.68, 0.49, 0.31, 1.0],
  eyeWhite: [0.97, 0.96, 0.93, 1.0],
  pupil: [0.33, 0.19, 0.09, 1.0],
  earInner: [0.86, 0.67, 0.58, 1.0],
  nostril: [0.24, 0.12, 0.08, 1.0]
};

const GRASS_COLORS = {
  fieldDark: [0.31, 0.56, 0.21, 1.0],
  fieldLight: [0.42, 0.68, 0.28, 1.0],
  bladeBase: [0.18, 0.45, 0.12, 1.0],
  bladeMid: [0.24, 0.57, 0.16, 1.0],
  bladeTip: [0.33, 0.68, 0.21, 1.0]
};

const DEFAULT_POSE = {
  frontUpper: 18,
  frontLower: 8,
  backUpper: -9,
  backLower: -2,
  head: -90,
  neck: 80,
  tail: 20,
  tailTip: 12,
  tailCurl: 8
};

let g_frontUpperAngle = DEFAULT_POSE.frontUpper;
let g_frontLowerAngle = DEFAULT_POSE.frontLower;
let g_backUpperAngle = DEFAULT_POSE.backUpper;
let g_backLowerAngle = DEFAULT_POSE.backLower;
let g_headAngle = DEFAULT_POSE.head;
let g_neckAngle = DEFAULT_POSE.neck;
let g_tailAngle = DEFAULT_POSE.tail;
let g_tailTipAngle = DEFAULT_POSE.tailTip;
let g_tailCurlAngle = DEFAULT_POSE.tailCurl;
let g_bodyYOffset = 0;
let g_bodyTilt = 0;
let g_bodyXOffset = 0;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');

  if (a_Position < 0 || !u_FragColor || !u_ModelMatrix || !u_GlobalRotateMatrix) {
    console.log('Failed to get GLSL variable locations');
    return;
  }

  const identityMatrix = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityMatrix.elements);
}

function addSliderControl(id, setter) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.addEventListener('input', function() {
    setter(Number(this.value));
    renderScene();
  });
}

function syncControls() {
  const values = {
    angleSlide: g_globalAngle,
    frontUpperSlide: g_frontUpperAngle,
    frontLowerSlide: g_frontLowerAngle,
    backUpperSlide: g_backUpperAngle,
    backLowerSlide: g_backLowerAngle,
    headSlide: g_headAngle,
    neckSlide: g_neckAngle,
    tailSlide: g_tailAngle,
    tailTipSlide: g_tailTipAngle,
    tailCurlSlide: g_tailCurlAngle
  };

  for (const id in values) {
    const input = document.getElementById(id);
    if (input) {
      input.value = values[id];
    }
  }
}

function resetPose() {
  g_frontUpperAngle = DEFAULT_POSE.frontUpper;
  g_frontLowerAngle = DEFAULT_POSE.frontLower;
  g_backUpperAngle = DEFAULT_POSE.backUpper;
  g_backLowerAngle = DEFAULT_POSE.backLower;
  g_headAngle = DEFAULT_POSE.head;
  g_neckAngle = DEFAULT_POSE.neck;
  g_tailAngle = DEFAULT_POSE.tail;
  g_tailTipAngle = DEFAULT_POSE.tailTip;
  g_tailCurlAngle = DEFAULT_POSE.tailCurl;
  g_bodyYOffset = 0;
  g_bodyTilt = 0;
  g_bodyXOffset = 0;
  syncControls();
}

function setAnimationMode(mode) {
  g_animationMode = mode;
  g_animationOn = mode !== 0;
  if (!g_animationOn) {
    resetPose();
  }
  renderScene();
}

function addActionsForHtmlUI() {
  addSliderControl('angleSlide', function(value) { g_globalAngle = value; });
  addSliderControl('frontUpperSlide', function(value) { g_frontUpperAngle = value; });
  addSliderControl('frontLowerSlide', function(value) { g_frontLowerAngle = value; });
  addSliderControl('backUpperSlide', function(value) { g_backUpperAngle = value; });
  addSliderControl('backLowerSlide', function(value) { g_backLowerAngle = value; });
  addSliderControl('headSlide', function(value) { g_headAngle = value; });
  addSliderControl('neckSlide', function(value) { g_neckAngle = value; });
  addSliderControl('tailSlide', function(value) { g_tailAngle = value; });
  addSliderControl('tailTipSlide', function(value) { g_tailTipAngle = value; });
  addSliderControl('tailCurlSlide', function(value) { g_tailCurlAngle = value; });

  const animation1Button = document.getElementById('animation1Button');
  if (animation1Button) {
    animation1Button.onclick = function() {
      setAnimationMode(1);
    };
  }

  const animation2Button = document.getElementById('animation2Button');
  if (animation2Button) {
    animation2Button.onclick = function() {
      setAnimationMode(2);
    };
  }

  const animation3Button = document.getElementById('animation3Button');
  if (animation3Button) {
    animation3Button.onclick = function() {
      setAnimationMode(3);
    };
  }

  const animation4Button = document.getElementById('animation4Button');
  if (animation4Button) {
    animation4Button.onclick = function() {
      setAnimationMode(4);
    };
  }

  const animationOffButton = document.getElementById('animationOffButton');
  if (animationOffButton) {
    animationOffButton.onclick = function() {
      setAnimationMode(0);
    };
  }

  const resetPoseButton = document.getElementById('resetPoseButton');
  if (resetPoseButton) {
    resetPoseButton.onclick = function() {
      g_animationOn = false;
      g_animationMode = 0;
      resetPose();
      renderScene();
    };
  }
}

function addMouseControls() {
  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) {
      g_pokeActive = true;
      g_pokeStartSeconds = g_seconds;
      g_pokeBaseHeadAngle = g_headAngle;
      g_pokeBaseTailAngle = g_tailAngle;
      g_pokeBaseTailTipAngle = g_tailTipAngle;
      g_pokeBaseTailCurlAngle = g_tailCurlAngle;
      renderScene();
      return;
    }

    g_isDragging = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };

  canvas.onmousemove = function(ev) {
    if (!g_isDragging) {
      return;
    }

    const deltaX = ev.clientX - g_lastMouseX;
    const deltaY = ev.clientY - g_lastMouseY;
    g_globalAngle += deltaX * 0.4;
    g_globalXAngle = Math.max(-50, Math.min(40, g_globalXAngle + deltaY * 0.25));
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
    syncControls();
    renderScene();
  };

  canvas.onmouseup = function() {
    g_isDragging = false;
  };

  canvas.onmouseleave = function() {
    g_isDragging = false;
  };
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  addMouseControls();
  resetPose();

  gl.clearColor(0.82, 0.92, 0.98, 1.0);
  requestAnimationFrame(tick);
}

function tick() {
  const now = performance.now();
  const frameDuration = now - g_lastFrameTime;
  g_lastFrameTime = now;
  if (frameDuration > 0) {
    g_fps = 1000 / frameDuration;
  }

  g_seconds = now / 1000.0 - g_startTime;
  updateAnimationAngles();
  renderScene();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_pokeActive && g_seconds - g_pokeStartSeconds > 1.2) {
    g_pokeActive = false;
  }

  g_bodyYOffset = 0;
  g_bodyTilt = 0;
  g_bodyXOffset = 0;

  if (g_animationOn) {
    if (g_animationMode === 1) {
      const swing = Math.sin(g_seconds * 3.2);
      const lowerSwing = Math.sin(g_seconds * 3.2 + 2.9);
      const tailWave = Math.sin(g_seconds * 3.6);
      const headBob = Math.sin(g_seconds * 1.7);

      g_frontUpperAngle = DEFAULT_POSE.frontUpper + 90 * swing;
      g_frontLowerAngle = DEFAULT_POSE.frontLower - 34 * Math.max(0, -lowerSwing);
      g_backUpperAngle = DEFAULT_POSE.backUpper - 90 * swing;
      g_backLowerAngle = DEFAULT_POSE.backLower - 90 * Math.max(0, lowerSwing);
      g_headAngle = DEFAULT_POSE.head + 6 * headBob;
      g_neckAngle = DEFAULT_POSE.neck + 4 * Math.sin(g_seconds * 1.7 + 0.4);
      g_tailAngle = DEFAULT_POSE.tail + 30 * tailWave;
      g_tailTipAngle = DEFAULT_POSE.tailTip + 24 * Math.sin(g_seconds * 3.6 + 0.55);
      g_tailCurlAngle = DEFAULT_POSE.tailCurl + 26 * Math.sin(g_seconds * 3.6 + 1.1);
      g_bodyYOffset = 0.012 * Math.sin(g_seconds * 6.4);
    } else if (g_animationMode === 2) {
      const jump = Math.max(0, Math.sin(g_seconds * 3.2));
      const bow = Math.sin(g_seconds * 3.2 - 0.6);
      g_frontUpperAngle = DEFAULT_POSE.frontUpper;
      g_frontLowerAngle = DEFAULT_POSE.frontLower;
      g_backUpperAngle = -28 - 10 * jump;
      g_backLowerAngle = -18 + 12 * jump;
      g_headAngle = DEFAULT_POSE.head + 6 + 18 * bow + 8 * jump;
      g_neckAngle = DEFAULT_POSE.neck + 4 + 22 * bow + 10 * jump;
      g_tailAngle = DEFAULT_POSE.tail + 18 + 18 * Math.sin(g_seconds * 3.2 + 0.8);
      g_tailTipAngle = DEFAULT_POSE.tailTip + 14 + 14 * Math.sin(g_seconds * 3.2 + 1.0);
      g_tailCurlAngle = DEFAULT_POSE.tailCurl + 12 + 12 * Math.sin(g_seconds * 3.2 + 1.2);
      g_bodyYOffset = 0.16 * jump;
      g_bodyTilt = 10 + 6 * jump;
      g_bodyXOffset = 0.02 * jump;
    } else if (g_animationMode === 3) {
      const pawLift = 0.5 + 0.5 * Math.sin(g_seconds * 4.7 - Math.PI / 2);
      g_frontUpperAngle = DEFAULT_POSE.frontUpper - 72 * pawLift;
      g_frontLowerAngle = DEFAULT_POSE.frontLower + 26 * pawLift;
      g_backUpperAngle = DEFAULT_POSE.backUpper;
      g_backLowerAngle = DEFAULT_POSE.backLower;
      g_headAngle = DEFAULT_POSE.head + 2 - 8 * pawLift;
      g_neckAngle = DEFAULT_POSE.neck - 24 * pawLift;
      g_tailAngle = DEFAULT_POSE.tail + 10 * Math.sin(g_seconds * 2.0);
      g_tailTipAngle = DEFAULT_POSE.tailTip + 8 * Math.sin(g_seconds * 2.0 + 0.4);
      g_tailCurlAngle = DEFAULT_POSE.tailCurl + 6 * Math.sin(g_seconds * 2.0 + 0.8);
      g_bodyTilt = 2;
    } else if (g_animationMode === 4) {
      const rearKick = Math.sin(g_seconds * 5.4);
      g_frontUpperAngle = -72 + 16 * rearKick;
      g_frontLowerAngle = 34 + 18 * Math.sin(g_seconds * 5.4 + 0.9);
      g_backUpperAngle = -18 + 3 * Math.sin(g_seconds * 2.7);
      g_backLowerAngle = -1 - 3 * Math.max(0, Math.sin(g_seconds * 2.7 + 0.8));
      g_headAngle = DEFAULT_POSE.head + 20 + 4 * Math.sin(g_seconds * 2.2);
      g_neckAngle = DEFAULT_POSE.neck - 18 + 4 * Math.sin(g_seconds * 2.2 + 0.3);
      g_tailAngle = DEFAULT_POSE.tail + 18 * Math.sin(g_seconds * 3.8);
      g_tailTipAngle = DEFAULT_POSE.tailTip + 14 * Math.sin(g_seconds * 3.8 + 0.5);
      g_tailCurlAngle = DEFAULT_POSE.tailCurl + 16 * Math.sin(g_seconds * 3.8 + 1.0);
      g_bodyYOffset = -0.08 + 0.004 * Math.max(0, Math.sin(g_seconds * 2.7));
      g_bodyTilt = 24;
      g_bodyXOffset = 0.008;
    }
  }

  if (g_pokeActive) {
    const poke = Math.sin((g_seconds - g_pokeStartSeconds) * 18.0);
    g_headAngle = g_pokeBaseHeadAngle + 12 * poke;
    g_tailAngle = g_pokeBaseTailAngle + 35 * poke;
    g_tailTipAngle = g_pokeBaseTailTipAngle + 28 * poke;
    g_tailCurlAngle = g_pokeBaseTailCurlAngle + 24 * poke;
  }

  syncControls();
}

function renderCube(matrix, color) {
  const cube = new Cube();
  cube.color = color;
  cube.matrix = matrix;
  cube.render();
}

function renderCone(matrix, color, segments) {
  const cone = new Cone();
  cone.color = color;
  cone.matrix = matrix;
  if (segments) {
    cone.segments = segments;
  }
  cone.render();
}

function makeScaledCone(baseMatrix, tx, ty, tz, sx, sy, sz, color, segments) {
  const matrix = new Matrix4(baseMatrix);
  matrix.translate(tx, ty, tz);
  matrix.scale(sx, sy, sz);
  renderCone(matrix, color, segments);
}

function makeRotatedCone(baseMatrix, tx, ty, tz, angle, ax, ay, az, sx, sy, sz, color, segments) {
  const matrix = new Matrix4(baseMatrix);
  matrix.translate(tx, ty, tz);
  matrix.rotate(angle, ax, ay, az);
  matrix.scale(sx, sy, sz);
  renderCone(matrix, color, segments);
}

function renderTriangle(matrix, color, vertices) {
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  drawTriangle3D(vertices);
}

function makeScaledCube(baseMatrix, tx, ty, tz, sx, sy, sz, color) {
  const matrix = new Matrix4(baseMatrix);
  matrix.translate(tx, ty, tz);
  matrix.scale(sx, sy, sz);
  renderCube(matrix, color);
}

function renderLeg(anchorMatrix, upperAngle, lowerAngle, sideBend, isFront) {
  const thighWidth = isFront ? 0.145 : 0.16;
  const thighLength = isFront ? 0.145 : 0.155;
  const thighDepth = 0.12;
  const upperWidth = isFront ? 0.1 : 0.11;
  const upperLength = isFront ? 0.18 : 0.19;
  const lowerWidth = isFront ? 0.056 : 0.06;
  const lowerLength = isFront ? 0.19 : 0.18;
  const hoofLength = isFront ? 0.1 : 0.105;
  const hoofHeight = 0.055;
  const hoofDepth = 0.095;
  const outwardOffset = sideBend < 0 ? -0.042 : 0.042;
  const kneeOffset = isFront ? -0.03 : -0.02;
  const thighX = isFront ? -thighWidth / 2 : -0.07;
  const thighY = isFront ? -0.005 : -0.01;
  const lowerX = isFront ? -0.018 : -0.045;
  const lowerZ = isFront ? -lowerWidth / 2 : -0.028;
  const hindShinAngle = isFront ? -18 : 18;

  const upperFrame = new Matrix4(anchorMatrix);
  upperFrame.translate(0.0, -0.04, outwardOffset - 0.002);
  upperFrame.rotate(sideBend * 0.18, 1, 0, 0);
  upperFrame.rotate(upperAngle, 0, 0, 1);

  const thighPart = new Matrix4(upperFrame);
  thighPart.translate(thighX, thighY, -thighDepth / 2);
  thighPart.scale(thighWidth, thighLength, thighDepth);
  renderCube(thighPart, HORSE_COLORS.coatLight);

  const upperPart = new Matrix4(upperFrame);
  upperPart.translate(-upperWidth / 2, -upperLength, -upperWidth / 2);
  upperPart.scale(upperWidth, upperLength, upperWidth);
  renderCube(upperPart, HORSE_COLORS.coat);

  const kneeFrame = new Matrix4(upperFrame);
  kneeFrame.translate(kneeOffset, -upperLength + 0.005, 0);
  kneeFrame.rotate(lowerAngle, 0, 0, 1);
  kneeFrame.rotate(hindShinAngle, 0, 0, 1);

  const lowerPart = new Matrix4(kneeFrame);
  lowerPart.translate(lowerX, -lowerLength, lowerZ);
  lowerPart.scale(lowerWidth, lowerLength, lowerWidth);
  renderCube(lowerPart, HORSE_COLORS.coat);

  const fetlockPart = new Matrix4(kneeFrame);
  fetlockPart.translate(isFront ? -0.048 : -0.055, -lowerLength + 0.005, -0.048);
  fetlockPart.scale(0.12, 0.11, 0.12);
  renderCone(fetlockPart, [0.68, 0.49, 0.31, 1.0], 10);

  const hoofPart = new Matrix4(kneeFrame);
  hoofPart.translate(isFront ? -0.026 : -0.05, -lowerLength - hoofHeight + 0.004, -hoofDepth / 2);
  hoofPart.scale(hoofLength, hoofHeight, hoofDepth);
  renderCube(hoofPart, HORSE_COLORS.hoof);
}

function renderTailStrand(tailBase, xOffset, zOffset, rootTwist, widths, lengths) {
  const tailOffsets = [
    g_tailAngle * 0.62,
    (g_tailAngle + g_tailTipAngle) * 0.3,
    g_tailTipAngle * 0.42,
    (g_tailTipAngle + g_tailCurlAngle) * 0.24,
    g_tailCurlAngle * 0.32,
    g_tailCurlAngle * 0.22,
    g_tailTipAngle * 0.16
  ];
  let frame = new Matrix4(tailBase);
  frame.translate(xOffset, 0.0, zOffset);
  frame.rotate(rootTwist, 1, 0, 0);

  for (let i = 0; i < tailOffsets.length; i++) {
    frame.rotate(tailOffsets[i], 0, 0, 1);

    const width = widths[i];
    const length = lengths[i];
    const strand = new Matrix4(frame);
    strand.translate(-width / 2, -0.01, -width / 2);
    strand.scale(width, length, width);
    renderCone(strand, HORSE_COLORS.mane, 12);

    frame.translate(0.0, length * 0.78, 0.0);
  }
}

function renderTail(tailBase) {
  const root = new Matrix4(tailBase);
  root.rotate(-6, 1, 0, 0);

  const dock = new Matrix4(root);
  dock.translate(-0.045, -0.03, -0.035);
  dock.scale(0.09, 0.07, 0.07);
  renderCone(dock, HORSE_COLORS.coat, 12);

  renderTailStrand(
    root,
    0.0,
    0.0,
    0,
    [0.072, 0.068, 0.062, 0.056, 0.049, 0.041, 0.033],
    [0.11, 0.11, 0.105, 0.1, 0.095, 0.088, 0.08]
  );
  renderTailStrand(
    root,
    -0.004,
    -0.022,
    10,
    [0.05, 0.047, 0.043, 0.038, 0.033, 0.028, 0.022],
    [0.1, 0.1, 0.096, 0.092, 0.088, 0.082, 0.075]
  );
  renderTailStrand(
    root,
    -0.004,
    0.022,
    -10,
    [0.05, 0.047, 0.043, 0.038, 0.033, 0.028, 0.022],
    [0.1, 0.1, 0.096, 0.092, 0.088, 0.082, 0.075]
  );
  renderTailStrand(
    root,
    0.002,
    -0.04,
    18,
    [0.034, 0.032, 0.029, 0.026, 0.022, 0.019, 0.016],
    [0.09, 0.09, 0.087, 0.083, 0.079, 0.074, 0.068]
  );
  renderTailStrand(
    root,
    0.002,
    0.04,
    -18,
    [0.034, 0.032, 0.029, 0.026, 0.022, 0.019, 0.016],
    [0.09, 0.09, 0.087, 0.083, 0.079, 0.074, 0.068]
  );
}

function renderGrassBlade(baseMatrix, tx, ty, tz, sideSign, bendScale, sizeScale) {
  const bladeBase = new Matrix4(baseMatrix);
  bladeBase.translate(tx, ty, tz);
  bladeBase.rotate(sideSign * (14 + 8 * bendScale), 0, 0, 1);
  bladeBase.rotate(sideSign * 16, 1, 0, 0);

  const bottom = new Matrix4(bladeBase);
  bottom.scale(0.03 * sizeScale, 0.09 * sizeScale, 0.03 * sizeScale);
  renderCone(bottom, GRASS_COLORS.bladeBase, 8);

  const middleFrame = new Matrix4(bladeBase);
  middleFrame.translate(0.0, 0.065 * sizeScale, 0.0);
  middleFrame.rotate(sideSign * (12 + 10 * bendScale), 0, 0, 1);
  middleFrame.rotate(sideSign * 10, 1, 0, 0);

  const middle = new Matrix4(middleFrame);
  middle.scale(0.024 * sizeScale, 0.075 * sizeScale, 0.024 * sizeScale);
  renderCone(middle, GRASS_COLORS.bladeMid, 8);

  const tipFrame = new Matrix4(middleFrame);
  tipFrame.translate(0.0, 0.055 * sizeScale, 0.0);
  tipFrame.rotate(sideSign * (18 + 8 * bendScale), 0, 0, 1);
  tipFrame.rotate(sideSign * 8, 1, 0, 0);

  const tip = new Matrix4(tipFrame);
  tip.scale(0.016 * sizeScale, 0.06 * sizeScale, 0.016 * sizeScale);
  renderCone(tip, GRASS_COLORS.bladeTip, 8);
}

function renderGrassClump(baseMatrix, tx, ty, tz, scale) {
  renderGrassBlade(baseMatrix, tx, ty, tz, -1, 0.2, scale);
  renderGrassBlade(baseMatrix, tx + 0.03 * scale, ty + 0.002, tz + 0.015 * scale, 1, 0.45, scale * 1.05);
  renderGrassBlade(baseMatrix, tx - 0.028 * scale, ty, tz - 0.012 * scale, -1, 0.65, scale * 0.92);
  renderGrassBlade(baseMatrix, tx + 0.012 * scale, ty + 0.004, tz - 0.025 * scale, 1, 0.3, scale * 0.88);
  renderGrassBlade(baseMatrix, tx - 0.014 * scale, ty + 0.003, tz + 0.028 * scale, -1, 0.55, scale * 0.82);
}

function renderGrassField() {
  const fieldBase = new Matrix4();
  fieldBase.translate(-1.22, -0.9, -1.1);

  const fieldScale = new Matrix4(fieldBase);
  fieldScale.scale(2.5, 1.0, 2.3);

  renderTriangle(fieldScale, GRASS_COLORS.fieldDark, [
    0.0, 0.0, 0.0,
    1.0, 0.0, 0.06,
    0.0, 0.0, 1.0
  ]);
  renderTriangle(fieldScale, GRASS_COLORS.fieldLight, [
    1.0, 0.0, 0.06,
    1.0, 0.0, 1.0,
    0.0, 0.0, 1.0
  ]);
  renderTriangle(fieldScale, [0.36, 0.61, 0.24, 1.0], [
    0.0, 0.0, 0.38,
    1.0, 0.0, 0.44,
    0.5, 0.06, 0.9
  ]);

  const clumpBase = new Matrix4();
  clumpBase.translate(-1.05, -0.88, -0.92);

  renderGrassClump(clumpBase, 0.18, 0.0, 0.18, 1.1);
  renderGrassClump(clumpBase, 0.44, 0.0, 0.36, 0.95);
  renderGrassClump(clumpBase, 0.72, 0.0, 0.2, 1.0);
  renderGrassClump(clumpBase, 0.98, 0.0, 0.42, 1.08);
  renderGrassClump(clumpBase, 1.32, 0.0, 0.26, 0.92);
  renderGrassClump(clumpBase, 1.58, 0.0, 0.5, 1.0);
  renderGrassClump(clumpBase, 1.88, 0.0, 0.3, 0.9);
  renderGrassClump(clumpBase, 0.28, 0.0, 0.82, 0.9);
  renderGrassClump(clumpBase, 0.62, 0.0, 0.98, 1.05);
  renderGrassClump(clumpBase, 0.94, 0.0, 0.86, 0.88);
  renderGrassClump(clumpBase, 1.26, 0.0, 1.04, 0.96);
  renderGrassClump(clumpBase, 1.58, 0.0, 0.88, 0.84);
  renderGrassClump(clumpBase, 1.92, 0.0, 1.02, 0.98);
  renderGrassClump(clumpBase, 1.44, 0.0, 0.62, 0.92);
  renderGrassClump(clumpBase, 1.72, 0.0, 0.68, 0.86);
  renderGrassClump(clumpBase, 1.98, 0.0, 0.74, 0.94);
  renderGrassClump(clumpBase, 2.18, 0.0, 0.82, 0.9);
  renderGrassClump(clumpBase, 1.52, 0.0, 1.22, 0.88);
  renderGrassClump(clumpBase, 1.82, 0.0, 1.28, 0.96);
  renderGrassClump(clumpBase, 2.08, 0.0, 1.34, 0.9);
  renderGrassClump(clumpBase, 2.1, 0.0, 0.16, 0.94);
  renderGrassClump(clumpBase, 2.26, 0.0, 0.44, 1.02);
  renderGrassClump(clumpBase, 2.4, 0.0, 0.78, 0.9);
  renderGrassClump(clumpBase, 2.18, 0.0, 1.08, 0.88);
  renderGrassClump(clumpBase, 2.48, 0.0, 1.18, 0.96);
}

function renderHead(neckTip) {
  const headBase = new Matrix4(neckTip);
  headBase.rotate(g_headAngle, 0, 0, 1);

  makeScaledCube(headBase, -0.06, 0.0, -0.075, 0.17, 0.135, 0.15, HORSE_COLORS.coat);

  // const browBase = new Matrix4(headBase);
  // browBase.translate(0.08, .02, 0.0);
  // browBase.rotate(-18, 0, 0, 1);
  // makeScaledCube(browBase, 0.09, -0.05, -0.062, 0.16, 0.06, 0.125, HORSE_COLORS.coatLight);

  const muzzleBase = new Matrix4(headBase);
  muzzleBase.translate(0.17, -0.005, 0.01);
  muzzleBase.rotate(0, 0, 0, 1);
  makeScaledCube(muzzleBase, -0.08, 0.054, -0.07, 0.19, 0.085, 0.12, HORSE_COLORS.muzzle);

  const jawBase = new Matrix4(muzzleBase);
  jawBase.translate(0.1, -0.03, 0.0);
  jawBase.rotate(0, 0, 0, 1);
  makeScaledCube(jawBase, -0.20, 0.04, -0.06, 0.18, 0.05, 0.1, HORSE_COLORS.muzzle);

  // const cheek = new Matrix4(headBase);
  // cheek.translate(0.1, -0.015, 0.005);
  // cheek.rotate(-18, 0, 0, 1);
  // makeScaledCube(cheek, 0.0, -0.02, -0.06, 0.075, 0.07, 0.12, HORSE_COLORS.coatLight);

  makeScaledCube(headBase, -0.055, 0.10, -0.072, 0.05, 0.1, 0.05, HORSE_COLORS.coat);
  makeScaledCube(headBase, -0.026, 0.12, -0.068, 0.026, 0.06, 0.038, HORSE_COLORS.earInner);
  makeScaledCube(headBase, -0.055, 0.10, 0.022, 0.05, 0.1, 0.05, HORSE_COLORS.coat);
  makeScaledCube(headBase, -0.026, 0.12, 0.03, 0.026, 0.06, 0.038, HORSE_COLORS.earInner);

  makeScaledCube(headBase, 0.02, 0.08, -0.082, 0.02, 0.02, 0.02, HORSE_COLORS.eyeWhite);
  makeScaledCube(headBase, 0.032, 0.08, -0.085, 0.01, 0.01, 0.01, HORSE_COLORS.pupil);
  makeScaledCube(headBase, 0.02, 0.08, 0.06, 0.02, 0.02, 0.02, HORSE_COLORS.eyeWhite);
  makeScaledCube(headBase, 0.032, 0.08, 0.08, 0.01, 0.01, 0.01, HORSE_COLORS.pupil);

  makeScaledCube(muzzleBase, 0.1, 0.11, -0.06, 0.012, 0.015, 0.015, HORSE_COLORS.nostril);
  makeScaledCube(muzzleBase, 0.1, 0.11, 0.03, 0.012, 0.015, 0.015, HORSE_COLORS.nostril);

  makeRotatedCone(headBase, -0.075, 0.118, -0.043, 48, 0, 0, 1, 0.018, 0.045, 0.024, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.09, 0.095, -0.046, 38, 0, 0, 1, 0.022, 0.05, 0.026, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.095, 0.062, -0.048, 28, 0, 0, 1, 0.022, 0.046, 0.026, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.055, 0.11, -0.03, 42, 0, 0, 1, 0.016, 0.036, 0.022, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.105, 0.082, -0.034, 32, 0, 0, 1, 0.018, 0.04, 0.024, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.108, 0.05, -0.036, 24, 0, 0, 1, 0.016, 0.034, 0.022, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.075, 0.118, 0.001, -48, 0, 0, 1, 0.018, 0.045, 0.024, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.09, 0.095, 0.004, -38, 0, 0, 1, 0.022, 0.05, 0.026, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.095, 0.062, 0.006, -28, 0, 0, 1, 0.022, 0.046, 0.026, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.055, 0.11, -0.012, -42, 0, 0, 1, 0.016, 0.036, 0.022, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.105, 0.082, -0.008, -32, 0, 0, 1, 0.018, 0.04, 0.024, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.108, 0.05, -0.006, -24, 0, 0, 1, 0.016, 0.034, 0.022, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.083, 0.108, -0.022, 44, 0, 0, 1, 0.02, 0.042, 0.024, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.097, 0.088, -0.022, 34, 0, 0, 1, 0.02, 0.042, 0.024, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.102, 0.066, -0.021, 26, 0, 0, 1, 0.018, 0.038, 0.022, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.083, 0.108, -0.003, -44, 0, 0, 1, 0.02, 0.042, 0.024, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.097, 0.088, -0.003, -34, 0, 0, 1, 0.02, 0.042, 0.024, HORSE_COLORS.mane, 8);
  makeRotatedCone(headBase, -0.102, 0.066, -0.002, -26, 0, 0, 1, 0.018, 0.038, 0.022, HORSE_COLORS.mane, 8);

}

function renderHorse() {
  const horseFrame = new Matrix4();
  horseFrame.translate(-0.38 + g_bodyXOffset, -0.27 + g_bodyYOffset, -0.2);
  horseFrame.rotate(-4 + g_bodyTilt, 0, 0, 1);
  horseFrame.scale(1.14, 1.38, 1.14);

  let frontLeftUpperAngle = g_frontUpperAngle;
  let frontRightUpperAngle = g_frontUpperAngle;
  let backLeftUpperAngle = g_backUpperAngle;
  let backRightUpperAngle = g_backUpperAngle;
  let frontLeftLowerAngle = g_frontLowerAngle;
  let frontRightLowerAngle = g_frontLowerAngle;
  let backLeftLowerAngle = g_backLowerAngle;
  let backRightLowerAngle = g_backLowerAngle;

  if (g_animationMode === 1) {
    const gaitSwing = Math.sin(g_seconds * 3.2);
    const gaitBend = Math.sin(g_seconds * 3.2 + 0.9);
    const hoofLift = Math.sin(g_seconds * 3.2 + 0.35);

    frontLeftUpperAngle = DEFAULT_POSE.frontUpper + 18 * gaitSwing;
    backLeftUpperAngle = DEFAULT_POSE.backUpper + 16 * gaitSwing;
    frontRightUpperAngle = DEFAULT_POSE.frontUpper - 18 * gaitSwing;
    backRightUpperAngle = DEFAULT_POSE.backUpper - 16 * gaitSwing;

    frontLeftLowerAngle = DEFAULT_POSE.frontLower - 34 * Math.max(0, -gaitBend) - 8 * Math.max(0, -hoofLift);
    backLeftLowerAngle = DEFAULT_POSE.backLower - 26 * Math.max(0, -gaitBend) - 6 * Math.max(0, gaitSwing);
    frontRightLowerAngle = DEFAULT_POSE.frontLower - 34 * Math.max(0, gaitBend) - 8 * Math.max(0, hoofLift);
    backRightLowerAngle = DEFAULT_POSE.backLower - 26 * Math.max(0, gaitBend) + 6 * Math.max(0, gaitSwing);
  } else if (g_animationMode === 2) {
    const jump = Math.max(0, Math.sin(g_seconds * 3.2));
    
    frontLeftUpperAngle = DEFAULT_POSE.frontUpper;
    frontRightUpperAngle = DEFAULT_POSE.frontUpper;
    backLeftUpperAngle = -30 - 8 * jump;
    backRightUpperAngle = -30 - 8 * jump;

    frontLeftLowerAngle = DEFAULT_POSE.frontLower;
    frontRightLowerAngle = DEFAULT_POSE.frontLower;
    backLeftLowerAngle = -20 + 12 * jump;
    backRightLowerAngle = -20 + 12 * jump;
  } else if (g_animationMode === 3) {
    const pawLift = Math.max(0, Math.sin(g_seconds * 2.4));

    frontLeftUpperAngle = DEFAULT_POSE.frontUpper +98 * pawLift;
    frontRightUpperAngle = DEFAULT_POSE.frontUpper;
    backLeftUpperAngle = DEFAULT_POSE.backUpper;
    backRightUpperAngle = DEFAULT_POSE.backUpper;

    frontLeftLowerAngle = DEFAULT_POSE.frontLower - 90 * pawLift;
    frontRightLowerAngle = DEFAULT_POSE.frontLower;
    backLeftLowerAngle = DEFAULT_POSE.backLower;
    backRightLowerAngle = DEFAULT_POSE.backLower;
  } else if (g_animationMode === 4) {
    const kick = Math.sin(g_seconds * 5.4);
    const hindPush = Math.sin(g_seconds * 2.7);

    frontLeftUpperAngle = 72 + 12 * kick;
    frontRightUpperAngle = 72 - 12 * kick;
    backLeftUpperAngle = -24 + 2 * hindPush;
    backRightUpperAngle = -24 - 2 * hindPush;

    frontLeftLowerAngle = -58 + 10 * Math.sin(g_seconds * 5.4 + 0.8);
    frontRightLowerAngle = -58 + 10 * Math.sin(g_seconds * 5.4 + 1.5);
    backLeftLowerAngle = -1 - 2 * Math.max(0, hindPush);
    backRightLowerAngle = -1 - 2 * Math.max(0, -hindPush);
  }

  makeScaledCube(horseFrame, 0.0, 0.01, 0.03, 0.18, 0.21, 0.3, HORSE_COLORS.coatLight);
  makeScaledCube(horseFrame, 0.16, -0.005, 0.025, 0.3, 0.2, 0.29, HORSE_COLORS.coat);
  makeScaledCube(horseFrame, 0.42, 0.0, 0.03, 0.22, 0.24, 0.3, HORSE_COLORS.coatLight);

  const neckBase = new Matrix4(horseFrame);
  neckBase.translate(0.63, 0.15, 0.18);
  neckBase.rotate(g_neckAngle, 0, 0, 1);
  makeScaledCube(neckBase, 0.0, -0.06, -0.06, 0.24, 0.12, 0.12, HORSE_COLORS.coatLight);

  makeRotatedCone(neckBase, -0.025, 0.05, -0.004, -34, 0, 0, 1, 0.03, 0.062, 0.03, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.012, 0.06, -0.005, -30, 0, 0, 1, 0.03, 0.068, 0.03, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.054, 0.067, -0.006, -26, 0, 0, 1, 0.028, 0.064, 0.028, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.096, 0.071, -0.006, -20, 0, 0, 1, 0.026, 0.06, 0.026, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.138, 0.073, -0.005, -14, 0, 0, 1, 0.022, 0.052, 0.022, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.18, 0.076, -0.004, -8, 0, 0, 1, 0.02, 0.044, 0.02, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, -0.006, 0.054, -0.003, -28, 0, 0, 1, 0.022, 0.048, 0.022, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.036, 0.062, -0.004, -24, 0, 0, 1, 0.022, 0.048, 0.022, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.078, 0.067, -0.004, -18, 0, 0, 1, 0.02, 0.044, 0.02, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.12, 0.07, -0.003, -12, 0, 0, 1, 0.018, 0.038, 0.018, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, -0.025, 0.05, 0.004, 34, 0, 0, 1, 0.03, 0.062, 0.03, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.012, 0.06, 0.005, 30, 0, 0, 1, 0.03, 0.068, 0.03, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.054, 0.067, 0.006, 26, 0, 0, 1, 0.028, 0.064, 0.028, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.096, 0.071, 0.006, 20, 0, 0, 1, 0.026, 0.06, 0.026, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.138, 0.073, 0.005, 14, 0, 0, 1, 0.022, 0.052, 0.022, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.18, 0.076, 0.004, 8, 0, 0, 1, 0.02, 0.044, 0.02, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, -0.006, 0.054, 0.003, 28, 0, 0, 1, 0.022, 0.048, 0.022, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.036, 0.062, 0.004, 24, 0, 0, 1, 0.022, 0.048, 0.022, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.078, 0.067, 0.004, 18, 0, 0, 1, 0.02, 0.044, 0.02, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.12, 0.07, 0.003, 12, 0, 0, 1, 0.018, 0.038, 0.018, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, -0.018, 0.048, 0.0, -36, 0, 0, 1, 0.02, 0.04, 0.02, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.018, 0.056, 0.0, -28, 0, 0, 1, 0.02, 0.042, 0.02, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.06, 0.063, 0.0, -22, 0, 0, 1, 0.018, 0.04, 0.018, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.102, 0.067, 0.0, -16, 0, 0, 1, 0.017, 0.038, 0.017, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, -0.012, 0.05, -0.001, -30, 0, 0, 1, 0.025, 0.054, 0.024, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.024, 0.058, -0.001, -26, 0, 0, 1, 0.024, 0.052, 0.024, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.066, 0.064, -0.001, -20, 0, 0, 1, 0.022, 0.048, 0.022, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.108, 0.068, -0.001, -14, 0, 0, 1, 0.02, 0.044, 0.02, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.15, 0.072, -0.001, -10, 0, 0, 1, 0.018, 0.04, 0.018, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, -0.012, 0.05, 0.001, 30, 0, 0, 1, 0.025, 0.054, 0.024, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.024, 0.058, 0.001, 26, 0, 0, 1, 0.024, 0.052, 0.024, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.066, 0.064, 0.001, 20, 0, 0, 1, 0.022, 0.048, 0.022, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.108, 0.068, 0.001, 14, 0, 0, 1, 0.02, 0.044, 0.02, HORSE_COLORS.mane, 8);
  makeRotatedCone(neckBase, 0.15, 0.072, 0.001, 10, 0, 0, 1, 0.018, 0.04, 0.018, HORSE_COLORS.mane, 8);

  const neckTip = new Matrix4(neckBase);
  neckTip.translate(0.23, 0.0, 0.0);
  renderHead(neckTip);

  const tailBase = new Matrix4(horseFrame);
  tailBase.translate(-0.025, 0.175, 0.18);
  tailBase.rotate(118, 0, 0, 1);
  renderTail(tailBase);

  const frontLeftAnchor = new Matrix4(horseFrame);
  frontLeftAnchor.translate(0.56, 0.02, 0.07);
  renderLeg(frontLeftAnchor, frontLeftUpperAngle, frontLeftLowerAngle, -4, true);

  const frontRightAnchor = new Matrix4(horseFrame);
  frontRightAnchor.translate(0.56, 0.02, 0.29);
  renderLeg(frontRightAnchor, frontRightUpperAngle, frontRightLowerAngle, 4, true);

  const backLeftAnchor = new Matrix4(horseFrame);
  backLeftAnchor.translate(0.06, 0.02, 0.07);
  renderLeg(backLeftAnchor, backLeftUpperAngle, backLeftLowerAngle, -4, false);

  const backRightAnchor = new Matrix4(horseFrame);
  backRightAnchor.translate(0.06, 0.02, 0.29);
  renderLeg(backRightAnchor, backRightUpperAngle, backRightLowerAngle, 4, false);
}

function renderScene() {
  const startTime = performance.now();

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalXAngle, 1, 0, 0);
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  renderGrassField();
  renderHorse();

  const duration = performance.now() - startTime;
  sendTextToHTML(
    'ms: ' + duration.toFixed(1) + ' fps: ' + g_fps.toFixed(1),
    'numdot'
  );
}

function sendTextToHTML(text, htmlID) {
  const htmlElement = document.getElementById(htmlID);
  if (!htmlElement) {
    console.log('Failed to get ' + htmlID + ' from HTML');
    return;
  }

  htmlElement.innerHTML = text;
}
