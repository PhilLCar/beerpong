/* Most of the code below is strongly inspired by (or straight out copied from):
 * https://developer.mozilla.org/fr/docs/Web/API/WebGL_API/Tutorial/Commencer_avec_WebGL
 */
// Vertex shader
const shadowVertexSRC = `#version 300 es
  layout (location = 0) in vec4 aVertexPosition;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  }
`;

const sceneVertexSRC = `#version 300 es
  layout (location = 0) in vec4      aVertexPosition;
  layout (location = 1) in vec4      aVertexColor;
  layout (location = 2) in vec3      aVertexNormal;
  layout (location = 3) in lowp uint aVertexMaterial;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform bool uIsLit;
  uniform vec3 uSunLocation;
  uniform mat4 uShadowTransform;
  uniform mat3 uNormalTransform;

  out highp vec3  vPosition;
  out highp vec3  vNormal;
  out lowp  vec4  vColor;
  out lowp  vec3  vLightColor;
  out highp vec3  vLightDir;
  out highp vec3  vDiffuse;
  out highp vec3  vShadowCoord;
  out highp float vAmbiant;
  out highp vec2  vSpecularSoft;
  out highp vec2  vSpecularHard;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vPosition = (uModelViewMatrix * aVertexPosition).xyz;
    vNormal   = normalize(uNormalTransform * aVertexNormal);
    vColor    = aVertexColor;

    switch (aVertexMaterial) {
      case uint(0):
        vSpecularSoft     = vec2(0.4, 64.0);
        vSpecularHard     = vec2(0.0, 32.0);
        break;
      case uint(1):
        vSpecularSoft     = vec2(0.5,  256.0);
        vSpecularHard     = vec2(8.0, 4096.0);
        break;
      default:
        vSpecularSoft     = vec2(0.5, 32.0);
        vSpecularHard     = vec2(0.0, 32.0);
        break;
    }

    if (uIsLit) {
      highp vec3 normalizedSunLocation = normalize(uSunLocation);
      vLightColor  = vec3(1.0, 0.4 + 0.6 * normalizedSunLocation.y, normalizedSunLocation.y);
      vLightDir    = normalize(uNormalTransform * uSunLocation);
      vAmbiant     = 0.05 + 0.2 * normalizedSunLocation.y;
      vDiffuse     = vLightColor * clamp(dot(aVertexNormal, normalizedSunLocation), 0.0, 1.0);
      vShadowCoord = (uShadowTransform * aVertexPosition).xyz;
    } else {
      vLightColor  = vec3(1.0, 1.0, 1.0);
      vLightDir    = vec3(0.0, 0.0, 0.0);
      vAmbiant     = 0.0;
      vDiffuse     = vec3(1.0, 1.0, 1.0);
      vShadowCoord = vec3(-1.0, 0.0, 0.0);
    }
  }
`;

const hdrVertexSRC=`#version 300 es
  layout (location = 4) in vec4 aVertexPosition;

  void main(void) {
    gl_Position = aVertexPosition;
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
const shadowFragmentSRC = `#version 300 es
  void main(void) { }
