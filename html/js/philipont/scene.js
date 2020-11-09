const POISSON_DISKS = new Float32Array([
  -0.94201624,  -0.39906216,
   0.94558609,  -0.76890725,
  -0.094184101, -0.92938870,
   0.34495938,   0.29387760,
  -0.91588581,   0.45771432,
  -0.81544232,  -0.87912464,
  -0.38277543,   0.27676845,
   0.97484398,   0.75648379,
   0.44323325,  -0.97511554,
   0.53742981,  -0.47373420,
  -0.26496911,  -0.41893023,
   0.79197514,   0.19090188,
  -0.24188840,   0.99706507,
  -0.81409955,   0.91437590,
   0.19984126,   0.78641367,
   0.14383161,  -0.14100790
]);

const VIEWPORT = {
  vertices: null,
  vertexBuffer: new Float32Array([
     1.0,  1.0, 0.0,
    -1.0,  1.0, 0.0,
    -1.0, -1.0, 0.0,
     1.0, -1.0, 0.0
  ]),
  normals: null,
  normalBuffer: null,
  colorBuffer:  null,
  indices: null,
  indexBuffer: new Uint32Array([
    0, 1, 2, 0, 2, 3
  ]),
  vertexCount: 6,
  offset: 0
};

const SHADOW_TEXTURE_SIZE = 1024;

