
const shadowFragmentSRC = `#version 300 es
  void main(void) { }
`;

const sceneFragmentSRC = `#version 300 es
  #define PI             3.141592653589793238462643383
  #define MAX_NUM_LIGHTS ${MAX_NUM_LIGHTS}

  precision highp float;
  
  uniform sampler2D uShadowMap[MAX_NUM_LIGHTS];

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
  in highp vec3  vAtmoCoord;

  flat in lowp  uint  vAtmosphere;

  out highp vec4 FragColor;

  /// PCSS ///
  // http://developer.download.nvidia.com/whitepapers/2008/PCSS_Integration.pdf
  #define BLOCKER_SEARCH_NUM_SAMPLES 16
  #define PCF_NUM_SAMPLES            16
  #define NEAR_PLANE                 0.01
  #define LIGHT_SIZE_UV              0.18

  uniform highp vec2 POISSON_DISKS[16];

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
    if (vAtmosphere == uint(1)) {
      highp float r = acos(vAtmoCoord.y) / (PI / 2.0);
      highp vec2  p = normalize(vAtmoCoord.xz) * vec2(1.0, -1.0);
      FragColor = texture(uAtmosphere, (r * p + vec2(1.0, 1.0)) / 2.0);
      return;
    } else if (vShadowCoord.x >= 0.0) {
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
  #define BLEED_NUM_SAMPLES 16
  #define BLEED_RADIUS      0.01

  uniform highp vec2 POISSON_DISKS[16];

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

// https://www.scratchapixel.com/code.php?id=52&origin=/lessons/procedural-generation-virtual-worlds/simulating-sky
const atmoFragmentSRC = `#version 300 es
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

  vec3 computeIncidentLight(vec3 orig, vec3 dir, float tmin, float tmax) {
    float t0;
    float t1;
    if (!raySphereIntersect(orig, dir, uAtmoRadius, t0, t1) || t1 < 0.0) return vec3(0.0, 0.0, 0.0);
    if (t0 > tmin && t0 > 0.0) tmin = t0;
    if (t1 < tmax)             tmax = t1;
    float segmentLength = (tmax - tmin) / float(NUM_SAMPLES);
    float current       = tmin;
    vec3  sumR = vec3(0.0, 0.0, 0.0);
    vec3  sumM = vec3(0.0, 0.0, 0.0);
    float optDepthR = 0.0;
    float optDepthM = 0.0;
    float mu        = max(0.01, pow(dot(dir, uSunDirection), 32.0));
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
    vec2  coords = (gl_FragCoord.xy / uViewport * 2.0 - vec2(1.0, 1.0)) * uViewport.x / (uViewport.x - 32.0);
    float z2     = coords.x * coords.x + coords.y * coords.y;
    float phi    = atan(-coords.y, coords.x);
    float theta  = acos(1.0 - z2);
    vec3  dir    = vec3(sin(theta) * cos(phi), cos(theta), sin(theta) * sin(phi));
    vec3  orig   = vec3(0.0, uPlanetRadius, 0.0);
    FragColor    = vec4(computeIncidentLight(orig, dir, MIN, MAX), 1.0);
  }
`;