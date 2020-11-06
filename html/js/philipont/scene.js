
const mat3 = glMatrix.mat3;
const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const vec4 = glMatrix.vec4;

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
const MAX_NUM_LIGHTS      = 4;

const ZNEAR = 0.1;
const ZFAR  = 100.0;

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
        vertexMaterial:   gl.getAttribLocation(shaderProgram,  'aVertexMaterial')
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
        materialTextureMap:   gl.getUniformLocation(shaderProgram, 'uMaterialTextureMap'),
        materialBumpMap:      gl.getUniformLocation(shaderProgram, 'uMaterialBumpMap'),
        materialAmbiant:      gl.getUniformLocation(shaderProgram, 'uMaterialAmbiant'),
        materialDiffuse:      gl.getUniformLocation(shaderProgram, 'uMaterialDiffuse'),
        materialSpecularSoft: gl.getUniformLocation(shaderProgram, 'uMaterialSpecularSoft'),
        materialSpecularHard: gl.getUniformLocation(shaderProgram, 'uMaterialSpecularHard'),
        objectCenter:         gl.getUniformLocation(shaderProgram, 'uObjectCenter'),
        objectType:           gl.getUniformLocation(shaderProgram, 'uObjectType'),
        shadowMap:            gl.getUniformLocation(shaderProgram, 'uShadowMap'),
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
    this.gl             = gl;
    this.level          = null;
    this.mouseray       = null;
    this.rotEnabled     = false;
    this.modEnabled     = false;
    this.modSubstract   = true;
    this.modApply       = false;
    this.modArea        =  2.0;
    this.maxTranslation = 10.0;
    this.maxZoom        = -6.0;
    this.minZoom        = -6.0;
    this.previousCoords = null;
    this.rotation       = vec3.fromValues(Math.PI / 20.0, 0.0, 0.0);
    this.translation    = vec3.fromValues(0.0, 0.0, -6.0);
    this.isLit          = true;
    this.atmoOn         = true;
    this.gridOn         = false;
    this.gridHD         = false;
    this.solids         = [];
    this.lines          = [];
    this.lights         = [];
    this.atmosphere     = new Atmosphere(gl);
    this.lights.push(new Light(LIGHTS.SUN));
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

    /// HDR COORDS ///
    const hdrVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hdrVertices);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(viewportCoords), gl.STATIC_DRAW);
    this.hdrVertices = hdrVertices;
    const hdrIndices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hdrIndices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(viewportIndices), gl.STATIC_DRAW);
    this.hdrIndices = hdrIndices;

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
                zNear,
                zFar);

      const lightSource = vec3.create();
      if (this.lights[i].directional) {
        vec3.scale(lightSource, this.lights[i].position, size);
      } else {
        vec3.scale(lightSource, this.lights[i].posiiton, 1.0);
      }
      const modelViewMatrix = mat4.create();
      mat4.lookAt(modelViewMatrix,
                  lightSource,
                  vec3.fromValues(0, 0, 0),
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

      for (var solid of this.solids) {
        if (solid.ignore) continue;
        { // VERTICES
          const numComponents = 3;
          const type          = gl.FLOAT;
          const normalize     = false;
          const stride        = 0;
          const offset        = 0;
    
          gl.bindBuffer(gl.ARRAY_BUFFER, solid.vertices);
          gl.vertexAttribPointer(
              shadowProgramInfo.attribLocations.vertexPosition,
              numComponents,
              type,
              normalize,
              stride,
              offset);
          gl.enableVertexAttribArray(shadowProgramInfo.attribLocations.vertexPosition);
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, solid.indices);
        {
          const vertexCount = solid.vertexCount;
          const type        = gl.UNSIGNED_INT;
          const offset      = solid.offset;
          gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
      }
    }
    /// TODO: might fail
    const shadowTransformsArray = new Float64Array(shadowTransforms.length * 16);
    for (var i = 0; i < shadowTransforms.length; i++) {
      shadowTransformsArray.set(shadowTransforms[i].buffer, 16 * i);
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
    const shadowMap   = new Uint8Array(this.lights.length);
    const directional = new Uint8Array(this.lights.length);
    const position    = new Float64Array(this.lights.length * 3);
    const color       = new Float64Array(this.lights.length * 3);
    for (var i = 0; i < this.lights.length; i++) {
      shadowMap[i]  = i;
      directional[i] = this.lights[i].directional ? 1 : 0;
      positions.set(this.lights[i].getPosition().buffer, 3 * i);
      colors.set(this.lights[i].getColor().buffer, 3 * i);
      gl.activeTexture(gl[`TEXTURE${i}`]);
      gl.bindTexture(gl.TEXTURE_2D, this.depthBuffers[i]);
    }
    gl.uniform1iv(programInfo.uniformLocations.shadowMap,        false, shadowMap);
    gl.uniform1iv(programInfo.uniformLocations.lightDirectional, false, directional);
    gl.uniform3fv(programInfo.uniformLocations.lightPosition,    false, position);
    gl.uniform3fv(programInfo.uniformLocations.lightColor,       false, color);
    gl.uniform1i(programInfo.uniformLocations.lightNum, this.lights.length);
    gl.uniform1i(programInfo.uniformLocations.isLit,    this.isLit);

    for (var shape of this.lines.concat(this.solids)) {
      if (shape.ignore) continue;
      var textureOffset = this.lights.length;
      if (shape.textureMap !== null) {
        gl.uniform1i(programInfo.uniformLocations.materialTextureMap, textureOffset);
        gl.activeTexture(gl[`TEXTURE${textureOffset}`]);
        gl.bindTexture(gl.TEXTURE_2D, shape.textureMap);
        textureOffset++;
      }
      if (shape.bumpMap !== null) {
        gl.uniform1i(programInfo.uniformLocations.materialTextureMap, textureOffset);
        gl.activeTexture(gl[`TEXTURE${textureOffset}`]);
        gl.bindTexture(gl.TEXTURE_2D, shape.bumpMap);
      }
      gl.uniform3fv(programInfo.uniformLocations.materialAmbiant,      false, solid.ambiant);
      gl.uniform3fv(programInfo.uniformLocations.materialDiffuse,      false, solid.diffuse);
      gl.uniform2fv(programInfo.uniformLocations.materialSpecularSoft, false, solid.specularSoft);
      gl.uniform2fv(programInfo.uniformLocations.materialSpecularHard, false, solid.specularHard);
      gl.uniform3fv(programInfo.uniformLocations.objectCenter,         false, solid.center);
      gl.uniform1i(programInfo.uniformLocations.objectType, shape.type);

      { // VERTICES
        const numComponents = 3;
        const type          = gl.FLOAT;
        const normalize     = false;
        const stride        = 0;
        const offset        = 0;
  
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertices);
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
      if (shape.colors !== null) { // COLORS
        const numComponents = 4;
        const type          = gl.FLOAT;
        const normalize     = false;
        const stride        = 0;
        const offset        = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.colors);
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
      if (shape.normals !== null) { // NORMALS
        const numComponents = 3;
        const type          = gl.FLOAT;
        const normalize     = false;
        const stride        = 0;
        const offset        = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.normals);
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
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indices);


      if (shape.isLine) {
        const vertexCount = shape.vertexCount;
        const type        = gl.UNSIGNED_INT;
        const offset      = shape.offset;
        gl.drawElements(gl.LINES, vertexCount, type, offset);
      } else {
        const vertexCount = shape.vertexCount;
        const type        = gl.UNSIGNED_INT;
        const offset      = shape.offset;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
      }
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

    { // Draw lines first
      const vertexCount = VIEWPORT.vertexCount;
      const type        = gl.UNSIGNED_INT;
      const offset      = VIEWPORT.offset;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }

  addSolid(solid) {
    this.solids.push(solid);
    return solid;
  }

  removeSolid(solidID) {
    for (var i = 0; i < this.solids.length; i++) {
      if (this.solids[i].ID == solidID) {
        const rem = this.solids.splice(i, i);
        rem[0].destroy();
        break;
      }
    }
  }

  addLine(line) {
    this.lines.push(line);
    return line;
  }

  removeLine(lineID) {
    for (var i = 0; i < this.lines.length; i++) {
      if (this.lines[i].ID == lineID) {
        const rem = this.lines.splice(i, i);
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
    vec3.normalize(sunVector, sunVector);
    this.lights[0].position = sunVector;
  }

  setModApply(modApply) {
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
    var x =  (e.clientX - canvas.clientLeft - canvas.clientWidth  / 2) / (canvas.clientWidth  / 2);
    var y = -(e.clientY - canvas.clientTop  - canvas.clientHeight / 2) / (canvas.clientHeight / 2);
    mat4.mul(invMat, this.projectionMatrix, this.modelViewMatrix);
    mat4.invert(invMat, invMat);
    vec4.transformMat4(posn, vec4.fromValues(x, y, -1, 1), invMat);
    vec4.transformMat4(posf, vec4.fromValues(x, y,  1, 1), invMat);
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
    this.terrain    = this.addSolid(initTerrain(this.gl, level));
    this.waterPlane = this.addSolid(initWaterPlane(this.gl, level));
    this.waterWaves = this.addSolid(initWaterWaves(this.gl, level));
    this.atmo       = this.addSolid(initAtmo(this.gl, level));
    this.grid       = this.addLine(initGrid(this.gl, level));
    this.gridHD     = this.addLine(initGridHD(this.gl, level));

    this.waterWaves.ignore = true;
    this.gridHD.ignore     = true;
    this.grid.ignore       = !this.gridOn;
    this.atmo.ignore       = !this.atmoOn;

    DM.maxTranslation = level.terrainSizeX / 2;
    DM.minZoom        = -2 * level.terrainSizeZ;
    DM.modEnabled     = true; // TODO: TEMP
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
    this.grid       = null;
    this.gridHD     = null;
  }

  updateBuffers(t) {
    this.waterWaves.ignore = t === null;
    this.waterPlane.ignore = t !== null;
    this.gridHD.ignore     = !this.gridHD || !this.gridOn;
    this.grid.ignore       = !this.gridOn;
    this.atmo.ignore       = !this.atmoOn;

    for (var solid of this.solids) {
      solid.animate(this, t);
    }
    for (var line of this.lines) {
      line.animate(t, null);
    }
  }
}

function fillGridArray(level, grid, gridNormals) {
  var gX = Math.floor(level.terrainSizeX / level.gridRes);
  var e  = gX * level.gridRes / 2;
  var s  = -e;
  // top right corner
  grid.push(e);
  grid.push(e);
  grid.push(level.gridZ);
  // top left corner
  grid.push(s);
  grid.push(e);
  grid.push(level.gridZ);
  // bottom left corner
  grid.push(s);
  grid.push(s);
  grid.push(level.gridZ);
  // bottom right corner
  grid.push(e);
  grid.push(s);
  grid.push(level.gridZ);
  for (var i = 0; i <= gX; i++) {
    // top line
    grid.push(s + i * level.gridRes);
    grid.push(e);
    grid.push(level.gridZ);
    // bottom line
    grid.push(s + i * level.gridRes);
    grid.push(s);
    grid.push(level.gridZ);
    // left line
    grid.push(s);
    grid.push(s + i * level.gridRes);
    grid.push(level.gridZ);
    // right line
    grid.push(e);
    grid.push(s + i * level.gridRes);
    grid.push(level.gridZ);
  }
  for (var i = 0; i < grid.length / 3; i++) {
    gridNormals.push(0);
    gridNormals.push(0);
    gridNormals.push(1);
  }
}

function applymod(level) {
  var nX = Math.floor(level.terrainSizeX / level.terrainRes);
  var nZ = Math.floor(level.terrainSizeZ / level.terrainRes);
  var nX1 = nX + 1;
  var nZ1 = nZ + 1;
  const d = vec3.create();
  for (var i = 0; i < nX1; i++) {
    for (var j = 0; j < nZ1; j++) {
      var v = level.terrain[i + j * nX1];
      var l;
      vec3.sub(d, v, level.mouse);
      l = vec3.length(d);
      if (l < MODAREA) {
        if (DM.modSubstract) {
          vec3.sub(v, v, vec3.fromValues(0, (MODAREA - l) * 0.01, 0));
        } else {
          vec3.add(v, v, vec3.fromValues(0, (MODAREA - l) * 0.01, 0));
        }
      }
    }
  }
}

function fillTerrainAndWaterColorArrays(level, t) {
  var colors;
  var preset = terrainPresets[level.skin];
  var nX = Math.floor(level.terrainSizeX / level.terrainRes);
  var nZ = Math.floor(level.terrainSizeZ / level.terrainRes);
  var nX1 = nX + 1;
  if (t) { // optimizable
    colors = Array.from(level.colors);
  } else {
    colors = level.colors.slice(0, 24 * nX * nZ);
    for (var i = 0; i < 4; i++) {
      colors.push(waterPreset.R.max);
      colors.push(waterPreset.G.max);
      colors.push(waterPreset.B.max);
      colors.push(0.8);
    }
  }
  if (level.mouse !== null) {
    for (var i = 0; i < nX; i++) {
      for (var j = 0; j < nZ; j++) {
        {
          {
            var v1 = level.terrain[i +     j      * nX1];
            var v2 = level.terrain[i +    (j + 1) * nX1];
            var v3 = level.terrain[i + 1 + j      * nX1];
            const l1 = vec3.create();
            const l2 = vec3.create();
            const l3 = vec3.create();
            vec3.sub(l1, v1, level.mouse);
            vec3.sub(l2, v2, level.mouse);
            vec3.sub(l3, v3, level.mouse);
            if (vec3.length(l1) < MODAREA &&
                vec3.length(l2) < MODAREA &&
                vec3.length(l3) < MODAREA) {
              for (var k = 0; k < 3; k++) {
                colors[(i * nZ + j) * 24 + 4 * k]     += preset.R.add;
                colors[(i * nZ + j) * 24 + 4 * k + 1] += preset.G.add;
                colors[(i * nZ + j) * 24 + 4 * k + 2] += preset.B.add;
              }
            }
          }
          {
            var v1 = level.terrain[i + 1 +  j      * nX1];
            var v2 = level.terrain[i +     (j + 1) * nX1];
            var v3 = level.terrain[i + 1 + (j + 1) * nX1];
            const l1 = vec3.create();
            const l2 = vec3.create();
            const l3 = vec3.create();
            vec3.sub(l1, v1, level.mouse);
            vec3.sub(l2, v2, level.mouse);
            vec3.sub(l3, v3, level.mouse);
            if (vec3.length(l1) < MODAREA &&
                vec3.length(l2) < MODAREA &&
                vec3.length(l3) < MODAREA) {
              for (var k = 0; k < 3; k++) {
                colors[(i * nZ + j) * 24 + 4 * k + 12] += preset.R.add;
                colors[(i * nZ + j) * 24 + 4 * k + 13] += preset.G.add;
                colors[(i * nZ + j) * 24 + 4 * k + 14] += preset.B.add;
              }
            }
          }
        }
      }
    }
  }
  return colors;
}

function appendGridColors(level, colors) {
  var gX = Math.floor(level.terrainSizeX / level.gridRes);
  for (var i = 0; i < 4; i++) {
    colors.push(0);
    colors.push(0);
    colors.push(0);
    colors.push(0.2);
  }
  for (var i = 0; i <= gX; i++) {
    if (i % Math.floor(1 / level.gridRes) == 0) {
      for (var j = 0; j < 4; j++) {
        colors.push(1);
        colors.push(1);
        colors.push(1);
        colors.push(1);
      }
    } else if (i % Math.floor(1 / level.gridSub) == 0) {
      for (var j = 0; j < 4; j++) {
        colors.push(0.8);
        colors.push(0.8);
        colors.push(0.8);
        colors.push(1);
      }
    } else {
      for (var j = 0; j < 4; j++) {
        colors.push(0.6);
        colors.push(0.6);
        colors.push(0.6);
        colors.push(1);
      }
    }
  }
}

function fillTerrainAndWaterIndices(level, t, indices, nVTriangles) {
  var nX = Math.floor(level.terrainSizeX / level.terrainRes);
  var nZ = Math.floor(level.terrainSizeZ / level.terrainRes);
  for (var i = 0; i < 6 * nX * nZ; i++) {
    indices.push(i);
  }
  var l = indices.length;
  if (t) {
    for (var i = l; i < l + 6 * nX * nZ; i++) {
      indices.push(i);
    }
    nVTriangles.count  = indices.length;
    nVTriangles.number = indices.length;
  } else {
    indices.push(l + 0);
    indices.push(l + 1);
    indices.push(l + 2);
    indices.push(l + 0);
    indices.push(l + 2);
    indices.push(l + 3);
    nVTriangles.count  = indices.length;
    nVTriangles.number = indices.length - 2;
  }
}

function appendAtmoIndices(level, indices, nVTriangles) {
  var len = level.atmosphere.indices.length;
  for (var i = 0; i < len; i++) {
    indices.push(nVTriangles.number + level.atmosphere.indices[i]);
  }
  nVTriangles.number += level.atmosphere.vertices.length;
  nVTriangles.count  += len;
}

function appendGridIndices(level, indices, nVLines, nVTriangles) {
  var gX = Math.floor(level.terrainSizeX / level.gridRes);
  var lt = nVTriangles.number;
  var ll = nVLines.number;
  indices.push(lt + 0);
  indices.push(lt + 1);
  indices.push(lt + 2);
  indices.push(lt + 0);
  indices.push(lt + 2);
  indices.push(lt + 3);
  lt += 4;
  nVTriangles.number = lt;
  nVTriangles.count = indices.length;
  nVLines.offset    = nVTriangles.count;
  for (var i = 0; i <= gX; i++) {
    indices.push(lt + ll++);
    indices.push(lt + ll++);
    indices.push(lt + ll++);
    indices.push(lt + ll++);
  }
  nVLines.count = ll;
}

function generateSphereBuffers(position, size, resolution, inverted, color, material) {
  const vertices  = [];
  const normals   = [];
  const materials = [];
  const colors    = [];
  const indices   = [];

  // Add top point
  vertices.push(position[0]);
  vertices.push(position[1] + size);
  vertices.push(position[2]);
  normals.push(0.0);
  normals.push(inverted ? -1.0 : 1.0);
  normals.push(0.0);
  materials.push(material);
  colors.push(color[0]);
  colors.push(color[1]);
  colors.push(color[2]);
  colors.push(color[3]);
  for (var i = 1; i < resolution / 2; i++) {
    for (var j = 0; j < resolution; j++) {
      // VERTEX
      var y   = Math.cos(Math.PI * i / (resolution / 2)) * size;
      var rxz = Math.sin(Math.PI * i / (resolution / 2)) * size;
      var x   = Math.cos(Math.PI * 2 * j / resolution) * rxz;
      var z   = Math.sin(Math.PI * 2 * j / resolution) * rxz;
      vertices.push(x + position[0]);
      vertices.push(y + position[1]);
      vertices.push(z + position[2]);
      // NORMAL
      const normal = vec3.fromValues(x, y, z);
      vec3.normalize(normal, normal);
      if (inverted) {
        normals.push(-normal[0]);
        normals.push(-normal[1]);
        normals.push(-normal[2]);
      } else {
        normals.push(normal[0]);
        normals.push(normal[1]);
        normals.push(normal[2]);
      }
      // MATERIAL
      materials.push(material);
      // COLOR
      colors.push(color[0]);
      colors.push(color[1]);
      colors.push(color[2]);
      colors.push(color[3]);
    }
  }
  // Add bottom point
  vertices.push(position[0]);
  vertices.push(position[1] - size);
  vertices.push(position[2]);
  normals.push(0.0);
  normals.push(inverted ? 1.0 : -1.0);
  normals.push(0.0);
  materials.push(material);
  colors.push(color[0]);
  colors.push(color[1]);
  colors.push(color[2]);
  colors.push(color[3]);
  // INDICES
  // top row
  if (inverted) {
    for (var i = 0; i < resolution; i++) {
      indices.push(0);
      indices.push( i                   + 1);
      indices.push((i + 1) % resolution + 1);
    }
    for (var i = 0; i < (resolution / 2) - 2; i++) {
      for (var j = 0; j < resolution; j++) {
        indices.push( j                   +  i      * resolution + 1);
        indices.push((j + 1) % resolution + (i + 1) * resolution + 1);
        indices.push((j + 1) % resolution +  i      * resolution + 1);
        indices.push( j                   +  i      * resolution + 1);
        indices.push( j                   + (i + 1) * resolution + 1);
        indices.push((j + 1) % resolution + (i + 1) * resolution + 1);
      }
    }
    // bottom row
    for (var i = 0; i < resolution; i++) {
      indices.push( i                   + (resolution / 2 - 2) * resolution + 1);
      indices.push(                       (resolution / 2 - 1) * resolution + 1);
      indices.push((i + 1) % resolution + (resolution / 2 - 2) * resolution + 1);
    }
  } else {
    for (var i = 0; i < resolution; i++) {
      indices.push(0);
      indices.push((i + 1) % resolution + 1);
      indices.push( i                   + 1);
    }
    for (var i = 0; i < (resolution / 2) - 2; i++) {
      for (var j = 0; j < resolution; j++) {
        indices.push( j                   +  i      * resolution + 1);
        indices.push((j + 1) % resolution +  i      * resolution + 1);
        indices.push((j + 1) % resolution + (i + 1) * resolution + 1);
        indices.push( j                   +  i      * resolution + 1);
        indices.push((j + 1) % resolution + (i + 1) * resolution + 1);
        indices.push( j                   + (i + 1) * resolution + 1);
      }
    }
    // bottom row
    for (var i = 0; i < resolution; i++) {
      indices.push( i                   + (resolution / 2 - 2) * resolution + 1);
      indices.push((i + 1) % resolution + (resolution / 2 - 2) * resolution + 1);
      indices.push(                       (resolution / 2 - 1) * resolution + 1);
    }
  }
  return {
    vertices:  vertices,
    normals:   normals,
    materials: materials,
    colors:    colors,
    indices:   indices
  }
}

// https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle
function sign (p1, p2, p3)
{
  return (p1[0] - p3[0]) * (p2[2] - p3[2]) - (p2[0] - p3[0]) * (p1[2] - p3[2]);
}

function intersect(plane0, plane1, plane2, mouseray) {
  const a0     = vec3.create();
  const a1     = vec3.create();
  const norm   = vec3.create();
  vec3.sub(a0, plane1, plane0);
  vec3.sub(a1, plane2, plane0);
  vec3.cross(norm, a0, a1);
  vec3.normalize(norm, norm);

  const t = vec3.create();
  vec3.sub(t, plane0, mouseray[0]);
  const s = vec3.dot(mouseray[1], norm);
  if (s == 0) return null;
  const d = vec3.dot(t, norm) / s;
  vec3.scale(t, mouseray[1], d);
  vec3.add(t, mouseray[0], t);

  var s1 = sign(t, plane0, plane1);
  var s2 = sign(t, plane1, plane2);
  var s3 = sign(t, plane2, plane0);

  var neg = (s1 < 0) || (s2 < 0) || (s3 < 0);
  var pos = (s1 > 0) || (s2 > 0) || (s3 > 0);

  if (!(neg && pos)) return t;
  return null;
}