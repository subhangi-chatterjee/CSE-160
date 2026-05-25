class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
  }

  static initGeometry() {
    if (Cube.vertices) {
      return;
    }

    Cube.vertices = [];
    Cube.normals = [];

    function pushFace(a, b, c, d, normal) {
      Cube.vertices.push(
        a[0], a[1], a[2],
        b[0], b[1], b[2],
        c[0], c[1], c[2],
        a[0], a[1], a[2],
        c[0], c[1], c[2],
        d[0], d[1], d[2]
      );

      for (let i = 0; i < 6; i++) {
        Cube.normals.push(normal[0], normal[1], normal[2]);
      }
    }

    pushFace([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, -1]);
    pushFace([1, 0, 1], [0, 0, 1], [0, 1, 1], [1, 1, 1], [0, 0, 1]);
    pushFace([0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1], [0, 1, 0]);
    pushFace([0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 0, 0], [0, -1, 0]);
    pushFace([1, 0, 0], [1, 0, 1], [1, 1, 1], [1, 1, 0], [1, 0, 0]);
    pushFace([0, 0, 1], [0, 0, 0], [0, 1, 0], [0, 1, 1], [-1, 0, 0]);
  }

  render() {
    Cube.initGeometry();
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    sendShapeUniforms(this.matrix);
    drawTriangle3D(Cube.vertices, Cube.normals);
  }
}
