class Sphere {
  constructor() {
    this.type = 'sphere';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
  }

  static buildGeometry(latBands, longBands) {
    if (Sphere.vertices && Sphere.uvs) {
      return;
    }

    const vertices = [];
    const uvs = [];

    function pushVertex(phi, theta) {
      const sinPhi = Math.sin(phi);
      const x = 0.5 + 0.5 * sinPhi * Math.cos(theta);
      const y = 0.5 + 0.5 * Math.cos(phi);
      const z = 0.5 + 0.5 * sinPhi * Math.sin(theta);
      const u = theta / (Math.PI * 2);
      const v = phi / Math.PI;
      vertices.push(x, y, z);
      uvs.push(u, v);
    }

    for (let lat = 0; lat < latBands; lat += 1) {
      const phi1 = lat / latBands * Math.PI;
      const phi2 = (lat + 1) / latBands * Math.PI;

      for (let lon = 0; lon < longBands; lon += 1) {
        const theta1 = lon / longBands * Math.PI * 2;
        const theta2 = (lon + 1) / longBands * Math.PI * 2;

        pushVertex(phi1, theta1);
        pushVertex(phi2, theta1);
        pushVertex(phi2, theta2);

        pushVertex(phi1, theta1);
        pushVertex(phi2, theta2);
        pushVertex(phi1, theta2);
      }
    }

    Sphere.vertices = new Float32Array(vertices);
    Sphere.uvs = new Float32Array(uvs);
  }

  static initBuffers() {
    if (Sphere.vertexBuffer && Sphere.uvBuffer) {
      return;
    }

    Sphere.buildGeometry(12, 18);
    Sphere.vertexBuffer = gl.createBuffer();
    Sphere.uvBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, Sphere.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Sphere.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, Sphere.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Sphere.uvs, gl.STATIC_DRAW);
  }

  render() {
    Sphere.initBuffers();

    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1i(u_WhichTexture, -1);
    gl.uniform1f(u_TexColorWeight, 0.0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    gl.bindBuffer(gl.ARRAY_BUFFER, Sphere.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, Sphere.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.drawArrays(gl.TRIANGLES, 0, Sphere.vertices.length / 3);
  }
}

Sphere.vertices = null;
Sphere.uvs = null;
Sphere.vertexBuffer = null;
Sphere.uvBuffer = null;
