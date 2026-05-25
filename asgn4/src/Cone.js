class Cone {
  constructor() {
    this.type = 'cone';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.segments = 12;
  }

  static buildGeometry(segments) {
    const cacheKey = String(segments);
    if (!Cone.geometryCache) {
      Cone.geometryCache = {};
    }
    if (Cone.geometryCache[cacheKey]) {
      return Cone.geometryCache[cacheKey];
    }

    const vertices = [];
    const normals = [];
    const apex = [0.5, 1.0, 0.5];
    const center = [0.5, 0.0, 0.5];
    const angleStep = (Math.PI * 2) / segments;

    for (let i = 0; i < segments; i++) {
      const angle1 = i * angleStep;
      const angle2 = (i + 1) * angleStep;
      const p1 = [0.5 + 0.5 * Math.cos(angle1), 0.0, 0.5 + 0.5 * Math.sin(angle1)];
      const p2 = [0.5 + 0.5 * Math.cos(angle2), 0.0, 0.5 + 0.5 * Math.sin(angle2)];

      vertices.push(
        apex[0], apex[1], apex[2],
        p1[0], p1[1], p1[2],
        p2[0], p2[1], p2[2]
      );
      const sideNormal = computeFaceNormal(apex, p1, p2);
      for (let j = 0; j < 3; j++) {
        normals.push(sideNormal[0], sideNormal[1], sideNormal[2]);
      }

      vertices.push(
        center[0], center[1], center[2],
        p2[0], p2[1], p2[2],
        p1[0], p1[1], p1[2]
      );
      for (let j = 0; j < 3; j++) {
        normals.push(0, -1, 0);
      }
    }

    Cone.geometryCache[cacheKey] = { vertices: vertices, normals: normals };
    return Cone.geometryCache[cacheKey];
  }

  render() {
    const geometry = Cone.buildGeometry(this.segments);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    sendShapeUniforms(this.matrix);
    drawTriangle3D(geometry.vertices, geometry.normals);
  }
}
