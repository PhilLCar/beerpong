const atmoVertexSRC =`#version 300 es
  layout (location = 5) in vec4 aVertexPosition;

  void main(void) {
    gl_Position = aVertexPosition;
  }
`;

// https://www.scratchapixel.com/code.php?id=52&origin=/lessons/procedural-generation-virtual-worlds/simulating-sky
const atmoFragSRC = `#version 300 es
  #define PI                3.1415926535897932384626433832795
  #define NUM_SAMPLES       16
  #define NUM_SAMPLES_LIGHT 8
  #define MIN               0.0
  #define MAX               3.402823466e+38
  #define SUN_INTENSITY     20.0
  #define BETA_R            vec3(3.8e-6, 13.5e-6, 33.1e-6)
  #define BETA_M            21.0e-6

  precision highp float;

  uniform highp vec2  uViewport;
  uniform highp vec3  uSunDirection;
  uniform highp float uPlanetRadius;
  uniform highp float uAtmoRadius;
  uniform highp float uRayleigh;
  uniform highp float uMie;     

  out lowp vec4 FragColor;

  bool solveQuadratic(float a, float b, float c, out float x1, out float x2) {
    if (b == 0.0) {
      if (a == 0.0) return false;
      x1 = 0.0; 
      x2 = sqrt(-c / a);
    }
    float discr = b * b - 4.0 * a * c;
    if (discr < 0.0) return false;
    float q = b < 0.0 ? -0.5 * (b - sqrt(discr)) : -0.5 * (b + sqrt(discr));
    x1 = q / a;
    x2 = c / q;
    return true;
  }

  bool raySphereIntersect(vec3 orig, vec3 dir, float radius, out float t0, out float t1) {
    float a = dir.x * dir.x + dir.y * dir.y + dir.z * dir.z;
    float b = 2.0 * dot(dir, orig);
    float c = orig.x * orig.x + orig.y * orig.y + orig.z * orig.z - radius * radius;
    if (!solveQuadratic(a, b, c, t0, t1)) return false;
    if (t0 > t1) {
      float tmp = t1;
      t1 = t0;
      t0 = tmp;
    }
    return true;
  }

  vec3 computeIncidentLight(vec3 orig, vec3 dir, float min, float max) {
    float t0;
    float t1;
    if (!raySphereIntersect(orig, dir, uAtmoRadius, t0, t1) || t1 < 0.0) return vec3(0.0, 0.0, 0.0);
    if (t0 > min && t0 > 0.0) min = t0;
    if (t1 < max)             max = t1;
    float segmentLength = (max - min) / float(NUM_SAMPLES);
    float current       = min;
    vec3  sumR = vec3(0.0, 0.0, 0.0);
    vec3  sumM = vec3(0.0, 0.0, 0.0);
    float optDepthR = 0.0;
    float optDepthM = 0.0;
    float mu        = dot(dir, uSunDirection);
    float mu2       = mu * mu;
    float phaseR    = 3.0 / (16.0 * PI) * (1.0 + mu2);
    float g         = 0.76;
    float g2        = g * g;
    float phaseM    = 3.0 / (8.0 * PI) * ((1.0 - g2) * (1.0 + mu2)) / ((2.0 + g2) * pow (1.0 + g2 - 2.0 * g * mu, 1.5));
    for (int i = 0; i < NUM_SAMPLES; ++i) {
      vec3  samplePosition = orig + (current + segmentLength * 0.5) * dir;
      float height = length(samplePosition) - uPlanetRadius;
      float hr = exp(-height / uRayleigh) * segmentLength;
      float hm = exp(-height / uMie)      * segmentLength;
      optDepthR += hr;
      optDepthM += hm;
      float light0, light1;
      raySphereIntersect(samplePosition, uSunDirection, uAtmoRadius, light0, light1);
      float segmentLengthLight = light1 / float(NUM_SAMPLES_LIGHT);
      float currentLight   = 0.0;
      float optDepthLightR = 0.0;
      float optDepthLightM = 0.0;
      int j;
      for (j = 0; j < NUM_SAMPLES_LIGHT; ++j) {
        vec3 samplePositionLight = samplePosition + (currentLight + segmentLengthLight * 0.5) * uSunDirection;
        float heightLight = length(samplePositionLight) - uPlanetRadius;
        if (heightLight < 0.0) break;
        optDepthLightR += exp(-heightLight / uRayleigh) * segmentLengthLight;
        optDepthLightM += exp(-heightLight / uMie)      * segmentLengthLight;
        currentLight   += segmentLengthLight;
      }
      if (j == NUM_SAMPLES_LIGHT) {
        vec3 tau = BETA_R * (optDepthR + optDepthLightR) + BETA_M * 1.1 * (optDepthM + optDepthLightM);
        vec3 a   = vec3(exp(-tau.x), exp(-tau.y), exp(-tau.z));
        sumR += a * hr;
        sumM += a * hm;
      }
      current += segmentLength;
    }
    return (sumR * BETA_R * phaseR + sumM * BETA_M * phaseM) * SUN_INTENSITY;
  }

  void main(void) {
    vec2  coords = gl_FragCoord.xy / uViewport * 2.0 - vec2(1.0, 1.0);
    float z2     = coords.x * coords.x + coords.y * coords.y;
    float phi    = atan(-coords.y, coords.x);
    float theta  = acos(1.0 - z2);
    vec3  dir    = vec3(sin(theta) * cos(phi), cos(theta), sin(theta) * sin(phi));
    vec3  orig   = vec3(0.0, uPlanetRadius + 1.0, 0.0);
    FragColor    = vec4(computeIncidentLight(orig, dir, MIN, MAX), 1.0);
  }
`;

class Atmosphere {
  constructor(gl) {
    this.gl = gl;
    const atmosphericProgram = initShaderProgram(gl, atmoVertexSRC, atmoFragSRC);
    this.programInfo = {
      program: atmosphericProgram,
      attribLocations: {
        vertexPosition:   gl.getAttribLocation(atmosphericProgram,  'aVertexPosition'),
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

    /// RENDER BUFFER ///
    const atmo_frame_buffer = gl.createFramebuffer();
    const atmo_buffer       = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, atmo_buffer);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, gl.canvas.clientWidth, gl.canvas.clientHeight, 0,
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
      this.frameBuffer = null;
    }
    this.atmoFrameBuffer = atmo_frame_buffer;
    this.atmoBuffer      = atmo_buffer;

    /// ATMO COORDS ///
    const atmoVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, atmoVertices);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(viewportCoords), gl.STATIC_DRAW);
    this.atmoVertices = atmoVertices;
    const atmoIndices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, atmoIndices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(viewportIndices), gl.STATIC_DRAW);
    this.atmoIndices = atmoIndices;

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  drawAtmosphere() {
    const gl          = this.gl;
    const programInfo = this.programInfo;
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

      gl.bindBuffer(gl.ARRAY_BUFFER, this.atmoVertices);
      gl.vertexAttribPointer(
          programInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.atmoIndices);

    gl.useProgram(programInfo.program);
    gl.uniform3fv(programInfo.uniformLocations.sunDirection, DM.stateVariables.sunPosition.actual);
    gl.uniform2fv(programInfo.uniformLocations.viewport, new Float32Array([
      gl.canvas.clientWidth,
      gl.canvas.clientHeight
    ]));

    { // Draw lines first
      const vertexCount = 6;
      const type = gl.UNSIGNED_INT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }
}