`;

const sceneFragmentSRC = `#version 300 es
  precision highp float;
  
  uniform sampler2D uShadowMap;

  in highp vec3  vPosition;
  in highp vec3  vNormal;
  in lowp  vec4  vColor;
  in lowp  vec3  vLightColor;
  in highp vec3  vLightDir;
  in highp vec3  vDiffuse;
  in highp vec3  vShadowCoord;
  in highp float vAmbiant;
  in highp vec2  vSpecularSoft;
  in highp vec2  vSpecularHard;

  out highp vec4 FragColor;

  /// PCSS ///
  // http://developer.download.nvidia.com/whitepapers/2008/PCSS_Integration.pdf
  uniform mediump int   BLOCKER_SEARCH_NUM_SAMPLES;
  uniform mediump int   PCF_NUM_SAMPLES;
  uniform mediump float NEAR_PLANE;
  uniform mediump float LIGHT_SIZE_UV;
  uniform highp   vec2  POISSON_DISKS[16];

  float penumbraSize(float zReceiver, float zBlocker) {
    return (zReceiver - zBlocker) / zBlocker;
  }

  void findBlocker(out float avgBlockerDepth, out float numBlockers, vec2 uv, float zReceiver) {
    float searchWidth = LIGHT_SIZE_UV * (zReceiver - NEAR_PLANE) / zReceiver;
    float blockerSum = 0.0;
    numBlockers = 0.0;
    for (int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; ++i) {
      //float depth = texture(uShadowMap, uv + POISSON_DISKS[i] * searchWidth).x;
      float depth = texture(uShadowMap, uv).x;
      if (depth < zReceiver) {
        blockerSum += depth;
        ++numBlockers;
      }
    }
    avgBlockerDepth = blockerSum / numBlockers;
  }

  float PCF_Filter(vec2 uv, float zReceiver, float filterRadiusUV) {
    float sum = 0.0;
    for (int i = 0; i < PCF_NUM_SAMPLES; ++i) {
      vec2 offset = POISSON_DISKS[i] * filterRadiusUV;
      sum += texture(uShadowMap, uv + offset).x < zReceiver ? 0.0 : 1.0;
    }
    return sum / float(PCF_NUM_SAMPLES);
  }

  float PCSS(vec3 coords) {
    vec2  uv        = coords.xy;
    float zReceiver = coords.z;
    float avgBlockerDepth = 0.0;
    float numBlockers     = 0.0;
    findBlocker(avgBlockerDepth, numBlockers, uv, zReceiver);
    if (numBlockers < 1.0) return 1.0;
    float penumbraRatio  = penumbraSize(zReceiver, avgBlockerDepth);
    float filterRadiusUV = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / coords.z;
    return PCF_Filter(uv, zReceiver, filterRadiusUV);
  }

  void main(void) {
    highp vec3 lighting  = vec3(1.0, 1.0, 1.0);
    highp vec3 highlight = vec3(0.0, 0.0, 0.0);
    if (vShadowCoord.x >= 0.0) {
      highp float vis        = PCSS(vShadowCoord);
      highp vec3  viewDir    = normalize(-vPosition);
      highp vec3  reflectDir = reflect(-vLightDir, vNormal);
      highp float anglef     = max(dot(viewDir, reflectDir), 0.0);
      highp float soft       = pow(anglef, vSpecularSoft.y);
      highp float hard       = pow(anglef, vSpecularHard.y);
      highlight = vis * ((vSpecularSoft.x * soft) + (vSpecularHard.x * hard))  * vLightColor;
      lighting  = vAmbiant + (1.0 - vAmbiant) * vis * vDiffuse;
    }
    FragColor = vec4(vColor.rgb * lighting + highlight, vColor.a);
  }
