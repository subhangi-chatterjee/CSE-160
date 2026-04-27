class Triangle {
  constructor() {
    this.type = 'triangle';
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    var d = this.size / 200.0;

    drawTriangle([xy[0], xy[1] + d,xy[0] - d, xy[1] - d,xy[0] + d, xy[1] - d]);
  }
}

let g_triangleBuffer = null;
let g_triangle3DBuffer = null;

function getReusableBuffer(existingBuffer) {
  if (existingBuffer) {
    return existingBuffer;
  }

  let buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }

  return buffer;
}

function drawTriangle(vertices) {
  var n = 3;

  g_triangleBuffer = getReusableBuffer(g_triangleBuffer);
  if (!g_triangleBuffer) {
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, g_triangleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, n);

  //return n;
}

function drawTriangle3D(vertices) {
  var n = 3;

  g_triangle3DBuffer = getReusableBuffer(g_triangle3DBuffer);
  if (!g_triangle3DBuffer) {
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, g_triangle3DBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, n);

  //return n;
}
