/* Most of the code below is strongly inspired by (or straight out copied from):
 * https://developer.mozilla.org/fr/docs/Web/API/WebGL_API/Tutorial/Commencer_avec_WebGL
 */
// Vertex shader
const shadowVertexSRC = `
  attribute vec4 aVertexPosition;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  }
`;

const finalVertexSRC = `
  attribute vec4  aVertexPosition;
  attribute vec4  aVertexColor;
  attribute vec3  aVertexNormal;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat4 uNormalMatrix;
  uniform bool uIsLit;
  uniform vec3 uSunLocation;
  uniform mat4 uShadowTransform;

  varying lowp  vec4 vColor;
  varying highp vec3 vLighting;
  varying highp vec3 vShadowCoord;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;

    if (uIsLit) {
      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(uSunLocation);

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting    = ambientLight + (directionalLightColor * directional);
      vShadowCoord = (uShadowTransform * aVertexPosition).xyz;
    } else {
      vLighting    = vec3(1.0, 1.0, 1.0);
      vShadowCoord = vec3(-1, 0, 0);
    }
  }
`;

// #include "Common.cg"    
// vertout main(float4 gl_Vertex : POSITION,    
//              uniform float4x4 gl_ModelViewProjectionMatrix,
//              uniform float3 v3CameraPos,     // The camera's current position
//              uniform float3 v3LightDir,      // Direction vector to the light source    
//              uniform float3 v3InvWavelength, // 1 / pow(wavelength, 4) for RGB    
//              uniform float fCameraHeight,    // The camera's current height
//              uniform float fCameraHeight2,   // fCameraHeight^2
//              uniform float fOuterRadius,     // The outer (atmosphere) radius
//              uniform float fOuterRadius2,    // fOuterRadius^2
//              uniform float fInnerRadius,     // The inner (planetary) radius
//              uniform float fInnerRadius2,    // fInnerRadius^2
//              uniform float fKrESun,          // Kr * ESun      
//              uniform float fKmESun,          // Km * ESun
//              uniform float fKr4PI,           // Kr * 4 * PI
//              uniform float fKm4PI,           // Km * 4 * PI
//              uniform float fScale,           // 1 / (fOuterRadius - fInnerRadius)
//              uniform float fScaleOverScaleDepth) // fScale / fScaleDepth  {    
//   // Get the ray from the camera to the vertex and its length (which    
//   // is the far point of the ray passing through the atmosphere)      
//   float3 v3Pos = gl_Vertex.xyz;
//   float3 v3Ray = v3Pos - v3CameraPos;
//   float fFar = length(v3Ray);
//   v3Ray /= fFar;
//   // Calculate the closest intersection of the ray with
//   // the outer atmosphere (point A in Figure 16-3)      
//   float fNear = getNearIntersection(v3CameraPos, v3Ray, fCameraHeight2, fOuterRadius2);
//   // Calculate the ray's start and end positions in the atmosphere,
//   // then calculate its scattering offset
//   float3 v3Start = v3CameraPos + v3Ray * fNear;
//   fFar -= fNear;
//   float fStartAngle = dot(v3Ray, v3Start) / fOuterRadius;
//   float fStartDepth = exp(-fInvScaleDepth);
//   float fStartOffset = fStartDepth * scale(fStartAngle);
//   // Initialize the scattering loop variables      
//   float fSampleLength = fFar / fSamples;    
//   float fScaledLength = fSampleLength * fScale;
//   float3 v3SampleRay = v3Ray * fSampleLength;
//   float3 v3SamplePoint = v3Start + v3SampleRay * 0.5;
//   Now loop through the sample points
//   float3 v3FrontColor = float3(0.0, 0.0, 0.0);
//   for(int i=0; i<nSamples; i++) { 
//     float fHeight = length(v3SamplePoint);
//     float fDepth = exp(fScaleOverScaleDepth * (fInnerRadius - fHeight));
//     float fLightAngle = dot(v3LightDir, v3SamplePoint) / fHeight;
//     float fCameraAngle = dot(v3Ray, v3SamplePoint) / fHeight;
//     float fScatter = (fStartOffset + fDepth * (scale(fLightAngle) - scale(fCameraAngle)));      
//     float3 v3Attenuate = exp(-fScatter * (v3InvWavelength * fKr4PI + fKm4PI));
//     v3FrontColor += v3Attenuate * (fDepth * fScaledLength);
//     v3SamplePoint += v3SampleRay;
//   }
//   // Finally, scale the Mie and Rayleigh colors
//   vertout OUT;
//   OUT.pos = mul(gl_ModelViewProjectionMatrix, gl_Vertex);
//   OUT.c0.rgb = v3FrontColor * (v3InvWavelength * fKrESun);
//   OUT.c1.rgb = v3FrontColor * fKmESun;
//   OUT.t0 = v3CameraPos - v3Pos;    
//   return OUT;
// }