`;

const hdrFragmentSRC =`#version 300 es
  precision highp float;

  uniform sampler2D      uSceneMap;
  uniform highp     vec2 uViewport;

  out lowp vec4 FragColor;

  // LIGHT BLEED ALGORITHM
  uniform lowp    int   BLEED_NUM_SAMPLES;
  uniform highp   float BLEED_RADIUS;
  uniform highp   vec2  POISSON_DISKS[16];

  vec3 lightBleed(vec2 coord) {
    highp vec3  color = texture(uSceneMap, coord).rgb;
    highp vec3  sum   = vec3(0.0, 0.0, 0.0);
    if (length(color) >= 1.0) return color;
    for (lowp int i = 0; i < BLEED_NUM_SAMPLES; ++i) {
      sum += max(texture(uSceneMap, coord + POISSON_DISKS[i] * BLEED_RADIUS).rgb,
                 vec3(1.0, 1.0, 1.0)) - vec3(1.0, 1.0, 1.0);
    }
    return color + sum / float(BLEED_NUM_SAMPLES);
  }

  void main(void) {
    FragColor = vec4(lightBleed(gl_FragCoord.xy / uViewport), 1.0);
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

const viewportCoords = new Float32Array([
   1.0,  1.0, 0.0,
  -1.0,  1.0, 0.0,
  -1.0, -1.0, 0.0,
   1.0, -1.0, 0.0
]);
const viewportIndices = new Uint32Array([
  0, 1, 2, 0, 2, 3
])

const mat3 = glMatrix.mat3;
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

const MATERIAL_GROUND = 0;
const MATERIAL_WATER  = 1;
const MATERIAL_GRID   = 2;

class Display {
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
        projectionMatrix:  gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix:   gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        isLit:             gl.getUniformLocation(shaderProgram, 'uIsLit'),
        sunLocation:       gl.getUniformLocation(shaderProgram, 'uSunLocation'),
        shadowTransform:   gl.getUniformLocation(shaderProgram, 'uShadowTransform'),
        normalTransform:   gl.getUniformLocation(shaderProgram, 'uNormalTransform'),
        shadowMap:         gl.getUniformLocation(shaderProgram, 'uShadowMap'),
        blkSrchNumSamples: gl.getUniformLocation(shaderProgram, 'BLOCKER_SEARCH_NUM_SAMPLES'),
        pcfNumSamples:     gl.getUniformLocation(shaderProgram, 'PCF_NUM_SAMPLES'),
        nearPlane:         gl.getUniformLocation(shaderProgram, 'NEAR_PLANE'),
        lightSizeUV:       gl.getUniformLocation(shaderProgram, 'LIGHT_SIZE_UV'),
        poissonDisks:      gl.getUniformLocation(shaderProgram, 'POISSON_DISKS'),
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
        bleedNumSamples:  gl.getUniformLocation(hdrProgram, 'BLEED_NUM_SAMPLES'),
        bleedRadius:      gl.getUniformLocation(hdrProgram, 'BLEED_RADIUS'),
        poissonDisks:     gl.getUniformLocation(hdrProgram, 'POISSON_DISKS')
      },
    }
    this.gl = gl;
    this.buffers = null;
    this.initFrameBuffers();
    DM.stateVariables.rotation.actual    = vec3.fromValues(Math.PI / 20, 0, 0);
    DM.stateVariables.translation.actual = vec3.fromValues(0, 0, -6);
    DM.stateVariables.sunPosition.actual = vec3.fromValues(0, 1, 0);
    DM.stateVariables.isLit.actual = true;
    ////////////////////////////////////////////////////////////////////////
    // INITIALIZE PCSS CONSTANTS
    gl.useProgram(shaderProgram);
    gl.uniform1i(this.programInfo.uniformLocations.blkSrchNumSamples,   16);
    gl.uniform1i(this.programInfo.uniformLocations.pcfNumSamples,       16);
    gl.uniform1f(this.programInfo.uniformLocations.nearPlane,          0.1);
    // 0.5: LIGHT_WORLD_SIZE; 3.75: LIGHT_FRUSTUM_SIZE;
    gl.uniform1f(this.programInfo.uniformLocations.lightSizeUV,       0.25);
    gl.uniform2fv(this.programInfo.uniformLocations.poissonDisks, POISSON_DISKS);
    ////////////////////////////////////////////////////////////////////////
    // INITIALIZE BLEED CONSTANTS
    gl.useProgram(hdrProgram);
    gl.uniform1i(this.hdrProgramInfo.uniformLocations.bleedNumSamples,     16);
    gl.uniform1f(this.hdrProgramInfo.uniformLocations.bleedRadius,       0.01);
    gl.uniform2fv(this.hdrProgramInfo.uniformLocations.poissonDisks, POISSON_DISKS);

    DM.atmosphere = new Atmosphere(gl);
  }

  initFrameBuffers() {
    const gl = this.gl;
    var status;

    /// DEPTH BUFFER ///
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
      console.log("The created frame buffer is invalid: " + status.toString());
    }
    this.depthFrameBuffer = depth_frame_buffer;
    this.depthBuffer      = depth_buffer;

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
      this.frameBuffer = null;
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
      this.frameBuffer = null;
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
    const gl = this.gl;
    const programInfo       = this.programInfo;
    const shadowProgramInfo = this.shadowProgramInfo;
    const level = DM.stateVariables.level.actual;
    const buffers = this.buffers;
    if (buffers === null) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer);
    gl.viewport(0, 0, SHADOW_TEXTURE_SIZE, SHADOW_TEXTURE_SIZE);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.clearDepth(1.0);
    gl.depthFunc(gl.LEQUAL);

    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.cullFace(gl.FRONT);

    const size = Math.sqrt(level.terrainSizeX * level.terrainSizeX + level.terrainSizeZ * level.terrainSizeZ) / 2;
    const zNear = 0.1;
    const zFar  = 100.0;
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
    vec3.scale(lightSource, DM.stateVariables.sunPosition.actual, 10);
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
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderFrameBuffer);
    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.cullFace(gl.BACK);

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

    const normalTransform    = mat4.create();
    const normalTransform3x3 = mat3.create();
    mat4.invert(normalTransform, modelViewMatrix);
    mat4.transpose(normalTransform, normalTransform);
    mat3.fromMat4(normalTransform3x3, normalTransform);

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
    { // MATERIALS
      const numComponents = 1;
      const type = gl.UNSIGNED_BYTE;
      const normalize = false;
      const stride = 0;
      const offset = 0;

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.materials);
      gl.vertexAttribIPointer(
          programInfo.attribLocations.vertexMaterial,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          programInfo.attribLocations.vertexMaterial);
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
    gl.uniformMatrix3fv(
        programInfo.uniformLocations.normalTransform,
        false,
        normalTransform3x3);
    gl.uniform1i(programInfo.uniformLocations.isLit, DM.stateVariables.isLit.actual);
    gl.uniform3fv(programInfo.uniformLocations.sunLocation, DM.stateVariables.sunPosition.actual);
    gl.uniform1i(programInfo.uniformLocations.shadowMap, 0);
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

    // ANTI ALIAS
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.renderFrameBuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.hdrFrameBuffer);
    gl.clearBufferfv(gl.COLOR, 0, [ 0.0, 0.0, 0.0, 1.0 ]);
    gl.blitFramebuffer(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight,
                       0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight,
                       gl.COLOR_BUFFER_BIT, gl.LINEAR);
  }

  drawHDR() {
    const gl = this.gl;
    const hdrProgramInfo = this.hdrProgramInfo;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    { // VERTICES
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;

      gl.bindBuffer(gl.ARRAY_BUFFER, this.hdrVertices);
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
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.hdrIndices);

    gl.useProgram(hdrProgramInfo.program);
    gl.uniform2fv(hdrProgramInfo.uniformLocations.viewport, new Float32Array([
      gl.canvas.clientWidth,
      gl.canvas.clientHeight
    ]));
    gl.uniform1i(hdrProgramInfo.uniformLocations.sceneMap, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.hdrBuffer);

    { // Draw lines first
      const vertexCount = 6;
      const type = gl.UNSIGNED_INT;
      const offset = 0;
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
    var terrainMaterials = [];
    var water = [];
    var waterNormals = [];
    var waterMaterials = [];
    var grid = [];
    var gridNormals = [];
    var gridMaterials = [];

    if (DM.stateVariables.gridHD.actual) level.gridRes = level.gridSub / 2;
    else                                 level.gridRes = level.gridSub;
    fillTerrainAndWaterArrays(level, mouseray, t, terrain, terrainNormals, water, waterNormals);
    for (var i = 0; i < terrain.length / 3; i++) terrainMaterials.push(MATERIAL_GROUND);
    for (var i = 0; i < water.length   / 3; i++) waterMaterials.push(MATERIAL_WATER);
    if (DM.stateVariables.gridOn.actual) {
      fillGridArray(level, grid, gridNormals);
      for (var i = 0; i < grid.length / 3; i++) gridMaterials.push(MATERIAL_GRID);
    }

    const vertices  = terrain.concat(water).concat(grid);
    const normals   = terrainNormals.concat(waterNormals).concat(gridNormals);
    const materials = terrainMaterials.concat(waterMaterials).concat(gridMaterials);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    const materialBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, materialBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(materials), gl.STATIC_DRAW);

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
      materials:      materialBuffer,
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