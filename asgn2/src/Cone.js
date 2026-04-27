class Cone {
  constructor() {
    this.type = 'cone';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.segments = 12;
  }

  render() {
    const rgba = this.color;
    const angleStep = 360 / this.segments;

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    for (let angle = 0; angle < 360; angle += angleStep) {
      const rad1 = angle * Math.PI / 180;
      const rad2 = (angle + angleStep) * Math.PI / 180;
      const x1 = 0.5 + 0.5 * Math.cos(rad1);
      const z1 = 0.5 + 0.5 * Math.sin(rad1);
      const x2 = 0.5 + 0.5 * Math.cos(rad2);
      const z2 = 0.5 + 0.5 * Math.sin(rad2);

      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      drawTriangle3D([
        0.5, 1.0, 0.5,
        x1, 0.0, z1,
        x2, 0.0, z2
      ]);

      gl.uniform4f(u_FragColor, rgba[0] * 0.72, rgba[1] * 0.72, rgba[2] * 0.72, rgba[3]);
      drawTriangle3D([
        0.5, 0.0, 0.5,
        x2, 0.0, z2,
        x1, 0.0, z1
      ]);
    }
  }
}