// Fragment shader
const shadowFragmentSRC = `
  mediump float fragmentDepth;
  void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, gl_FragCoord.z);
  }
`;

const finalFragmentSRC = `
  uniform sampler2D uShadowMap;

  varying lowp  vec4 vColor;
  varying highp vec3 vLighting;
  varying highp vec3 vShadowCoord;

  void main(void) {
    lowp float vis = 1.0;
    if (vShadowCoord.x >= 0.0 && texture2D(uShadowMap, vShadowCoord.xy).z < vShadowCoord.z) {
        vis = 0.0;
    }
    gl_FragColor = vec4(vColor.rgb * vLighting, vColor.a);
  }
`;

// #include "Common.cg"
// float4 main(float4 c0 : COLOR0,
//             float4 c1 : COLOR1,    
//             float3 v3Direction : TEXCOORD0,
//             uniform float3 v3LightDirection,
//             uniform float g,
//             uniform float g2) : COLOR {
//   float fCos = dot(v3LightDirection, v3Direction) / length(v3Direction);
//   float fCos2 = fCos * fCos;
//   float4 color = getRayleighPhase(fCos2) * c0 + getMiePhase(fCos, fCos2, g, g2) * c1;
//   color.a = color.b;
//   return color;  
// }
const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const vec4 = glMatrix.vec4;

const MODAREA = 2.0;
const SHADOW_TEXTURE_SIZE = 1024;
const terrainPresets = [{ 
  R: { min: 0,   max: 0.1, add: 0.8 }, 
  G: { min: 0.3, max: 0.7, add: 0.3 },
  B: { min: 0,   max: 0.2, add: 0   } 
}];
const waterPreset = {
  R: { min: 0,     max: 0.0 }, 
  G: { min: 0,     max: 0.2 },
  B: { min: 0.6,   max: 0.8 } 
}

class Display {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.setAttribute("height", window.innerHeight + "px");
    canvas.setAttribute("width",  window.innerWidth - 250  + "px");
    
