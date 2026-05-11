let g_triangleBuffer = null;
let g_triangleUvBuffer = null;

function getTriangleBuffer(buffer) {
  if (buffer) {
    return buffer;
  }

  const created = gl.createBuffer();
  if (!created) {
    console.log('Failed to create buffer');
    return null;
  }

  return created;
}

function drawTriangle3D(vertices) {
  g_triangleBuffer = getTriangleBuffer(g_triangleBuffer);
  if (!g_triangleBuffer) {
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, g_triangleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
}

function drawTriangle3DUV(vertices, uv) {
  g_triangleBuffer = getTriangleBuffer(g_triangleBuffer);
  g_triangleUvBuffer = getTriangleBuffer(g_triangleUvBuffer);
  if (!g_triangleBuffer || !g_triangleUvBuffer) {
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, g_triangleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_triangleUvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
}
