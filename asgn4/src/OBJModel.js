class OBJModel {
  constructor() {
    this.color = [0.8, 0.8, 0.8, 1.0];
    this.matrix = new Matrix4();
    this.vertices = [];
    this.normals = [];
    this.loaded = false;
  }

  async load(url, fallbackText) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      const text = await response.text();
      this.setMeshFromOBJ(text);
    } catch (error) {
      if (fallbackText) {
        this.setMeshFromOBJ(fallbackText);
      } else {
        throw error;
      }
    }
  }

  setMeshFromOBJ(text) {
    const parsed = OBJModel.parseOBJ(text);
    this.vertices = parsed.vertices;
    this.normals = parsed.normals;
    this.loaded = this.vertices.length > 0;
  }

  render() {
    if (!this.loaded) {
      return;
    }

    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    sendShapeUniforms(this.matrix);
    drawTriangle3D(this.vertices, this.normals);
  }

  static parseOBJ(text) {
    const positions = [];
    const sourceNormals = [];
    const vertices = [];
    const normals = [];
    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) {
        continue;
      }

      const parts = line.split(/\s+/);
      if (parts[0] === 'v') {
        positions.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        ]);
      } else if (parts[0] === 'vn') {
        sourceNormals.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        ]);
      } else if (parts[0] === 'f') {
        const face = parts.slice(1).map(function(part) {
          const indices = part.split('/');
          return {
            v: parseInt(indices[0], 10),
            vn: indices[2] ? parseInt(indices[2], 10) : null
          };
        });

        for (let j = 1; j < face.length - 1; j++) {
          const tri = [face[0], face[j], face[j + 1]];
          const triPositions = tri.map(function(entry) {
            return positions[entry.v - 1];
          });

          let triNormals = null;
          if (tri.every(function(entry) { return entry.vn !== null && sourceNormals[entry.vn - 1]; })) {
            triNormals = tri.map(function(entry) {
              return sourceNormals[entry.vn - 1];
            });
          } else {
            const faceNormal = computeFaceNormal(triPositions[0], triPositions[1], triPositions[2]);
            triNormals = [faceNormal, faceNormal, faceNormal];
          }

          for (let k = 0; k < 3; k++) {
            const position = triPositions[k];
            const normal = triNormals[k];
            vertices.push(position[0], position[1], position[2]);
            normals.push(normal[0], normal[1], normal[2]);
          }
        }
      }
    }

    return { vertices: vertices, normals: normals };
  }
}
