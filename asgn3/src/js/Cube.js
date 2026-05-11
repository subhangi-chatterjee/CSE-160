const CUBE_VERTICES = new Float32Array([
  0, 0, 0, 1, 1, 0, 1, 0, 0,
  0, 0, 0, 0, 1, 0, 1, 1, 0,

  0, 1, 0, 0, 1, 1, 1, 1, 1,
  0, 1, 0, 1, 1, 1, 1, 1, 0,

  0, 0, 1, 1, 0, 1, 1, 1, 1,
  0, 0, 1, 1, 1, 1, 0, 1, 1,

  0, 0, 0, 1, 0, 0, 1, 0, 1,
  0, 0, 0, 1, 0, 1, 0, 0, 1,

  0, 0, 0, 0, 0, 1, 0, 1, 1,
  0, 0, 0, 0, 1, 1, 0, 1, 0,

  1, 0, 0, 1, 1, 0, 1, 1, 1,
  1, 0, 0, 1, 1, 1, 1, 0, 1
]);

const CUBE_UVS = new Float32Array([
  0, 0, 1, 1, 1, 0,
  0, 0, 0, 1, 1, 1,

  0, 0, 0, 1, 1, 1,
  0, 0, 1, 1, 1, 0,

  0, 0, 1, 0, 1, 1,
  0, 0, 1, 1, 0, 1,

  0, 0, 1, 0, 1, 1,
  0, 0, 1, 1, 0, 1,

  0, 0, 1, 0, 1, 1,
  0, 0, 1, 1, 0, 1,

  0, 0, 0, 1, 1, 1,
  0, 0, 1, 1, 1, 0
]);

class Cube {
  constructor() {
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.textureNum = -1;
    this.texColorWeight = 1.0;
    this.matrix = new Matrix4();
  }

  static initBuffers() {
    if (Cube.vertexBuffer && Cube.uvBuffer) {
      return;
    }

    Cube.vertexBuffer = gl.createBuffer();
    Cube.uvBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, CUBE_VERTICES, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, CUBE_UVS, gl.STATIC_DRAW);
  }

  render() {
    Cube.initBuffers();

    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1i(u_WhichTexture, this.textureNum);
    gl.uniform1f(u_TexColorWeight, this.texColorWeight);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}

Cube.vertexBuffer = null;
Cube.uvBuffer = null;
