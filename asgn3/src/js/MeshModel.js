class MeshModel {
  constructor(data, textureSrc) {
    this.color = [0.86, 0.86, 0.86, 1.0];
    this.matrix = new Matrix4();
    this.positions = data.positions;
    this.uvs = data.uvs;
    this.indices = data.indices;
    this.bounds = data.bounds;
    this.textureSrc = textureSrc || '';
    this.vertexBuffer = null;
    this.uvBuffer = null;
    this.indexBuffer = null;
    this.texture = null;
    this.textureLoaded = false;
    this.indexType = this.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    this.loadTexture();
  }

  initBuffers() {
    if (this.vertexBuffer && this.uvBuffer && this.indexBuffer) {
      return;
    }

    this.vertexBuffer = gl.createBuffer();
    this.uvBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
  }

  loadTexture() {
    if (!this.textureSrc) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      const previousActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
      gl.activeTexture(gl.TEXTURE0);
      const previousTexture0Binding = gl.getParameter(gl.TEXTURE_BINDING_2D);

      const texture = gl.createTexture();
      const isPowerOfTwoTexture =
        (image.width & (image.width - 1)) === 0 &&
        (image.height & (image.height - 1)) === 0;

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      if (isPowerOfTwoTexture) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      this.texture = texture;
      this.textureLoaded = true;
      gl.bindTexture(gl.TEXTURE_2D, previousTexture0Binding);
      gl.activeTexture(previousActiveTexture);
      renderScene();
    };
    image.src = this.textureSrc;
  }

  render() {
    this.initBuffers();

    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    let restoreTexture = null;
    const previousActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
    if (this.textureLoaded && this.texture) {
      gl.activeTexture(gl.TEXTURE0);
      restoreTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(u_Samplers[0], 0);
      gl.uniform1i(u_WhichTexture, 0);
      gl.uniform1f(u_TexColorWeight, 1.0);
    } else {
      gl.uniform1i(u_WhichTexture, -1);
      gl.uniform1f(u_TexColorWeight, 0.0);
    }

    gl.drawElements(gl.TRIANGLES, this.indices.length, this.indexType, 0);

    if (this.textureLoaded) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, restoreTexture);
    }

    gl.activeTexture(previousActiveTexture);
  }
}
