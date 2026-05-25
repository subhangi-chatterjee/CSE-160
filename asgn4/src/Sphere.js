class Sphere {
  constructor() {
    this.type = 'sphere';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.latBands = 16;
    this.longBands = 24;
  }

  static buildGeometry(latBands, longBands) {
    const cacheKey = latBands + ':' + longBands;
    if (!Sphere.geometryCache) {
      Sphere.geometryCache = {};
    }
    if (Sphere.geometryCache[cacheKey]) {
      return Sphere.geometryCache[cacheKey];
    }

    const vertices = [];
    const normals = [];

    function pushVertex(theta, phi) {
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const nx = sinTheta * cosPhi;
      const ny = cosTheta;
      const nz = sinTheta * sinPhi;

      return {
        position: [nx * 0.5, ny * 0.5, nz * 0.5],
        normal: [nx, ny, nz]
      };
    }

    for (let lat = 0; lat < latBands; lat++) {
      const theta1 = (lat / latBands) * Math.PI;
      const theta2 = ((lat + 1) / latBands) * Math.PI;

      for (let lon = 0; lon < longBands; lon++) {
        const phi1 = (lon / longBands) * Math.PI * 2;
        const phi2 = ((lon + 1) / longBands) * Math.PI * 2;
        const p1 = pushVertex(theta1, phi1);
        const p2 = pushVertex(theta2, phi1);
        const p3 = pushVertex(theta2, phi2);
        const p4 = pushVertex(theta1, phi2);

        vertices.push(
          p1.position[0], p1.position[1], p1.position[2],
          p2.position[0], p2.position[1], p2.position[2],
          p3.position[0], p3.position[1], p3.position[2],
          p1.position[0], p1.position[1], p1.position[2],
          p3.position[0], p3.position[1], p3.position[2],
          p4.position[0], p4.position[1], p4.position[2]
        );

        normals.push(
          p1.normal[0], p1.normal[1], p1.normal[2],
          p2.normal[0], p2.normal[1], p2.normal[2],
          p3.normal[0], p3.normal[1], p3.normal[2],
          p1.normal[0], p1.normal[1], p1.normal[2],
          p3.normal[0], p3.normal[1], p3.normal[2],
          p4.normal[0], p4.normal[1], p4.normal[2]
        );
      }
    }

    Sphere.geometryCache[cacheKey] = { vertices: vertices, normals: normals };
    return Sphere.geometryCache[cacheKey];
  }

  render() {
    const geometry = Sphere.buildGeometry(this.latBands, this.longBands);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    sendShapeUniforms(this.matrix);
    drawTriangle3D(geometry.vertices, geometry.normals);
  }
}
