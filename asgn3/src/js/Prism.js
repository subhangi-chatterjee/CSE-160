class Prism {
  constructor() {
    this.type = 'prism';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
  }

  render() {
    let rgba = this.color;
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    drawTriangle3D([0, 0, 0, 1, 0, 0, 0, 1, 0.5]);
    drawTriangle3D([0, 0, 1, 0, 1, 0.5, 1, 0, 1]);

    gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);
    drawTriangle3D([0, 0, 0, 0, 0, 1, 1, 0, 1]);
    drawTriangle3D([0, 0, 0, 1, 0, 1, 1, 0, 0]);

    gl.uniform4f(u_FragColor, rgba[0] * 0.82, rgba[1] * 0.82, rgba[2] * 0.82, rgba[3]);
    drawTriangle3D([0, 0, 0, 0, 1, 0.5, 0, 0, 1]);

    gl.uniform4f(u_FragColor, rgba[0] * 0.74, rgba[1] * 0.74, rgba[2] * 0.74, rgba[3]);
    drawTriangle3D([1, 0, 0, 1, 0, 1, 0, 1, 0.5]);

    gl.uniform4f(u_FragColor, rgba[0] * 0.68, rgba[1] * 0.68, rgba[2] * 0.68, rgba[3]);
    drawTriangle3D([0, 0, 0, 1, 0, 0, 0, 1, 0.5]);
    drawTriangle3D([1, 0, 0, 1, 0, 1, 0, 1, 0.5]);

    gl.uniform4f(u_FragColor, rgba[0] * 0.6, rgba[1] * 0.6, rgba[2] * 0.6, rgba[3]);
    drawTriangle3D([0, 0, 1, 0, 1, 0.5, 1, 0, 1]);
    drawTriangle3D([0, 1, 0.5, 1, 0, 1, 1, 0, 0]);
  }
}
