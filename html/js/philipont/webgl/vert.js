const shadowVertexSRC = `#version 300 es
  layout (location = 0) in vec4 aVertexPosition;
  //layout (location = 10) in sampler2D aBumpMap;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  // out highp vec3 vNormal;
  // out highp vec3 vPosition;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    // vPosition   = (uModelViewMatrix * aVertexPosition).xyz;
    // vNormal     = normalize(uNormalTransform * aVertexNormal);
  }
`;

const sceneVertexSRC = `#version 300 es
  #define MAX_NUM_LIGHTS ${MAX_NUM_LIGHTS}

  layout (location = 0) in vec4      aVertexPosition;
  layout (location = 1) in vec4      aVertexColor;
  layout (location = 2) in vec3      aVertexNormal;
  layout (location = 3) in vec3      aObjectCenter;
  layout (location = 4) in uint      aTextureType;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat3 uNormalTransform;
  uniform mat4 uShadowTransform[MAX_NUM_LIGHTS];

  // Lights
  uniform bool uIsLit;
  uniform bool uLightDirectional[MAX_NUM_LIGHTS];
  uniform vec3 uLightPosition[MAX_NUM_LIGHTS];
  uniform uint uLightNum;

  // Object properties
  uniform vec3 uObjectCenter;

  out highp vec3 vPosition;
  out highp vec4 vColor;
  out highp vec3 vNormal;
  out highp vec3 vCenter;
  out highp vec3 vLightDir[MAX_NUM_LIGHTS];
  out highp vec3 vShadowCoord[MAX_NUM_LIGHTS];

  flat out lowp uint vLightNum;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vPosition   = (uModelViewMatrix * aVertexPosition).xyz;
    vNormal     = normalize(uNormalTransform * aVertexNormal);
    vCenter     = (uModelViewMatrix * vec4(uObjectCenter, 1.0)).xyz;
    vColor      = aVertexColor;

    if (uIsLit) {
      for (uint i = uint(0); i < uLightNum; ++i) {
        vec3 lightDir;
        if (uLightDirectional[i]) {
          lightDir = uLightPosition[i];
        } else {
          lightDir = normalize(uLightPosition[i] - aVertexPosition.xyz);
        }
        vLightDir[i]    = uNormalTransform * lightDir;
        vShadowCoord[i] = (uShadowTransform[i] * aVertexPosition).xyz;
      }
    } else {
      vLightNum = uint(0);
    }
  }
`;

const hdrVertexSRC=`#version 300 es
  layout (location = 9) in vec4 aVertexPosition;

  void main(void) {
    gl_Position = aVertexPosition;
  }
`;

const atmoVertexSRC =`#version 300 es
  layout (location = 10) in vec4 aVertexPosition;

  void main(void) {
    gl_Position = aVertexPosition;
  }
`;