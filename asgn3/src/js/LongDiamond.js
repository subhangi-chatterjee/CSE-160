class LongDiamond {
  constructor() {
    this.type = 'longDiamond';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
  }

  render() {
    const rgba = this.color;
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform1i(u_WhichTexture, -1);
    gl.uniform1f(u_TexColorWeight, 0.0);

    const back = [
      0.0, 0.0, 0.0,
      0.44, 0.86, 0.0,
      1.78, 1.62, 0.0,
      0.94, 0.28, 0.0
    ];
    const front = [
      0.0, 0.0, 1.0,
      0.44, 0.86, 1.0,
      1.78, 1.62, 1.0,
      0.94, 0.28, 1.0
    ];

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    drawTriangle3D([
      back[0], back[1], back[2],
      back[3], back[4], back[5],
      back[9], back[10], back[11]
    ]);
    drawTriangle3D([
      back[3], back[4], back[5],
      back[6], back[7], back[8],
      back[9], back[10], back[11]
    ]);

    gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);
    drawTriangle3D([
      front[0], front[1], front[2],
      front[9], front[10], front[11],
      front[3], front[4], front[5]
    ]);
    drawTriangle3D([
      front[3], front[4], front[5],
      front[9], front[10], front[11],
      front[6], front[7], front[8]
    ]);

    gl.uniform4f(u_FragColor, rgba[0] * 0.82, rgba[1] * 0.82, rgba[2] * 0.82, rgba[3]);
    drawTriangle3D([
      back[0], back[1], back[2],
      front[0], front[1], front[2],
      front[3], front[4], front[5]
    ]);
    drawTriangle3D([
      back[0], back[1], back[2],
      front[3], front[4], front[5],
      back[3], back[4], back[5]
    ]);

    gl.uniform4f(u_FragColor, rgba[0] * 0.76, rgba[1] * 0.76, rgba[2] * 0.76, rgba[3]);
    drawTriangle3D([
      back[3], back[4], back[5],
      front[3], front[4], front[5],
      front[6], front[7], front[8]
    ]);
    drawTriangle3D([
      back[3], back[4], back[5],
      front[6], front[7], front[8],
      back[6], back[7], back[8]
    ]);

    gl.uniform4f(u_FragColor, rgba[0] * 0.7, rgba[1] * 0.7, rgba[2] * 0.7, rgba[3]);
    drawTriangle3D([
      back[6], back[7], back[8],
      front[6], front[7], front[8],
      front[9], front[10], front[11]
    ]);
    drawTriangle3D([
      back[6], back[7], back[8],
      front[9], front[10], front[11],
      back[9], back[10], back[11]
    ]);

    gl.uniform4f(u_FragColor, rgba[0] * 0.64, rgba[1] * 0.64, rgba[2] * 0.64, rgba[3]);
    drawTriangle3D([
      back[9], back[10], back[11],
      front[9], front[10], front[11],
      front[0], front[1], front[2]
    ]);
    drawTriangle3D([
      back[9], back[10], back[11],
      front[0], front[1], front[2],
      back[0], back[1], back[2]
    ]);
  }
}
