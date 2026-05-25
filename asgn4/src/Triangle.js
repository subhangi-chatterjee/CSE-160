class Triangle {
  constructor() {
    this.type = 'triangle';
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

  render() {
    const xy = this.position;
    const rgba = this.color;
    const d = this.size / 200.0;

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    drawTriangle([
      xy[0], xy[1] + d,
      xy[0] - d, xy[1] - d,
      xy[0] + d, xy[1] - d
    ]);
  }
}

let g_triangleBuffer = null;
let g_triangle3DBuffer = null;
let g_normalBuffer = null;

function getReusableBuffer(existingBuffer) {
  if (existingBuffer) {
    return existingBuffer;
  }

  const buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }

  return buffer;
}

function normalizeVector3(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (length < 0.000001) {
    return [0, 1, 0];
  }

  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function subtractVector3(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function crossVector3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function computeFaceNormal(p1, p2, p3) {
  const edge1 = subtractVector3(p2, p1);
  const edge2 = subtractVector3(p3, p1);
  return normalizeVector3(crossVector3(edge1, edge2));
}

function buildFlatNormals(vertices) {
  const normals = [];

  for (let i = 0; i < vertices.length; i += 9) {
    const p1 = [vertices[i], vertices[i + 1], vertices[i + 2]];
    const p2 = [vertices[i + 3], vertices[i + 4], vertices[i + 5]];
    const p3 = [vertices[i + 6], vertices[i + 7], vertices[i + 8]];
    const normal = computeFaceNormal(p1, p2, p3);

    for (let j = 0; j < 3; j++) {
      normals.push(normal[0], normal[1], normal[2]);
    }
  }

  return normals;
}

function drawTriangle(vertices) {
  const n = 3;

  g_triangleBuffer = getReusableBuffer(g_triangleBuffer);
  if (!g_triangleBuffer) {
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, g_triangleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  if (typeof a_Normal !== 'undefined' && a_Normal >= 0) {
    g_normalBuffer = getReusableBuffer(g_normalBuffer);
    if (!g_normalBuffer) {
      return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, g_normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1
    ]), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);
  }

  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3D(vertices, normals) {
  const n = vertices.length / 3;
  const vertexNormals = normals && normals.length === vertices.length ? normals : buildFlatNormals(vertices);

  g_triangle3DBuffer = getReusableBuffer(g_triangle3DBuffer);
  g_normalBuffer = getReusableBuffer(g_normalBuffer);
  if (!g_triangle3DBuffer || !g_normalBuffer) {
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, g_triangle3DBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}