class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.setAttribute("height", window.innerHeight + "px");
    canvas.setAttribute("width",  window.innerWidth - 250  + "px");

    const gl = canvas.getContext("webgl2", { antialias: false });
    if (!gl) {
      return alert("Your browser does not support WebGL2!");
    }
    if (!gl.getExtension('EXT_color_buffer_float')) {
      return alert("Your browser is missing the extension: 'EXT_color_buffer_float'");
    }
    if (!gl.getExtension('EXT_float_blend')) {
      return alert("Your browser is missing the extension: 'EXT_float_blend'");
    }
    if (!gl.getExtension('OES_texture_float_linear')) { // TODO: MAYBE SWITCH TO NEAREST
      return alert("Your browser is missing the extension: 'OES_texture_float_linear'");
    }
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA
    );

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const shadowShaderProgram = initShaderProgram(gl, shadowVertexSRC, shadowFragmentSRC);
    const shaderProgram       = initShaderProgram(gl, sceneVertexSRC,  sceneFragmentSRC);
    const hdrProgram          = initShaderProgram(gl, hdrVertexSRC,    hdrFragmentSRC);
    this.shadowProgramInfo = {
      program: shadowShaderProgram,
      attribLocations: {
        vertexPosition:   gl.getAttribLocation(shadowShaderProgram,  'aVertexPosition'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shadowShaderProgram, 'uProjectionMatrix'),
        modelViewMatrix:  gl.getUniformLocation(shadowShaderProgram, 'uModelViewMatrix')
      },
    }
    this.programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition:   gl.getAttribLocation(shaderProgram,  'aVertexPosition'),
        vertexColor:      gl.getAttribLocation(shaderProgram,  'aVertexColor'),
        vertexNormal:     gl.getAttribLocation(shaderProgram,  'aVertexNormal'),
        objectCenter:     gl.getAttribLocation(shaderProgram,  'aObjectCenter'),
        objectType:       gl.getAttribLocation(shaderProgram,  'aObjectType')
      },
      uniformLocations: {
        modelViewMatrix:      gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        projectionMatrix:     gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        shadowTransform:      gl.getUniformLocation(shaderProgram, 'uShadowTransform'),
        normalTransform:      gl.getUniformLocation(shaderProgram, 'uNormalTransform'),
        isLit:                gl.getUniformLocation(shaderProgram, 'uIsLit'),
        lightDirectional:     gl.getUniformLocation(shaderProgram, 'uLightDirectional'),
        lightPosition:        gl.getUniformLocation(shaderProgram, 'uLightPosition'),
        lightColor:           gl.getUniformLocation(shaderProgram, 'uLightColor'),
        lightNum:             gl.getUniformLocation(shaderProgram, 'uLightNum'),
        shadowMap:            gl.getUniformLocation(shaderProgram, 'uShadowMap'),
        textureMap:           gl.getUniformLocation(shaderProgram, 'uTextureMap'),
        poissonDisks:         gl.getUniformLocation(shaderProgram, 'POISSON_DISKS')
      }
    };
    this.hdrProgramInfo = {
      program: hdrProgram,
      attribLocations: {
        vertexPosition:   gl.getAttribLocation(hdrProgram,  'aVertexPosition'),
      },
      uniformLocations: {
        sceneMap:         gl.getUniformLocation(hdrProgram, 'uSceneMap'),
        viewport:         gl.getUniformLocation(hdrProgram, 'uViewport'),
        poissonDisks:     gl.getUniformLocation(hdrProgram, 'POISSON_DISKS')
      },
    }

    /// VIEWPORT COORDS ///
    VIEWPORT.vertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VIEWPORT.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, VIEWPORT.vertexBuffer, gl.STATIC_DRAW);
    VIEWPORT.indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, VIEWPORT.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, VIEWPORT.indexBuffer, gl.STATIC_DRAW);

    this.gl                 = gl;
    this.level              = null;
    this.mouseray           = null;
    this.rotEnabled         = false;
    this.modEnabled         = false;
    this.modSubstract       = true;
    this.modApply           = false;
    this.modArea            =  2.0;
    this.maxTranslation     = 10.0;
    this.maxZoom            = -6.0;
    this.minZoom            = -6.0;
    this.previousCoords     = null;
    this.rotation           = vec3.fromValues(Math.PI / 20.0, 0.0, 0.0);
    this.translation        = vec3.fromValues(0.0, 0.0, -6.0);
    this.isLit              = true;
    this.atmoOn             = true;
    this.gridOn             = false;
    this.gridHD             = false;
    this.lineStop           = 0;
    this.vertexBuffer       = new Buffer(MAX_INDICES * 3, Buffer.FLOAT);
    this.vertices           = gl.createBuffer();
    this.normalBuffer       = new Buffer(MAX_INDICES * 3, Buffer.FLOAT);
    this.normals            = gl.createBuffer();
    this.colorBuffer        = new Buffer(MAX_INDICES * 4, Buffer.FLOAT);
    this.colors             = gl.createBuffer();
    this.indexBuffer        = new Buffer(MAX_INDICES, Buffer.UNSIGNED_INT, true);
    this.indices            = gl.createBuffer();
    this.positionBuffer     = new Buffer(MAX_INDICES * 3, Buffer.FLOAT);
    this.positions          = gl.createBuffer();
    this.objTypeBuffer      = new Buffer(MAX_INDICES, Buffer.UNSIGNED_BYTE);
    this.objTypes           = gl.createBuffer();
    this.materialTextures   = [];
    this.solids             = [];
    this.lines              = [];
    this.lights             = [];
    this.lights.push(new Light(LIGHTS.SUN));
    this.atmosphere = new Atmosphere(gl, this.lights[0]);
    this.addMaterialTexture(MATERIALS.ATMOSPHERE.TEXTURE, this.atmosphere.atmoBuffer);
    this.initFrameBuffers();
    ////////////////////////////////////////////////////////////////////////
    // INITIALIZE PCSS CONSTANTS
    gl.useProgram(shaderProgram);
    gl.uniform2fv(this.programInfo.uniformLocations.poissonDisks, POISSON_DISKS);
    ////////////////////////////////////////////////////////////////////////
    // INITIALIZE BLEED CONSTANTS
    gl.useProgram(hdrProgram);
    gl.uniform2fv(this.hdrProgramInfo.uniformLocations.poissonDisks, POISSON_DISKS);
  }

  initFrameBuffers() {
    const gl = this.gl;
    var status;

    /// DEPTH BUFFER ///
    this.depthBuffers      = [];
    this.depthFrameBuffers = [];
    for (var i = 0; i < MAX_NUM_LIGHTS; i++) {
      const depth_frame_buffer = gl.createFramebuffer();
      const depth_buffer       = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, depth_buffer);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, SHADOW_TEXTURE_SIZE, SHADOW_TEXTURE_SIZE, 0,
                                      gl.DEPTH_COMPONENT, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.bindFramebuffer(gl.FRAMEBUFFER, depth_frame_buffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.TEXTURE_2D, depth_buffer, 0);

      status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.log(`The created frame buffer #${i} is invalid: ` + status.toString());
      }
      this.depthBuffers.push(depth_buffer);
      this.depthFrameBuffers.push(depth_frame_buffer);
    }

    /// HDR BUFFER ///
    const hdr_frame_buffer = gl.createFramebuffer();
    const hdr_buffer       = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, hdr_buffer);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, gl.canvas.clientWidth, gl.canvas.clientHeight, 0,
                                    gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, hdr_frame_buffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,  gl.TEXTURE_2D, hdr_buffer, 0);

    status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.log("The created frame buffer is invalid: " + status.toString());
    }
    this.hdrFrameBuffer = hdr_frame_buffer;
    this.hdrBuffer      = hdr_buffer;

    /// RENDER BUFFER ///
    const render_frame_buffer = gl.createFramebuffer();
    const render_buffer       = gl.createRenderbuffer();
    const render_depth_buffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, render_buffer);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER,
                                      8,
                                      gl.RGBA32F,
                                      gl.canvas.clientWidth,
                                      gl.canvas.clientHeight);
    gl.bindRenderbuffer(gl.RENDERBUFFER, render_depth_buffer);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER,
                                      8,
                                      gl.DEPTH_COMPONENT32F,
                                      gl.canvas.clientWidth,
                                      gl.canvas.clientHeight);

    gl.bindFramebuffer(gl.FRAMEBUFFER, render_frame_buffer);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, render_buffer);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.RENDERBUFFER, render_depth_buffer);

    status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.log("The created frame buffer is invalid: " + status.toString());
    }
    this.renderFrameBuffer = render_frame_buffer;
    this.renderBuffer      = render_buffer;

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  drawShadows() {
    const gl                = this.gl;
    const programInfo       = this.programInfo;
    const shadowProgramInfo = this.shadowProgramInfo;
    const level             = this.level;
    const shadowTransforms  = [];
    if (this.level === null) return;

    for (var i = 0; i < this.lights.length; i++) {
      // PREP THE FRAME BUFFER
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffers[i]);
      gl.viewport(0, 0, SHADOW_TEXTURE_SIZE, SHADOW_TEXTURE_SIZE);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.clearDepth(1.0);
      gl.depthFunc(gl.LEQUAL);
      gl.cullFace(gl.FRONT);

      // INIT LIGHT MATRIX
      const size = Math.sqrt(level.terrainSizeX * level.terrainSizeX + 
                             level.terrainSizeZ * level.terrainSizeZ) / 2;
      const top    =  size;
      const bottom = -size;
      const left   = -size;
      const right  =  size;
      const projectionMatrix = mat4.create();
      mat4.ortho(projectionMatrix,
                left,
                right,
                bottom,
                top,
                ZNEAR,
                ZFAR);

      const lightSource = vec3.create();
      if (this.lights[i].directional) {
        vec3.scale(lightSource, this.lights[i].position, size);
      } else {
        vec3.scale(lightSource, this.lights[i].position, 1.0);
      }
      const modelViewMatrix = mat4.create();
      mat4.lookAt(modelViewMatrix,
                  lightSource,
                  vec3.fromValues(0, 0, 0), // todo: eventually allow lights to focus elsewhere
                  vec3.fromValues(0, 1, 0));

      const shadowTransform = mat4.fromValues(0.5, 0.0, 0.0, 0.0,
                                              0.0, 0.5, 0.0, 0.0,
                                              0.0, 0.0, 0.5, 0.0,
                                              0.5, 0.5, 0.5, 1.0);
      mat4.mul(shadowTransform, shadowTransform, projectionMatrix);
      mat4.mul(shadowTransform, shadowTransform, modelViewMatrix);
      shadowTransforms.push(shadowTransform);

      gl.useProgram(shadowProgramInfo.program);
      gl.uniformMatrix4fv(shadowProgramInfo.uniformLocations.projectionMatrix,
                          false,
                          projectionMatrix);
      gl.uniformMatrix4fv(shadowProgramInfo.uniformLocations.modelViewMatrix,
                          false,
                          modelViewMatrix);

      { // VERTICES
        const numComponents = 3;
        const type          = gl.FLOAT;
        const normalize     = false;
        const stride        = 0;
        const offset        = 0;
  
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
        gl.vertexAttribPointer(
            shadowProgramInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(shadowProgramInfo.attribLocations.vertexPosition);
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
      {
        const vertexCount = this.indexBuffer.lineOffset;
        const type        = gl.UNSIGNED_INT;
        const offset      = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
      }
    }
    const shadowTransformsArray = new Float32Array(shadowTransforms.length * 16);
    for (var i = 0; i < shadowTransforms.length; i++) {
      shadowTransformsArray.set(shadowTransforms[i], 16 * i);
    }
    // Save shadow transform for later
    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(programInfo.uniformLocations.shadowTransform,
                        false,
                        shadowTransformsArray);
  }

  drawScene() {
    const gl          = this.gl;
    const programInfo = this.programInfo;
    const rotation    = this.rotation;
    const translation = this.translation;
    if (this.level === null) return;

    // PREP THE FRAME BUFFER
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderFrameBuffer);
    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.cullFace(gl.BACK);

    // INIT WORLD MATRICES
    const projectionMatrix = mat4.create();
    if (this.ortho) {
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const size   = this.level.terrainSizeX / 2.0;
      const top    =  size / aspect;
      const bottom = -size / aspect;
      const left   = -size;
      const right  =  size;
      mat4.ortho(projectionMatrix,
                 left,
                 right,
                 bottom,
                 top,
                 ZNEAR,
                 ZFAR);
    } else {
      const fieldOfView = 45 * Math.PI / 180;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      mat4.perspective(projectionMatrix,
                      fieldOfView,
                      aspect,
                      ZNEAR,
                      ZFAR);
    }
    this.projectionMatrix = projectionMatrix;

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix,
                   modelViewMatrix,
                   translation);
    mat4.rotate(modelViewMatrix,
                modelViewMatrix,
                rotation[0],
                [1.0, 0.0, 0.0]);
    mat4.rotate(modelViewMatrix,
                modelViewMatrix,
                rotation[1],
                [0.0, 1.0, 0.0]);
    this.modelViewMatrix = modelViewMatrix;

    const normalTransform    = mat4.create();
    const normalTransform3x3 = mat3.create();
    mat4.invert(normalTransform, modelViewMatrix);
    mat4.transpose(normalTransform, normalTransform);
    mat3.fromMat4(normalTransform3x3, normalTransform);

    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,
                        false,
                        projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,
                        false,
                        modelViewMatrix);
    gl.uniformMatrix3fv(programInfo.uniformLocations.normalTransform,
                        false,
                        normalTransform3x3);
    const shadowMap   = new Int32Array(this.lights.length);
    const directional = new Int32Array(this.lights.length);
    const position    = new Float32Array(this.lights.length * 3);
    const color       = new Float32Array(this.lights.length * 3);
    for (var i = 0; i < this.lights.length; i++) {
      shadowMap[i] = i;
      directional[i] = this.lights[i].directional ? 1 : 0;
      position.set(this.lights[i].getPosition(), 3 * i);
      color.set(this.lights[i].getColor(), 3 * i);
      gl.activeTexture(gl[`TEXTURE${i}`]);
      gl.bindTexture(gl.TEXTURE_2D, this.depthBuffers[i]);
    }
    const textureMap = new Int32Array(this.materialTextures.length);
    for (var i = 0; i < this.materialTextures.length; i++) {
      textureMap[i] = this.materialTextures[i].ID;
      gl.activeTexture(gl[`TEXTURE${textureMap[i]}`]);
      gl.bindTexture(gl.TEXTURE_2D, this.materialTextures[i].texture);
    }
    gl.uniform1iv(programInfo.uniformLocations.textureMap,       textureMap);
    gl.uniform1iv(programInfo.uniformLocations.shadowMap,        shadowMap);
    gl.uniform1iv(programInfo.uniformLocations.lightDirectional, directional);
    gl.uniform3fv(programInfo.uniformLocations.lightPosition,    position);
    gl.uniform3fv(programInfo.uniformLocations.lightColor,       color);
    gl.uniform1ui(programInfo.uniformLocations.lightNum,         this.lights.length);
    gl.uniform1i(programInfo.uniformLocations.isLit,             this.isLit);
    { // VERTICES
      const numComponents = 3;
      const type          = gl.FLOAT;
      const normalize     = false;
      const stride        = 0;
      const offset        = 0;

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
      gl.vertexAttribPointer(
          programInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          programInfo.attribLocations.vertexPosition);
    }
    { // COLORS
      const numComponents = 4;
      const type          = gl.FLOAT;
      const normalize     = false;
      const stride        = 0;
      const offset        = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colors);
      gl.vertexAttribPointer(
          programInfo.attribLocations.vertexColor,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          programInfo.attribLocations.vertexColor);
    }
    { // NORMALS
      const numComponents = 3;
      const type          = gl.FLOAT;
      const normalize     = false;
      const stride        = 0;
      const offset        = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
      gl.vertexAttribPointer(
          programInfo.attribLocations.vertexNormal,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          programInfo.attribLocations.vertexNormal);
    }
    { // POSITIONS
      const numComponents = 3;
      const type          = gl.FLOAT;
      const normalize     = false;
      const stride        = 0;
      const offset        = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
      gl.vertexAttribPointer(
          programInfo.attribLocations.objectCenter,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          programInfo.attribLocations.objectCenter);
    }
    { // TYPES
      const numComponents = 1;
      const type          = gl.UNSIGNED_BYTE;
      const normalize     = false;
      const stride        = 0;
      const offset        = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.objTypes);
      gl.vertexAttribIPointer(
          programInfo.attribLocations.objectType,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          programInfo.attribLocations.objectType);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
    {
      const vertexCount = this.indexBuffer.offset - this.indexBuffer.lineOffset;
      const type        = gl.UNSIGNED_INT;
      const offset      = this.indexBuffer.lineOffset * 4;
      gl.drawElements(gl.LINES, vertexCount, type, offset);
    }
    {
      const vertexCount = this.indexBuffer.lineOffset;
      const type        = gl.UNSIGNED_INT;
      const offset      = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

    // ANTI ALIAS
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.renderFrameBuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.hdrFrameBuffer);
    gl.clearBufferfv(gl.COLOR, 0, [ 0.0, 0.0, 0.0, 1.0 ]);
    gl.blitFramebuffer(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight,
                       0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight,
                       gl.COLOR_BUFFER_BIT, gl.LINEAR);
  }

  drawHDR() {
    const gl             = this.gl;
    const hdrProgramInfo = this.hdrProgramInfo;
    if (this.level === null) return;

    // PREP THE FRAME BUFFER
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    { // VERTICES
      const numComponents = 3;
      const type          = gl.FLOAT;
      const normalize     = false;
      const stride        = 0;
      const offset        = 0;

      gl.bindBuffer(gl.ARRAY_BUFFER, VIEWPORT.vertices);
      gl.vertexAttribPointer(
          hdrProgramInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          hdrProgramInfo.attribLocations.vertexPosition);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, VIEWPORT.indices);

    gl.useProgram(hdrProgramInfo.program);
    gl.uniform2fv(hdrProgramInfo.uniformLocations.viewport, new Float32Array([
      gl.canvas.clientWidth,
      gl.canvas.clientHeight
    ]));
    gl.uniform1i(hdrProgramInfo.uniformLocations.sceneMap, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.hdrBuffer);

    {
      const vertexCount = VIEWPORT.vertexCount;
      const type        = gl.UNSIGNED_INT;
      const offset      = VIEWPORT.offset;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }

  addMaterialTexture (textureID, texture) {
    this.materialTextures.push({
      ID: textureID,
      texture: texture
    });
  }

  addSolid(solid) {
    this.solids.push(solid);
    return solid;
  }

  removeSolid(solid) {
    for (var i = 0; i < this.solids.length; i++) {
      if (this.solids[i].ID == solid.id) {
        var rem = this.solids.splice(i, 1);
        rem[0].destroy();
        break;
      }
    }
  }

  addLine(line) {
    this.lines.push(line);
    return line;
  }

  removeLine(line) {
    for (var i = 0; i < this.lines.length; i++) {
      if (this.lines[i].ID == line.ID) {
        var rem = this.lines.splice(i, 1);
        rem[0].destroy();
        break;
      }
    }
  }

  toggleGridOn() {
    DM.renderLevel |= RENDER_BUFFERS;
    this.gridOn = !this.gridOn;
  }

  toggleGridHD() {
    DM.renderLevel |= RENDER_BUFFERS;
    this.gridHD = !this.gridHD;
  }

  setTranslation(nTranslation) {
    DM.renderLevel |= RENDER_SCENE;
    if (nTranslation == null) {
      this.translation = vec3.fromValues(0, 0, -6);
    } else {
      vec3.add(this.translation, this.translation, nTranslation);
      if (this.translation[0] >  this.maxTranslation) this.translation[0] =  this.maxTranslation;
      if (this.translation[0] < -this.maxTranslation) this.translation[0] = -this.maxTranslation;
      if (this.translation[1] >  this.maxTranslation) this.translation[1] =  this.maxTranslation;
      if (this.translation[1] < -this.maxTranslation) this.translation[1] = -this.maxTranslation;
      if (this.translation[2] >  this.maxZoom) this.translation[2]        = this.maxZoom;
      if (this.translation[2] <  this.minZoom) this.translation[2]        = this.minZoom;
    }
  }

  setSun(sunVector) {
    DM.renderLevel |= RENDER_ATMO;
    vec3.normalize(sunVector, sunVector);
    this.lights[0].position = sunVector;
  }

  setModApply(modApply) {
    DM.renderLevel |= RENDER_BUFFERS;
    this.modApply = modApply;
  }

  setRotation(x, y) {
    if (x === null || y === null) {
      DM.renderLevel |= RENDER_SCENE;
      this.rotation = vec3.fromValues(Math.PI / 20, 0, 0);
    } else if (this.previousCoords !== null) {
      DM.renderLevel |= RENDER_SCENE;
      vec3.sub(this.previousCoords, vec3.fromValues(y, x, 0), this.previousCoords);
      vec3.scale(this.previousCoords, this.previousCoords, 0.01);
      vec3.add(this.previousCoords, this.rotation, this.previousCoords);
      this.rotation = this.previousCoords;
      if (this.previousCoords[0] >  Math.PI / 2)  this.previousCoords[0] =  Math.PI / 2;
      if (this.previousCoords[0] <  Math.PI / 20) this.previousCoords[0] =  Math.PI / 20;
      if (this.previousCoords[1] >  Math.PI / 2)  this.previousCoords[1] =  Math.PI / 2;
      if (this.previousCoords[1] < -Math.PI / 2)  this.previousCoords[1] = -Math.PI / 2;
      this.rotation = this.previousCoords;
    }
    this.previousCoords = vec3.fromValues(y, x, 0);
  }

  setMod(x, y) {
    DM.renderLevel |= RENDER_BUFFERS;
    const canvas = this.canvas
    const invMat = mat4.create();
    const posn   = vec4.create();
    const posf   = vec4.create();
    const pos0   = vec3.create();
    const pos1   = vec3.create();
    const mRay   = vec3.create();
    const u =  (x - canvas.clientLeft - canvas.clientWidth  / 2) / (canvas.clientWidth  / 2);
    const v = -(y- canvas.clientTop  - canvas.clientHeight / 2) / (canvas.clientHeight / 2);
    mat4.mul(invMat, this.projectionMatrix, this.modelViewMatrix);
    mat4.invert(invMat, invMat);
    vec4.transformMat4(posn, vec4.fromValues(u, v, -1, 1), invMat);
    vec4.transformMat4(posf, vec4.fromValues(u, v,  1, 1), invMat);
    if (posn[3] == 0 || posf[3] == 0) {
      this.mouseray = null;
      return;
    }
    pos0[0] = posn[0] / posn[3];
    pos0[1] = posn[1] / posn[3];
    pos0[2] = posn[2] / posn[3];
    pos1[0] = posf[0] / posf[3];
    pos1[1] = posf[1] / posf[3];
    pos1[2] = posf[2] / posf[3];
    vec3.sub(mRay, pos1, pos0);
    vec3.normalize(mRay, mRay);

    this.mouseray = [ pos0, mRay ];
  }

  initBuffers(level) {
    this.level = level;
    this.terrain    = this.addSolid(initTerrain(this, level));
    this.waterPlane = this.addSolid(initWaterPlane(this, level));
    this.waterWaves = this.addSolid(initWaterWaves(this, level));
    this.atmo       = this.addSolid(initAtmo(this, level));
    this.gridBack   = this.addSolid(initGridBack(this, level));
    this.grid       = this.addLine(initGrid(this, level));
    this.hdGrid     = this.addLine(initGridHD(this, level));

    this.maxTranslation = level.terrainSizeX / 2;
    this.minZoom        = -2 * level.terrainSizeZ;
    this.modEnabled     = true;
    DM.renderLevel     |= RENDER_BUFFERS;
  }

  destroyBuffers() {
    this.level = null;
    while (this.solids.length > 0) {
      this.removeSolid(0);
    }
    while (this.lines.length > 0) {
      this.removeLine(0);
    }
    this.terrain    = null;
    this.waterPlane = null;
    this.waterWaves = null;
    this.atmo       = null;
    this.gridBack   = null;
    this.grid       = null;
    this.hdGrid     = null;
  }

  updateBuffers(t) {
    const gl  = this.gl;
    if (this.gridOn != this.prevGridOn) {
      this.prevGridOn      = this.gridOn;
      this.grid.ignore(!this.gridOn);
      this.gridBack.ignore(!this.gridOn);
      this.hdGrid.ignore(!this.gridOn || ! this.gridHD);
    }
    if (this.gridHD != this.prevGridHD) {
      this.prevGridHD = this.gridHD;
      this.hdGrid.ignore(!this.gridOn || ! this.gridHD);
    }
    if (this.atmoOn != this.prevAtmoOn) {
      this.prevAtmoOn = this.atmoOn;
      this.atmo.ignore(!this.atmoOn);
    }
    if (DM.animate != DM.prevAnimate) {
      DM.renderLevel |= RENDER_BUFFERS;
      DM.prevAnimate = DM.animate;
      this.waterPlane.ignore(DM.animate);
      this.waterWaves.ignore(!DM.animate);
    }
    for (var solid of this.solids) {
      if (solid.ignored) continue;
      solid.animate(this, t);
    }
    for (var line of this.lines) {
      if (line.ignored) continue;
      line.animate(this, t);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexBuffer.buffer, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer.buffer, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
    gl.bufferData(gl.ARRAY_BUFFER, this.normalBuffer.buffer, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colors);
    gl.bufferData(gl.ARRAY_BUFFER, this.colorBuffer.buffer, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
    gl.bufferData(gl.ARRAY_BUFFER, this.positionBuffer.buffer, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.objTypes);
    gl.bufferData(gl.ARRAY_BUFFER, this.objTypeBuffer.buffer, gl.DYNAMIC_DRAW);
  }
}