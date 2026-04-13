class Circle {
  constructor() {
    this.type = 'circle';
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
    this.segments = 10;
  }

  render() {
    const xy = this.position;
    const rgba = this.color;
    const radius = this.size / 200.0;
    const angleStep = 360 / this.segments;

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    const vertices = [];

    for (let angle = 0; angle < 360; angle += angleStep) {
      const angle1 = angle * Math.PI / 180;
      const angle2 = (angle + angleStep) * Math.PI / 180;

      vertices.push(
        xy[0], xy[1],
        xy[0] + Math.cos(angle1) * radius, xy[1] + Math.sin(angle1) * radius,
        xy[0] + Math.cos(angle2) * radius, xy[1] + Math.sin(angle2) * radius
      );
    }

    drawCircle(vertices);
  }
}

function drawCircle(vertices) {
  const n = vertices.length / 2;

  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);

  return n;
}