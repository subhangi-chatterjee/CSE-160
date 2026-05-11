const HORSE_AVATAR_COLORS = {
  coat: [0.58, 0.39, 0.24, 1.0],
  coatLight: [0.68, 0.49, 0.31, 1.0],
  mane: [0.22, 0.12, 0.06, 1.0],
  hoof: [0.14, 0.09, 0.07, 1.0],
  muzzle: [0.68, 0.49, 0.31, 1.0],
  eyeWhite: [0.97, 0.96, 0.93, 1.0],
  pupil: [0.33, 0.19, 0.09, 1.0],
  earInner: [0.86, 0.67, 0.58, 1.0],
  nostril: [0.24, 0.12, 0.08, 1.0]
};

const CLOVER_NPC_COLORS = {
  coat: [0.47, 0.52, 0.62, 1.0],
  coatLight: [0.64, 0.69, 0.8, 1.0],
  mane: [0.2, 0.23, 0.31, 1.0],
  hoof: [0.16, 0.18, 0.24, 1.0],
  muzzle: [0.64, 0.69, 0.8, 1.0],
  eyeWhite: [0.97, 0.96, 0.93, 1.0],
  pupil: [0.22, 0.25, 0.33, 1.0],
  earInner: [0.88, 0.78, 0.84, 1.0],
  nostril: [0.19, 0.21, 0.28, 1.0]
};

