const shadowVertexSRC = `#version 300 es
  layout (location = 0) in vec4 aVertexPosition;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  }
`;

const sceneVertexSRC = `#version 300 es
  #define MAX_NUM_LIGHTS ${MAX_NUM_LIGHTS}

  layout (location = 0) in vec4      aVertexPosition;
  layout (location = 1) in vec4      aVertexColor;
  layout (location = 2) in vec3      aVertexNormal;
  layout (location = 3) in lowp uint aVertexMaterial;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  uniform mat3 uNormalTransform;
  uniform mat4 uShadowTransform[MAX_NUM_LIGHTS];

  // Lights
  uniform bool uIsLit;
  uniform bool uLightDirectional[MAX_NUM_LIGHTS];
  uniform vec3 uLightPosition[MAX_NUM_LIGHTS];
  uniform vec3 uLightColor[MAX_NUM_LIGHTS];
  uniform uint uLightNum;

  // Material properties
  uniform sampler2D uMaterialTextureMap;
  uniform sampler2D uMaterialBumpMap;
  uniform vec3      uMaterialAmbiant;
  uniform vec3      uMaterialDiffuse;
  uniform vec2      uMaterialSpecularSoft;
  uniform vec2      uMaterialSpecularHard;

  // Object properties
  uniform vec3      uObjectCenter;
  uniform uint      uObjectType;

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
  out highp vec3  vAtmoCoord;

  flat out lowp  uint  vAtmosphere;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vPosition   = (uModelViewMatrix * aVertexPosition).xyz;
    vNormal     = normalize(uNormalTransform * aVertexNormal);
    vColor      = aVertexColor;
    vAtmosphere = uint(0);

    switch (aVertexMaterial) {
      case uint(0):
        vSpecularSoft     = vec2(0.4, 64.0);
        vSpecularHard     = vec2(0.0, 32.0);
        break;
      case uint(1):
        vSpecularSoft     = vec2(0.5,  256.0);
        vSpecularHard     = vec2(8.0, 4096.0);
        break;
      case uint(3):
        vAtmosphere = uint(1);
        vAtmoCoord  = normalize(aVertexPosition.xyz);
        break;
      default:
        vSpecularSoft     = vec2(0.5, 32.0);
        vSpecularHard     = vec2(0.0, 32.0);
        break;
    }

    if (uIsLit) {
      vDiffuse     = vLightColor * clamp(dot(aVertexNormal, uSunLocation), 0.0, 1.0);
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

const atmoVertexSRC =`#version 300 es
  layout (location = 5) in vec4 aVertexPosition;

  void main(void) {
    gl_Position = aVertexPosition;
  }
`;