    const gl = canvas.getContext("webgl");
    if (!gl) {
      alert("Impossible d'initialiser WebGL. Votre navigateur ou votre machine peut ne pas le supporter.");
      return;
    }
    const ext1 = gl.getExtension('OES_element_index_uint');
    const ext2 = gl.getExtension('WEBGL_depth_texture');
    if (!ext1) {
      return alert("Missing extension: OES_element_index_uint");
    }
    if (!ext2) {
      return alert("Missing extension: WEBGL_depth_texture");
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
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  
    const shadowShaderProgram = initShaderProgram(gl, shadowVertexSRC, shadowFragmentSRC);
    const shaderProgram       = initShaderProgram(gl, finalVertexSRC, finalFragmentSRC);
    this.programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition:   gl.getAttribLocation(shaderProgram,  'aVertexPosition'),
        vertexColor:      gl.getAttribLocation(shaderProgram,  'aVertexColor'),
        vertexNormal:     gl.getAttribLocation(shaderProgram,  'aVertexNormal')
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix:  gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        normalMatrix:     gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
        isLit:            gl.getUniformLocation(shaderProgram, 'uIsLit'),
        sunLocation:      gl.getUniformLocation(shaderProgram, 'uSunLocation'),
        shadowTransform:  gl.getUniformLocation(shaderProgram, 'uShadowTransform'),
        shadowMap:        gl.getUniformLocation(shaderProgram, 'uShadowMap')
      }
    };
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
    this.gl = gl;
    this.buffers = null;
    this.initFrameBuffer();
    DM.stateVariables.rotation.actual    = vec3.fromValues(Math.PI / 20, 0, 0);
    DM.stateVariables.translation.actual = vec3.fromValues(0, 0, -6);
    DM.stateVariables.sunPosition.actual = vec3.fromValues(0, 1, 0);
    DM.stateVariables.isLit.actual = true;
  }

  initFrameBuffer() {
    const width  = SHADOW_TEXTURE_SIZE;
    const height = SHADOW_TEXTURE_SIZE;
    const gl     = this.gl;
    var color_buffer, depth_buffer, status;
  
    // Step 1: Create a frame buffer object
    this.frameBuffer = gl.createFramebuffer();
  
    // Step 2: Create and initialize a texture buffer to hold the colors.
    color_buffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, color_buffer);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
                                    gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
    // Step 3: Create and initialize a texture buffer to hold the depth values.
    // Note: the WEBGL_depth_texture extension is required for this to work
    //       and for the gl.DEPTH_COMPONENT texture format to be supported.
    depth_buffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depth_buffer);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0,
                                    gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
    // Step 4: Attach the specific buffers to the frame buffer.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color_buffer, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.TEXTURE_2D, depth_buffer, 0);
  
    // Step 5: Verify that the frame buffer is valid.
    status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.log("The created frame buffer is invalid: " + status.toString());
    }
    this.depthBuffer = depth_buffer;
  
    // Unbind these new objects, which makes the default frame buffer the
    // target for rendering.
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  drawShadows() {
    const gl = this.gl;
    const frameBuffer = this.frameBuffer;
    const programInfo       = this.programInfo;
    const shadowProgramInfo = this.shadowProgramInfo;
    const buffers = this.buffers;
    if (buffers === null) return;
    //gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    //gl.viewport(0, 0, SHADOW_TEXTURE_SIZE, SHADOW_TEXTURE_SIZE);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.clearDepth(1.0);
    gl.depthFunc(gl.LEQUAL);
  
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    const zNear = 0.1;
    const zFar  = 100.0;
    const top    =  5;
    const bottom = -5;
    const left   = -5;
    const right  =  5;
    const projectionMatrix = mat4.create();
    mat4.ortho(projectionMatrix,
               left,
               right,
               bottom,
               top,
               zNear,
               zFar);
  
    const lightSource = vec3.create();
    vec3.scale(lightSource, DM.stateVariables.sunPosition.actual, 10);
    const modelViewMatrix = mat4.create();
    mat4.lookAt(modelViewMatrix, 
                lightSource,
                vec3.fromValues(0, 0, 0),
                vec3.fromValues(0, 1, 0));
  
    const shadowTransform = mat4.fromValues(0.5, 0.0, 0.0, 0.5,
                                            0.0, 0.5, 0.0, 0.5,
                                            0.0, 0.0, 0.5, 0.5,
                                            0.0, 0.0, 0.0, 1.0);
    mat4.mul(shadowTransform, shadowTransform, projectionMatrix);
    mat4.mul(shadowTransform, shadowTransform, modelViewMatrix);
    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.shadowTransform,
        false,
        shadowTransform);
  
    { // VERTICES
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
  
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
      gl.vertexAttribPointer(
          shadowProgramInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          shadowProgramInfo.attribLocations.vertexPosition);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  
    gl.useProgram(shadowProgramInfo.program);
    gl.uniformMatrix4fv(
        shadowProgramInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        shadowProgramInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);
  
    {
      const vertexCount = buffers.nVTriangles.count;
      const type = gl.UNSIGNED_INT;
      const offset = 4 * buffers.nVTriangles.offset;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }

  drawScene() {
    const gl = this.gl;
    const programInfo = this.programInfo;
    const buffers = this.buffers;
    const rotation = DM.stateVariables.rotation.actual;
    const translation = DM.stateVariables.translation.actual;
    if (buffers === null) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.depthFunc(gl.LEQUAL);
  
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    const fieldOfView = 45 * Math.PI / 180;   // en radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar  = 100.0;
    const top = -gl.canvas.clientHeight / 200;
    const bottom = gl.canvas.clientHeight / 200;
    const left = -gl.canvas.clientWidth / 200;
    const right = gl.canvas.clientWidth / 200;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix,
                     fieldOfView,
                     aspect,
                     zNear,
                     zFar);
    // mat4.ortho(projectionMatrix,
    //            left,
    //            right,
    //            bottom,
    //            top,
    //            zNear,
    //            zFar);
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
  
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
  
    { // VERTICES
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
  
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
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
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colors);
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
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
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
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  
    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.normalMatrix,
        false,
        normalMatrix);
    gl.uniform1i(programInfo.uniformLocations.isLit, DM.stateVariables.isLit.actual);
    gl.uniform3fv(programInfo.uniformLocations.sunLocation, DM.stateVariables.sunPosition.actual);
    gl.uniform1i(programInfo.shadowMap, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.depthBuffer);
  
    { // Draw lines first
      const vertexCount = buffers.nVLines.count;
      const type = gl.UNSIGNED_INT;
      const offset = 4 * buffers.nVLines.offset;
      gl.drawElements(gl.LINES, vertexCount, type, offset);
    }
    {
      const vertexCount = buffers.nVTriangles.count;
      const type = gl.UNSIGNED_INT;
      const offset = 4 * buffers.nVTriangles.offset;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }

  rotate(e) {
    if (DM.previousCoords !== null) {
      vec3.sub(DM.previousCoords, vec3.fromValues(e.clientY, e.clientX, 0), DM.previousCoords);
      vec3.scale(DM.previousCoords, DM.previousCoords, 0.01);
      vec3.add(DM.previousCoords, DM.stateVariables.rotation.actual, DM.previousCoords);
      DM.stateVariables.rotation.actual = DM.previousCoords;
      if (DM.previousCoords[0] >  Math.PI / 2)  DM.previousCoords[0] =  Math.PI / 2;
      if (DM.previousCoords[0] <  Math.PI / 20) DM.previousCoords[0] =  Math.PI / 20;
      if (DM.previousCoords[1] >  Math.PI / 2)  DM.previousCoords[1] =  Math.PI / 2;
      if (DM.previousCoords[1] < -Math.PI / 2)  DM.previousCoords[1] = -Math.PI / 2;
      DM.stateVariables.rotation.actual = DM.previousCoords;
    }
    DM.previousCoords = vec3.fromValues(e.clientY, e.clientX, 0);
  }
  
  mod(e) {
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
      DM.stateVariables.mouseRay.actual = null;
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
  
    DM.stateVariables.mouseRay.actual = [ pos0, mRay ];
  }

  updateBuffers(t) {
    const gl       = this.gl;
    const level    = DM.stateVariables.level.actual;
    const mouseray = DM.stateVariables.mouseRay.actual;
    level.mouse = null;
  
    // VERTICES
    ///////////////////////////////////////////////////////////////////////////////
    var terrain = [];
    var terrainNormals = [];
    var water = [];
    var waterNormals = [];
    var grid = [];
    var gridNormals = [];
  
    if (DM.stateVariables.gridHD.actual) level.gridRes = level.gridSub / 2;
    else                                 level.gridRes = level.gridSub;
    fillTerrainAndWaterArrays(level, mouseray, t, terrain, terrainNormals, water, waterNormals);
    if (DM.stateVariables.gridOn.actual) fillGridArray(level, grid, gridNormals);
  
  
    const vertices = terrain.concat(water).concat(grid);
    const normals  = terrainNormals.concat(waterNormals).concat(gridNormals);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  
    if (level.mouse !== null && DM.modApply) {
      applymod(level);
    }
  
    // COLORS
    ///////////////////////////////////////////////////////////////////////////////
    var colors;
  
    if (level.colors === null) {
      setTerrainAndWaterColors(level);
    }
    
    colors = fillTerrainAndWaterColorArrays(level, t);
    if (DM.stateVariables.gridOn.actual) appendGridColors(level, colors);
  
  
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  
    // INDICES
    ///////////////////////////////////////////////////////////////////////////////
    var indices = [];
    var nVTriangles = { count: 0, offset: 0, number: 0 };
    var nVLines = { count: 0, offset: 0, number: 0 };
  
    fillTerrainAndWaterIndices(level, t, indices, nVTriangles);
    if (DM.stateVariables.gridOn.actual) appendGridIndices(level, indices, nVLines, nVTriangles);
  
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
  
  
    ///////////////////////////////////////////////////////////////////////////////
    this.buffers = {
      vertices:       vertexBuffer,
      normals:        normalBuffer,
      colors:         colorBuffer,
      indices:        indexBuffer,
      nVTriangles:    nVTriangles,
      nVLines:        nVLines
    };
  
    DM.maxTranslation = level.terrainSizeX / 2;
    DM.maxZoom        = -2 * level.terrainSizeZ;
    DM.modEnabled     = true;
  }
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader   = loadShader(gl, gl.VERTEX_SHADER,   vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Impossible to init shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function fillTerrainAndWaterArrays(level, mouseray, t, terrain, terrainNormals, water, waterNormals) {
  var nX = Math.floor(level.terrainSizeX / level.terrainRes);
  var nZ = Math.floor(level.terrainSizeZ / level.terrainRes);
  var nX1 = nX + 1;
  var freq = 1.5;
  var amp  = 0.05;
  for (var i = 0; i < nX; i++) {
    for (var j = 0; j < nZ; j++) {
      /////////////////////////////////////////////////
      {
        var v1 = level.terrain[i +     j      * nX1];
        var v2 = level.terrain[i +    (j + 1) * nX1];
        var v3 = level.terrain[i + 1 + j      * nX1];
        // top left
        terrain.push(v1[0]);
        terrain.push(v1[1]);
        terrain.push(v1[2]);
        // bottom left
        terrain.push(v2[0]);
        terrain.push(v2[1]);
        terrain.push(v2[2]);
        // top right
        terrain.push(v3[0]);
        terrain.push(v3[1]);
        terrain.push(v3[2]);
        // intersection
        if (mouseray !== null) {
          var p = intersect(v1, v2, v3, mouseray);
          if (p !== null) {
            level.mouse = p;
          }
        }
        // normal
        const a1 = vec3.create();
        const a2 = vec3.create();
        const norm = vec3.create();
        vec3.sub(a1, v2, v1);
        vec3.sub(a2, v3, v1);
        vec3.cross(norm, a1, a2);
        vec3.normalize(norm, norm);
        for (var k = 0; k < 3; k++) {
          terrainNormals.push(norm[0]);
          terrainNormals.push(norm[1]);
          terrainNormals.push(norm[2]);
        }
        // water
        if (t) {
          var y1 = level.waterLevel + Math.sin(t / (Math.PI / 2) * freq + (i +     j      * nX1)) * amp;
          var y2 = level.waterLevel + Math.sin(t / (Math.PI / 2) * freq + (i +    (j + 1) * nX1)) * amp;
          var y3 = level.waterLevel + Math.sin(t / (Math.PI / 2) * freq + (i + 1 + j      * nX1)) * amp;
          var u1 = vec3.fromValues(v1[0], y1, v1[2]);
          var u2 = vec3.fromValues(v2[0], y2, v2[2]);
          var u3 = vec3.fromValues(v3[0], y3, v3[2]);
          water.push(u1[0]);
          water.push(u1[1]);
          water.push(u1[2]);
          water.push(u2[0]);
          water.push(u2[1]);
          water.push(u2[2]);
          water.push(u3[0]);
          water.push(u3[1]);
          water.push(u3[2]);
          vec3.sub(a1, u2, u1);
          vec3.sub(a2, u3, u1);
          vec3.cross(norm, a1, a2);
          vec3.normalize(norm, norm);
          for (var k = 0; k < 3; k++) {
            waterNormals.push(norm[0]);
            waterNormals.push(norm[1]);
            waterNormals.push(norm[2]);
          }
        }
      }
      /////////////////////////////////////////////////
      {
        var v1 = level.terrain[i + 1 +  j      * nX1];
        var v2 = level.terrain[i +     (j + 1) * nX1];
        var v3 = level.terrain[i + 1 + (j + 1) * nX1];
        // top left
        terrain.push(v1[0]);
        terrain.push(v1[1]);
        terrain.push(v1[2]);
        // bottom left
        terrain.push(v2[0]);
        terrain.push(v2[1]);
        terrain.push(v2[2]);
        // top right
        terrain.push(v3[0]);
        terrain.push(v3[1]);
        terrain.push(v3[2]);
        // intersection
        if (mouseray !== null) {
          var p = intersect(v1, v2, v3, mouseray);
          if (p !== null) {
            level.mouse = p;
          }
        }
        // normal
        const a1 = vec3.create();
        const a2 = vec3.create();
        const norm = vec3.create();
        vec3.sub(a1, v2, v1);
        vec3.sub(a2, v3, v1);
        vec3.cross(norm, a1, a2);
        vec3.normalize(norm, norm);
        for (var k = 0; k < 3; k++) {
          terrainNormals.push(norm[0]);
          terrainNormals.push(norm[1]);
          terrainNormals.push(norm[2]);
        }
        // water
        if (t) {
          var y1 = level.waterLevel + Math.sin(t / (Math.PI / 2) * freq + (i + 1 +  j      * nX1)) * amp;
          var y2 = level.waterLevel + Math.sin(t / (Math.PI / 2) * freq + (i +     (j + 1) * nX1)) * amp;
          var y3 = level.waterLevel + Math.sin(t / (Math.PI / 2) * freq + (i + 1 + (j + 1) * nX1)) * amp;
          var u1 = vec3.fromValues(v1[0], y1, v1[2]);
          var u2 = vec3.fromValues(v2[0], y2, v2[2]);
          var u3 = vec3.fromValues(v3[0], y3, v3[2]);
          water.push(u1[0]);
          water.push(u1[1]);
          water.push(u1[2]);
          water.push(u2[0]);
          water.push(u2[1]);
          water.push(u2[2]);
          water.push(u3[0]);
          water.push(u3[1]);
          water.push(u3[2]);
          vec3.sub(a1, u2, u1);
          vec3.sub(a2, u3, u1);
          vec3.cross(norm, a1, a2);
          vec3.normalize(norm, norm);
          for (var k = 0; k < 3; k++) {
            waterNormals.push(norm[0]);
            waterNormals.push(norm[1]);
            waterNormals.push(norm[2]);
          }
        }
      }
    }
  }
  if (t === null) {
    var tl = level.terrain[0];
    var tr = level.terrain[nX];
    var bl = level.terrain[nZ * nX1];
    var br = level.terrain[nX + nZ * nX1];
    water.push(tr[0]);
    water.push(level.waterLevel);
    water.push(tr[2]);
    water.push(tl[0]);
    water.push(level.waterLevel);
    water.push(tl[2]);
    water.push(bl[0]);
    water.push(level.waterLevel);
    water.push(bl[2]);
    water.push(br[0]);
    water.push(level.waterLevel);
    water.push(br[2]);
    for (var i = 0; i < 4; i++) {
      waterNormals.push(0);
      waterNormals.push(1);
      waterNormals.push(0);
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

function setTerrainAndWaterColors(level) {
  var preset = terrainPresets[level.skin];
  var nX = Math.floor(level.terrainSizeX / level.terrainRes);
  var nZ = Math.floor(level.terrainSizeZ / level.terrainRes);
  level.colors = [];
  for (var i = 0; i < 2 * nX * nZ; i++) {
    var R = Math.random() * (preset.R.max - preset.R.min) + preset.R.min;
    var G = Math.random() * (preset.G.max - preset.G.min) + preset.G.min;
    var B = Math.random() * (preset.B.max - preset.B.min) + preset.B.min;
    for (var j = 0; j < 3; j++) {
      level.colors.push(R);
      level.colors.push(G);
      level.colors.push(B);
      level.colors.push(1.0);
    }
  }
  for (var i = 0; i < 2 * nX * nZ; i++) {
    var R = Math.random() * (waterPreset.R.max - waterPreset.R.min) + waterPreset.R.min;
    var G = Math.random() * (waterPreset.G.max - waterPreset.G.min) + waterPreset.G.min;
    var B = Math.random() * (waterPreset.B.max - waterPreset.B.min) + waterPreset.B.min;
    for (var j = 0; j < 3; j++) {
      level.colors.push(R);
      level.colors.push(G);
      level.colors.push(B);
      level.colors.push(0.8);
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