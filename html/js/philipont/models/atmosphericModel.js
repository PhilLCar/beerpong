const ATMOSPHERE_TEXTURE_SIZE = 1024;

class Atmosphere {
  constructor(gl, sunlight) {
    this.gl       = gl;
    this.sunlight = sunlight;
    const atmosphericProgram = initShaderProgram(gl, atmoVertexSRC, atmoFragmentSRC);
    this.programInfo = {
      program: atmosphericProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(atmosphericProgram,  'aVertexPosition'),
      },
      uniformLocations: {
        viewport:      gl.getUniformLocation(atmosphericProgram, 'uViewport'),
        sunDirection:  gl.getUniformLocation(atmosphericProgram, 'uSunDirection'),
        planetRadius:  gl.getUniformLocation(atmosphericProgram, 'uPlanetRadius'),
        atmoRadius:    gl.getUniformLocation(atmosphericProgram, 'uAtmoRadius'),
        rayleigh:      gl.getUniformLocation(atmosphericProgram, 'uRayleigh'),
        mie:           gl.getUniformLocation(atmosphericProgram, 'uMie')
      },
    }
    this.initFrameBuffer();
    ////////////////////////////////////////////////////////////////////////
    // INITIALIZE ATMO CONSTANTS
    gl.useProgram(atmosphericProgram);
    gl.uniform1f(this.programInfo.uniformLocations.planetRadius,    6360e3);
    gl.uniform1f(this.programInfo.uniformLocations.atmoRadius,      6420e3);
    gl.uniform1f(this.programInfo.uniformLocations.rayleigh,          7994);
    gl.uniform1f(this.programInfo.uniformLocations.mie,               1200);
  }

  initFrameBuffer() {
    const gl = this.gl;
    var status;

    /// ATMO BUFFER ///
    const atmo_frame_buffer = gl.createFramebuffer();
    const atmo_buffer       = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, atmo_buffer);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, ATMOSPHERE_TEXTURE_SIZE, ATMOSPHERE_TEXTURE_SIZE, 0,
                                    gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, atmo_frame_buffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,  gl.TEXTURE_2D, atmo_buffer, 0);

    status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.log("The created frame buffer is invalid: " + status.toString());
    }
    this.atmoFrameBuffer = atmo_frame_buffer;
    this.atmoBuffer      = atmo_buffer;

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  drawAtmosphere() {
    const gl          = this.gl;
    const programInfo = this.programInfo;
    // PREP THE FRAME BUFFER
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.atmoFrameBuffer);
    gl.viewport(0, 0, ATMOSPHERE_TEXTURE_SIZE, ATMOSPHERE_TEXTURE_SIZE);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.cullFace(gl.BACK);

    { // VERTICES
      const numComponents = 3;
      const type          = gl.FLOAT;
      const normalize     = false;
      const stride        = 0;
      const offset        = 0;

      gl.bindBuffer(gl.ARRAY_BUFFER, VIEWPORT.vertices);
      gl.vertexAttribPointer(
          programInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, VIEWPORT.indices);

    gl.useProgram(programInfo.program);
    gl.uniform3fv(programInfo.uniformLocations.sunDirection, this.sunlight.position);
    gl.uniform2fv(programInfo.uniformLocations.viewport, new Float32Array([
      ATMOSPHERE_TEXTURE_SIZE,
      ATMOSPHERE_TEXTURE_SIZE
    ]));

    { // Draw lines first
      const vertexCount = VIEWPORT.vertexCount;
      const type        = gl.UNSIGNED_INT;
      const offset      = VIEWPORT.offset;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }
}