const HORSE_AVATAR_POSE = {
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

let g_horseAvatarPalette = HORSE_AVATAR_COLORS;

function horseAvatarRenderCube(matrix, color) {
  const cube = new Cube();
  cube.color = color;
  cube.textureNum = -1;
  cube.texColorWeight = 0.0;
  cube.matrix = matrix;
  cube.render();
}

function horseAvatarRenderCone(matrix, color, segments) {
  if (typeof u_WhichTexture !== 'undefined' && u_WhichTexture) {
    gl.uniform1i(u_WhichTexture, -1);
  }
  if (typeof u_TexColorWeight !== 'undefined' && u_TexColorWeight) {
    gl.uniform1f(u_TexColorWeight, 0.0);
  }

  const cone = new Cone();
  cone.color = color;
  cone.matrix = matrix;
  cone.segments = segments || 12;
  cone.render();
}

function horseAvatarScaledCube(baseMatrix, tx, ty, tz, sx, sy, sz, color) {
  const matrix = new Matrix4(baseMatrix);
  matrix.translate(tx, ty, tz);
  matrix.scale(sx, sy, sz);
  horseAvatarRenderCube(matrix, color);
}

function horseAvatarRotatedCone(baseMatrix, tx, ty, tz, angle, ax, ay, az, sx, sy, sz, color, segments) {
  const matrix = new Matrix4(baseMatrix);
  matrix.translate(tx, ty, tz);
  matrix.rotate(angle, ax, ay, az);
  matrix.scale(sx, sy, sz);
  horseAvatarRenderCone(matrix, color, segments);
}

function horseAvatarGetPose(seconds, isMoving, animationMode) {
  const mode = animationMode || 0;
  const walkAmount = isMoving ? 1 : 0;

  if (mode === 1) {
    const swing = Math.sin(seconds * 3.2);
    const lowerSwing = Math.sin(seconds * 3.2 + 2.9);
    const tailWave = Math.sin(seconds * 3.6);
    const headBob = Math.sin(seconds * 1.7);

    return {
      bodyYOffset: 0.012 * Math.sin(seconds * 6.4),
      bodyTilt: 0,
      bodyXOffset: 0,
      headAngle: HORSE_AVATAR_POSE.head + 6 * headBob,
      neckAngle: HORSE_AVATAR_POSE.neck + 4 * Math.sin(seconds * 1.7 + 0.4),
      tailAngle: HORSE_AVATAR_POSE.tail + 30 * tailWave,
      tailTipAngle: HORSE_AVATAR_POSE.tailTip + 24 * Math.sin(seconds * 3.6 + 0.55),
      tailCurlAngle: HORSE_AVATAR_POSE.tailCurl + 26 * Math.sin(seconds * 3.6 + 1.1),
      frontLeftUpperAngle: HORSE_AVATAR_POSE.frontUpper + 18 * swing,
      frontRightUpperAngle: HORSE_AVATAR_POSE.frontUpper - 18 * swing,
      backLeftUpperAngle: HORSE_AVATAR_POSE.backUpper + 16 * swing,
      backRightUpperAngle: HORSE_AVATAR_POSE.backUpper - 16 * swing,
      frontLeftLowerAngle: HORSE_AVATAR_POSE.frontLower - 34 * Math.max(0, -lowerSwing),
      frontRightLowerAngle: HORSE_AVATAR_POSE.frontLower - 34 * Math.max(0, lowerSwing),
      backLeftLowerAngle: HORSE_AVATAR_POSE.backLower - 26 * Math.max(0, -lowerSwing),
      backRightLowerAngle: HORSE_AVATAR_POSE.backLower - 26 * Math.max(0, lowerSwing)
    };
  }

  if (mode === 4) {
    const rearKick = Math.sin(seconds * 5.4);
    const hindPush = Math.sin(seconds * 2.7);

    return {
      bodyYOffset: -0.08 + 0.004 * Math.max(0, hindPush),
      bodyTilt: 24,
      bodyXOffset: 0.008,
      headAngle: HORSE_AVATAR_POSE.head + 20 + 4 * Math.sin(seconds * 2.2),
      neckAngle: HORSE_AVATAR_POSE.neck - 18 + 4 * Math.sin(seconds * 2.2 + 0.3),
      tailAngle: HORSE_AVATAR_POSE.tail + 18 * Math.sin(seconds * 3.8),
      tailTipAngle: HORSE_AVATAR_POSE.tailTip + 14 * Math.sin(seconds * 3.8 + 0.5),
      tailCurlAngle: HORSE_AVATAR_POSE.tailCurl + 16 * Math.sin(seconds * 3.8 + 1.0),
      frontLeftUpperAngle: 72 + 12 * rearKick,
      frontRightUpperAngle: 72 - 12 * rearKick,
      backLeftUpperAngle: -24 + 2 * hindPush,
      backRightUpperAngle: -24 - 2 * hindPush,
      frontLeftLowerAngle: -58 + 10 * Math.sin(seconds * 5.4 + 0.8),
      frontRightLowerAngle: -58 + 10 * Math.sin(seconds * 5.4 + 1.5),
      backLeftLowerAngle: -1 - 2 * Math.max(0, hindPush),
      backRightLowerAngle: -1 - 2 * Math.max(0, -hindPush)
    };
  }

  const swing = Math.sin(seconds * 5.8);
  const lowerSwing = Math.sin(seconds * 5.8 + 0.9);
  const tailWave = Math.sin(seconds * 4.2);
  const headBob = Math.sin(seconds * 2.4);

  return {
    bodyYOffset: 0.01 * Math.sin(seconds * 7.0) * (0.35 + walkAmount * 0.65),
    bodyTilt: 2.5 * walkAmount * Math.sin(seconds * 2.9),
    bodyXOffset: 0.01 * walkAmount * Math.max(0, Math.sin(seconds * 5.8)),
    headAngle: HORSE_AVATAR_POSE.head + 4 * headBob - 2 * walkAmount,
    neckAngle: HORSE_AVATAR_POSE.neck + 3 * Math.sin(seconds * 2.2 + 0.3),
    tailAngle: HORSE_AVATAR_POSE.tail + 18 * tailWave + 8 * walkAmount,
    tailTipAngle: HORSE_AVATAR_POSE.tailTip + 12 * Math.sin(seconds * 4.2 + 0.55),
    tailCurlAngle: HORSE_AVATAR_POSE.tailCurl + 10 * Math.sin(seconds * 4.2 + 1.0),
    frontLeftUpperAngle: HORSE_AVATAR_POSE.frontUpper + 18 * walkAmount * swing,
    frontRightUpperAngle: HORSE_AVATAR_POSE.frontUpper - 18 * walkAmount * swing,
    backLeftUpperAngle: HORSE_AVATAR_POSE.backUpper - 16 * walkAmount * swing,
    backRightUpperAngle: HORSE_AVATAR_POSE.backUpper + 16 * walkAmount * swing,
    frontLeftLowerAngle: HORSE_AVATAR_POSE.frontLower - 34 * walkAmount * Math.max(0, -lowerSwing),
    frontRightLowerAngle: HORSE_AVATAR_POSE.frontLower - 34 * walkAmount * Math.max(0, lowerSwing),
    backLeftLowerAngle: HORSE_AVATAR_POSE.backLower - 22 * walkAmount * Math.max(0, lowerSwing),
    backRightLowerAngle: HORSE_AVATAR_POSE.backLower - 22 * walkAmount * Math.max(0, -lowerSwing)
  };
}

function horseAvatarRenderLeg(anchorMatrix, upperAngle, lowerAngle, sideBend, isFront) {
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
  horseAvatarRenderCube(thighPart, g_horseAvatarPalette.coatLight);

  const upperPart = new Matrix4(upperFrame);
  upperPart.translate(-upperWidth / 2, -upperLength, -upperWidth / 2);
  upperPart.scale(upperWidth, upperLength, upperWidth);
  horseAvatarRenderCube(upperPart, g_horseAvatarPalette.coat);

  const kneeFrame = new Matrix4(upperFrame);
  kneeFrame.translate(kneeOffset, -upperLength + 0.005, 0);
  kneeFrame.rotate(lowerAngle, 0, 0, 1);
  kneeFrame.rotate(hindShinAngle, 0, 0, 1);

  const lowerPart = new Matrix4(kneeFrame);
  lowerPart.translate(lowerX, -lowerLength, lowerZ);
  lowerPart.scale(lowerWidth, lowerLength, lowerWidth);
  horseAvatarRenderCube(lowerPart, g_horseAvatarPalette.coat);

  const fetlockPart = new Matrix4(kneeFrame);
  fetlockPart.translate(isFront ? -0.048 : -0.055, -lowerLength + 0.005, -0.048);
  fetlockPart.scale(0.12, 0.11, 0.12);
  horseAvatarRenderCone(fetlockPart, g_horseAvatarPalette.coatLight, 10);

  const hoofPart = new Matrix4(kneeFrame);
  hoofPart.translate(isFront ? -0.026 : -0.05, -lowerLength - hoofHeight + 0.004, -hoofDepth / 2);
  hoofPart.scale(hoofLength, hoofHeight, hoofDepth);
  horseAvatarRenderCube(hoofPart, g_horseAvatarPalette.hoof);
}

function horseAvatarRenderTailStrand(tailBase, xOffset, zOffset, rootTwist, widths, lengths, pose) {
  const tailOffsets = [
    pose.tailAngle * 0.62,
    (pose.tailAngle + pose.tailTipAngle) * 0.3,
    pose.tailTipAngle * 0.42,
    (pose.tailTipAngle + pose.tailCurlAngle) * 0.24,
    pose.tailCurlAngle * 0.32,
    pose.tailCurlAngle * 0.22,
    pose.tailTipAngle * 0.16
  ];
  let frame = new Matrix4(tailBase);
  frame.translate(xOffset, 0.0, zOffset);
  frame.rotate(rootTwist, 1, 0, 0);

  for (let i = 0; i < tailOffsets.length; i += 1) {
    frame.rotate(tailOffsets[i], 0, 0, 1);

    const width = widths[i];
    const length = lengths[i];
    const strand = new Matrix4(frame);
    strand.translate(-width / 2, -0.01, -width / 2);
    strand.scale(width, length, width);
    horseAvatarRenderCone(strand, g_horseAvatarPalette.mane, 12);

    frame.translate(0.0, length * 0.78, 0.0);
  }
}

function horseAvatarRenderTail(tailBase, pose) {
  const root = new Matrix4(tailBase);
  root.rotate(-6, 1, 0, 0);

  const dock = new Matrix4(root);
  dock.translate(-0.045, -0.03, -0.035);
  dock.scale(0.09, 0.07, 0.07);
  horseAvatarRenderCone(dock, g_horseAvatarPalette.coat, 12);

  horseAvatarRenderTailStrand(root, 0.0, 0.0, 0, [0.072, 0.068, 0.062, 0.056, 0.049, 0.041, 0.033], [0.11, 0.11, 0.105, 0.1, 0.095, 0.088, 0.08], pose);
  horseAvatarRenderTailStrand(root, -0.004, -0.022, 10, [0.05, 0.047, 0.043, 0.038, 0.033, 0.028, 0.022], [0.1, 0.1, 0.096, 0.092, 0.088, 0.082, 0.075], pose);
  horseAvatarRenderTailStrand(root, -0.004, 0.022, -10, [0.05, 0.047, 0.043, 0.038, 0.033, 0.028, 0.022], [0.1, 0.1, 0.096, 0.092, 0.088, 0.082, 0.075], pose);
  horseAvatarRenderTailStrand(root, 0.002, -0.04, 18, [0.034, 0.032, 0.029, 0.026, 0.022, 0.019, 0.016], [0.09, 0.09, 0.087, 0.083, 0.079, 0.074, 0.068], pose);
  horseAvatarRenderTailStrand(root, 0.002, 0.04, -18, [0.034, 0.032, 0.029, 0.026, 0.022, 0.019, 0.016], [0.09, 0.09, 0.087, 0.083, 0.079, 0.074, 0.068], pose);
}

function horseAvatarRenderHead(neckTip, pose) {
  const headBase = new Matrix4(neckTip);
  headBase.rotate(pose.headAngle, 0, 0, 1);

  horseAvatarScaledCube(headBase, -0.06, 0.0, -0.075, 0.17, 0.135, 0.15, g_horseAvatarPalette.coat);

  const muzzleBase = new Matrix4(headBase);
  muzzleBase.translate(0.17, -0.005, 0.01);
  horseAvatarScaledCube(muzzleBase, -0.08, 0.054, -0.07, 0.19, 0.085, 0.12, g_horseAvatarPalette.muzzle);

  const jawBase = new Matrix4(muzzleBase);
  jawBase.translate(0.1, -0.03, 0.0);
  horseAvatarScaledCube(jawBase, -0.20, 0.04, -0.06, 0.18, 0.05, 0.1, g_horseAvatarPalette.muzzle);

  horseAvatarScaledCube(headBase, -0.055, 0.10, -0.072, 0.05, 0.1, 0.05, g_horseAvatarPalette.coat);
  horseAvatarScaledCube(headBase, -0.026, 0.12, -0.068, 0.026, 0.06, 0.038, g_horseAvatarPalette.earInner);
  horseAvatarScaledCube(headBase, -0.055, 0.10, 0.022, 0.05, 0.1, 0.05, g_horseAvatarPalette.coat);
  horseAvatarScaledCube(headBase, -0.026, 0.12, 0.03, 0.026, 0.06, 0.038, g_horseAvatarPalette.earInner);

  horseAvatarScaledCube(headBase, 0.02, 0.08, -0.082, 0.02, 0.02, 0.02, g_horseAvatarPalette.eyeWhite);
  horseAvatarScaledCube(headBase, 0.032, 0.08, -0.085, 0.01, 0.01, 0.01, g_horseAvatarPalette.pupil);
  horseAvatarScaledCube(headBase, 0.02, 0.08, 0.06, 0.02, 0.02, 0.02, g_horseAvatarPalette.eyeWhite);
  horseAvatarScaledCube(headBase, 0.032, 0.08, 0.08, 0.01, 0.01, 0.01, g_horseAvatarPalette.pupil);

  horseAvatarScaledCube(muzzleBase, 0.1, 0.11, -0.06, 0.012, 0.015, 0.015, g_horseAvatarPalette.nostril);
  horseAvatarScaledCube(muzzleBase, 0.1, 0.11, 0.03, 0.012, 0.015, 0.015, g_horseAvatarPalette.nostril);

  horseAvatarRotatedCone(headBase, -0.083, 0.108, -0.022, 44, 0, 0, 1, 0.02, 0.042, 0.024, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(headBase, -0.097, 0.088, -0.022, 34, 0, 0, 1, 0.02, 0.042, 0.024, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(headBase, -0.102, 0.066, -0.021, 26, 0, 0, 1, 0.018, 0.038, 0.022, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(headBase, -0.083, 0.108, -0.003, -44, 0, 0, 1, 0.02, 0.042, 0.024, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(headBase, -0.097, 0.088, -0.003, -34, 0, 0, 1, 0.02, 0.042, 0.024, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(headBase, -0.102, 0.066, -0.002, -26, 0, 0, 1, 0.018, 0.038, 0.022, g_horseAvatarPalette.mane, 8);
}

function renderHorseAvatar(options) {
  const pose = horseAvatarGetPose(options.seconds || 0, !!options.isMoving, options.animationMode || 0);
  const scale = options.scale || 1.62;
  const previousPalette = g_horseAvatarPalette;
  g_horseAvatarPalette = options.colors || HORSE_AVATAR_COLORS;

  const root = new Matrix4();
  root.translate(options.x || 0, options.y || 0, options.z || 0);
  root.rotate(options.yaw || 0, 0, 1, 0);
  root.scale(scale, scale, scale);

  const horseFrame = new Matrix4(root);
  horseFrame.translate(-0.38 + pose.bodyXOffset, -0.27 + pose.bodyYOffset, -0.2);
  horseFrame.rotate(-4 + pose.bodyTilt, 0, 0, 1);
  horseFrame.scale(1.14, 1.38, 1.14);

  horseAvatarScaledCube(horseFrame, 0.0, 0.01, 0.03, 0.18, 0.21, 0.3, g_horseAvatarPalette.coatLight);
  horseAvatarScaledCube(horseFrame, 0.16, -0.005, 0.025, 0.3, 0.2, 0.29, g_horseAvatarPalette.coat);
  horseAvatarScaledCube(horseFrame, 0.42, 0.0, 0.03, 0.22, 0.24, 0.3, g_horseAvatarPalette.coatLight);

  const neckBase = new Matrix4(horseFrame);
  neckBase.translate(0.63, 0.15, 0.18);
  neckBase.rotate(pose.neckAngle, 0, 0, 1);
  horseAvatarScaledCube(neckBase, 0.0, -0.06, -0.06, 0.24, 0.12, 0.12, g_horseAvatarPalette.coatLight);

  horseAvatarRotatedCone(neckBase, -0.025, 0.05, -0.004, -34, 0, 0, 1, 0.03, 0.062, 0.03, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(neckBase, 0.012, 0.06, -0.005, -30, 0, 0, 1, 0.03, 0.068, 0.03, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(neckBase, 0.054, 0.067, -0.006, -26, 0, 0, 1, 0.028, 0.064, 0.028, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(neckBase, 0.096, 0.071, -0.006, -20, 0, 0, 1, 0.026, 0.06, 0.026, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(neckBase, 0.138, 0.073, -0.005, -14, 0, 0, 1, 0.022, 0.052, 0.022, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(neckBase, 0.18, 0.076, -0.004, -8, 0, 0, 1, 0.02, 0.044, 0.02, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(neckBase, -0.025, 0.05, 0.004, 34, 0, 0, 1, 0.03, 0.062, 0.03, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(neckBase, 0.012, 0.06, 0.005, 30, 0, 0, 1, 0.03, 0.068, 0.03, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(neckBase, 0.054, 0.067, 0.006, 26, 0, 0, 1, 0.028, 0.064, 0.028, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(neckBase, 0.096, 0.071, 0.006, 20, 0, 0, 1, 0.026, 0.06, 0.026, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(neckBase, 0.138, 0.073, 0.005, 14, 0, 0, 1, 0.022, 0.052, 0.022, g_horseAvatarPalette.mane, 8);
  horseAvatarRotatedCone(neckBase, 0.18, 0.076, 0.004, 8, 0, 0, 1, 0.02, 0.044, 0.02, g_horseAvatarPalette.mane, 8);

  const neckTip = new Matrix4(neckBase);
  neckTip.translate(0.23, 0.0, 0.0);
  horseAvatarRenderHead(neckTip, pose);

  const tailBase = new Matrix4(horseFrame);
  tailBase.translate(-0.025, 0.175, 0.18);
  tailBase.rotate(118, 0, 0, 1);
  horseAvatarRenderTail(tailBase, pose);

  const frontLeftAnchor = new Matrix4(horseFrame);
  frontLeftAnchor.translate(0.56, 0.02, 0.07);
  horseAvatarRenderLeg(frontLeftAnchor, pose.frontLeftUpperAngle, pose.frontLeftLowerAngle, -4, true);

  const frontRightAnchor = new Matrix4(horseFrame);
  frontRightAnchor.translate(0.56, 0.02, 0.29);
  horseAvatarRenderLeg(frontRightAnchor, pose.frontRightUpperAngle, pose.frontRightLowerAngle, 4, true);

  const backLeftAnchor = new Matrix4(horseFrame);
  backLeftAnchor.translate(0.06, 0.02, 0.07);
  horseAvatarRenderLeg(backLeftAnchor, pose.backLeftUpperAngle, pose.backLeftLowerAngle, -4, false);

  const backRightAnchor = new Matrix4(horseFrame);
  backRightAnchor.translate(0.06, 0.02, 0.29);
  horseAvatarRenderLeg(backRightAnchor, pose.backRightUpperAngle, pose.backRightLowerAngle, 4, false);

  g_horseAvatarPalette = previousPalette;
}
