const atmoVertexSRC =`#version 300 es
  layout (location = 4) in vec4 aVertexPosition;

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
  #define BETA_R            vec3(3.8e-6, 13.5e-6, 33.1e-6);
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
      x1 = 0; 
      x2 = sqrt(-c / a);
    }
    float discr = b * b - 4 * a * c;
    if (discr < 0.0) return false;
    float q = b < 0.0 ? -0.5 * (b - sqrt(discr)) : -0.5 * (b + sqrt(discr));
    x1 = q / a;
    x2 = c / q;
    return true;
  }

  bool raySphereIntersect(vec3 orig, vec3 dir, float radius, out float t0, out float t1) {
    float a = length(dir);
    float b = 2.0 * dir * orig;
    float c = length(orig) - radius * radius;
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
    if (!raySphereIntersect(orig, dir, uAtmoRadius, t0, t1) || t1 < 0) return vec3(0.0, 0.0, 0.0);
    if (t0 > min && t0 > 0) min = t0;
    if (t1 < max)           max = t1;
    float segmentLength = (tmax - tmin) / NUM_SAMPLES;
    float current       = min;
    vec3  sumR;
    vec3  sumM;
    float optDepthR = 0.0;
    float optDepthM = 0.0;
    float mu        = dot(dir, uSunDirection);
    float mu2       = mu * mu;
    float phaseR    = 3.0 / (16.0 * PI) * (1 + mu2);
    float g         = 0.76;
    float g2        = g * g;
    float phaseM    = 3.0 / (8.0 * PI) * ((1.0 - g2) * (1.0 + mu2)) / ((2.0 + g2) * pow (1.0 + g2 - 2.0 * g * mu, 1.5));
    for (lowp uint i 0; i < NUM_SAMPLES; ++i) {
      vec3  samplePosition = orig + (current + segmentLength * 0.5) * dir;
      float height = length(samplePosition) - uPlanetRadius;
      float hr = exp(-height / RAYLEIGH) * segmentLength;
      float hm = exp(-height / MIE)      * segmentLength;
      optDepthR += hr;
      optDepthM += hm;
      float light0, light1;
      raySphereIntersect(samplePosition, uSunDirection, uAtmoRadius, light0, light1);
      float segmentLengthLight = light1 / NUM_SAMPLES_LIGHT;
      float currentLight = 0.0;
      float optDepthLightR = 0.0;
      float optDepthLightM = 0.0;
      lowp uint j;
      for (j = 0; j < NUM_SAMPLES_LIGHT; ++j) {
        vec3 samplePositionLight = samplePosition + (currentLight + segmentLengthLight * 0.5) * uSunDirection;
        float heightLight = length(samplePositionLight) - uPlanetRadius;
        if (heightLight < 0.0) break;
        optDepthLightR += exp(-heightLight / RAYLEIGH) * segmentLengthLight;
        optDepthLightM += exp(-heightLight / MIE)      * segmentLengthLight;
      }
      if (j == NUM_SAMPLES_LIGHT) {
        vec3 tau = BETA_R * (optDepthR + optDepthLightR) + BETA_M * 1.1 * (optDepthM + optDepthLighM);
        vec3 a   = vec3(exp(-tau.x), exp(-tau.y), exp(-tau.z));
        sumR += attenuation * hr;
        sumM += attenuation * hm;
      }
      current += segmentLength;
    }
    return (sumR * BETA_R * phaseR + sumM * BETA_M * phaseM) * SUN_INTENSITY;
  }

  void main(void) {
    vec2  coords;
    float z2    = coords.x * coords.x + coords.y * coords.y;
    float phi   = atan(coords.y, coords.x); // TODO: make sure not inverted
    float theta = acos(1.0 - z2);
    vec3  dir   = (sin(theta) * cos(phi), cos(theta), sin(theta) * sin(phi));
    vec3  orig  = vec3(0.0, uPlanetRadius, 0.0);
    FragColor   = vec4(computeIncidentLight(orig, dir, uMin, uMax), 1.0);
  }
`

class Atmosphere {
  constructor(gl) {
    this.gl = gl;
    this.initFrameBuffer();
  }

  initFrameBuffer() {
    const gl = this.gl;
    var status;

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
}