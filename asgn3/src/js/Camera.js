function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

function makeVector3(x, y, z) {
  return new Vector3([x, y, z]);
}

function setVector3(vector, x, y, z) {
  vector.elements[0] = x;
  vector.elements[1] = y;
  vector.elements[2] = z;
}

function cloneVector3(vector) {
  return new Vector3(vector.elements);
}

function crossVector3(a, b) {
  const ae = a.elements;
  const be = b.elements;
  return new Vector3([
    ae[1] * be[2] - ae[2] * be[1],
    ae[2] * be[0] - ae[0] * be[2],
    ae[0] * be[1] - ae[1] * be[0]
  ]);
}

class Camera {
  constructor(canvas) {
    this.fov = 60;
    this.eye = makeVector3(0, 1.65, 0);
    this.at = makeVector3(0, 1.65, -1);
    this.up = makeVector3(0, 1, 0);
    this.worldUp = makeVector3(0, 1, 0);
    this.forward = makeVector3(0, 0, -1);
    this.right = makeVector3(1, 0, 0);
    this.yaw = -90;
    this.pitch = 0;
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();

    this.aspect = canvas.width / canvas.height;
    this.projectionMatrix.setPerspective(this.fov, this.aspect, 0.1, 200);
    this.updateOrientation();
  }

  setAspect(aspect) {
    this.aspect = aspect;
    this.projectionMatrix.setPerspective(this.fov, this.aspect, 0.1, 200);
  }

  setFov(fov) {
    this.fov = Math.max(25, Math.min(90, fov));
    this.projectionMatrix.setPerspective(this.fov, this.aspect, 0.1, 200);
  }

  adjustFov(delta) {
    this.setFov(this.fov + delta);
  }

  setPosition(x, y, z) {
    setVector3(this.eye, x, y, z);
    this.updateViewMatrix();
  }

  setYawPitch(yaw, pitch) {
    this.yaw = yaw;
    this.pitch = pitch;
    this.updateOrientation();
  }

  updateOrientation() {
    const yawRadians = degreesToRadians(this.yaw);
    const pitchRadians = degreesToRadians(this.pitch);
    const forwardX = Math.cos(pitchRadians) * Math.cos(yawRadians);
    const forwardY = Math.sin(pitchRadians);
    const forwardZ = Math.cos(pitchRadians) * Math.sin(yawRadians);

    setVector3(this.forward, forwardX, forwardY, forwardZ);
    this.forward.normalize();
    this.right = crossVector3(this.forward, this.worldUp);
    this.right.normalize();
    this.up = crossVector3(this.right, this.forward);
    this.up.normalize();

    this.updateViewMatrix();
  }

  updateViewMatrix() {
    setVector3(
      this.at,
      this.eye.elements[0] + this.forward.elements[0],
      this.eye.elements[1] + this.forward.elements[1],
      this.eye.elements[2] + this.forward.elements[2]
    );

    this.viewMatrix.setLookAt(
      this.eye.elements[0],
      this.eye.elements[1],
      this.eye.elements[2],
      this.at.elements[0],
      this.at.elements[1],
      this.at.elements[2],
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2]
    );
  }

  getFlatForward() {
    const flat = makeVector3(this.forward.elements[0], 0, this.forward.elements[2]);
    flat.normalize();
    return flat;
  }

  getRight() {
    const side = cloneVector3(this.right);
    side.normalize();
    return side;
  }

  moveAlong(direction, speed, canMove) {
    const nextX = this.eye.elements[0] + direction.elements[0] * speed;
    const nextZ = this.eye.elements[2] + direction.elements[2] * speed;
    if (canMove && !canMove(nextX, nextZ)) {
      return false;
    }

    this.eye.elements[0] = nextX;
    this.eye.elements[2] = nextZ;
    this.updateViewMatrix();
    return true;
  }

  moveForward(speed, canMove) {
    return this.moveAlong(this.getFlatForward(), speed, canMove);
  }

  moveBackwards(speed, canMove) {
    return this.moveAlong(this.getFlatForward(), -speed, canMove);
  }

  moveLeft(speed, canMove) {
    return this.moveAlong(this.getRight(), -speed, canMove);
  }

  moveRight(speed, canMove) {
    return this.moveAlong(this.getRight(), speed, canMove);
  }

  panLeft(alpha) {
    this.yaw -= alpha;
    this.updateOrientation();
  }

  panRight(alpha) {
    this.yaw += alpha;
    this.updateOrientation();
  }

  tilt(delta) {
    this.pitch = Math.max(-55, Math.min(55, this.pitch + delta));
    this.updateOrientation();
  }
}
