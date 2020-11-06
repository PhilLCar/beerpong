var _shape_unique_id = 0;

class Shape {
  constructor(gl, buffers, material = MATERIALS.DEFAULT, position = vec3.fromValues(0.0, 0.0, 0.0)) {
    this.ID = _shape_unique_id++;
    this.gl = gl;
    /// BUFFERS ///
    this.vertexBuffer = new Float32Array(buffers.vertexBuffer);
    this.indexBuffer  = new Uint32Array(buffers.indexBuffer);
    this.normalBuffer = buffers.normalBuffer ? new Float32Array(buffers.normalBuffer) : null;
    this.colorBuffer  = buffers.colorBuffer  ? new Float32Array(buffers.colorBuffer)  : null;
    /// ATTRIBUTES ///
    this.texture      = material.TEXTURE;
    this.preset       = material.COLOR_PRESET;
    this.ambiant      = material.AMBIANT;
    this.diffuse      = material.DIFFUSE;
    this.specularSoft = material.SPEC_SOFT;
    this.specularHard = material.SPEC_HARD;
    this.center       = position ? position : vec3.fromValues(0.0, 0.0, 0.0);
    this.type         = material.TYPE;
    /// META ///
    this.vertexCount = buffers.indexBuffer.length;
    this.offset      = 0;
    this.isLine      = false;
    this.ignore      = false;
    /// GL ///
    this.bindBuffers();
  }

  bindBuffers() {
    const gl = this.gl;
    if (this.vertices) gl.deleteBuffer(this.vertices);
    this.vertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexBuffer, gl.STATIC_DRAW);
    if (this.indices) gl.deleteBuffer(this.indices);
    this.indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer, gl.STATIC_DRAW);
    if (this.normalBuffer !== null) {
      if (this.normals) gl.deleteBuffer(this.normals);
      this.normals = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
      gl.bufferData(gl.ARRAY_BUFFER, this.normalBuffer, gl.STATIC_DRAW);
    }
    if (this.colorBuffer !== null) {
      if (this.colors) gl.deleteBuffer(this.colors);
      this.colors = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colors);
      gl.bufferData(gl.ARRAY_BUFFER, this.colorBuffer, gl.STATIC_DRAW);
    }
  }

  animate(scene, t) {
    if (this.doAnimate) {
      this.doAnimate(scene, t);
      this.bindBuffers();
    }
  }

  destroy() {
    if (this.vertices !== null) {
      this.gl.deleteBuffer(this.vertices);
      this.vertexBuffer = null;
      this.vertices     = null;
    }
    if (this.indices !== null) {
      this.gl.deleteBuffer(this.indices);
      this.indexBuffer = null;
      this.indices     = null;
    }
    if (this.normals !== null) {
      this.gl.deleteBuffer(this.normals);
      this.normalBuffer = null;
      this.normals      = null;
    }
    if (this.colors !== null) {
      this.gl.deleteBuffer(this.colors);
      this.colorBuffer = null;
      this.colors      = null;
    }
  }
}