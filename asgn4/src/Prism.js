class Prism {
  constructor() {
    this.type = 'prism';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
  }

  static initGeometry() {
    if (Prism.vertices) {
      return;
    }

    Prism.vertices = [
      0, 0, 0, 1, 0, 0, 0, 1, 0.5,
      0, 0, 1, 0, 1, 0.5, 1, 0, 1,

      0, 0, 0, 0, 0, 1, 1, 0, 1,
      0, 0, 0, 1, 0, 1, 1, 0, 0,

      0, 0, 0, 0, 1, 0.5, 0, 0, 1,
      1, 0, 0, 1, 0, 1, 0, 1, 0.5,

      0, 0, 0, 1, 0, 0, 0, 1, 0.5,
      1, 0, 0, 1, 0, 1, 0, 1, 0.5,

      0, 0, 1, 0, 1, 0.5, 1, 0, 1,
      0, 1, 0.5, 1, 0, 1, 1, 0, 0
    ];
    Prism.normals = buildFlatNormals(Prism.vertices);
  }

  render() {
    Prism.initGeometry();
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    sendShapeUniforms(this.matrix);
    drawTriangle3D(Prism.vertices, Prism.normals);
  }
}
