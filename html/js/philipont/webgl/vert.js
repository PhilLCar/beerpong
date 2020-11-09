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

  layout (location = 0) in highp vec4 aVertexPosition;
  layout (location = 1) in highp vec4 aVertexColor;
  layout (location = 2) in highp vec3 aVertexNormal;
  layout (location = 3) in highp vec3 aObjectCenter;
  layout (location = 4) in lowp  uint aObjectType;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat3 uNormalTransform;
  uniform mat4 uShadowTransform[MAX_NUM_LIGHTS];

  // Lights
  uniform bool uIsLit;
  uniform bool uLightDirectional[MAX_NUM_LIGHTS];
  uniform vec3 uLightPosition[MAX_NUM_LIGHTS];
  uniform uint uLightNum;

  out highp vec3 vVMPosition;
  out highp vec3 vPosition;
  out highp vec4 vColor;
  out highp vec3 vNormal;
  out highp vec3 vCenter;
  out highp vec3 vLightDir[MAX_NUM_LIGHTS];
  out highp vec3 vShadowCoord[MAX_NUM_LIGHTS];

  flat out lowp uint vLightNum;
  flat out lowp uint vObjectType;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vVMPosition = (uModelViewMatrix * aVertexPosition).xyz;
    vPosition   = aVertexPosition.xyz;
    vNormal     = normalize(uNormalTransform * aVertexNormal);
    vCenter     = aObjectCenter;
    vColor      = aVertexColor;
    vObjectType = aObjectType;

    if (uIsLit) {
      for (uint i = uint(0); i < uLightNum; ++i) {
        vec3 lightDir;
        vec4 shadowCoord = uShadowTransform[i] * aVertexPosition;
        if (uLightDirectional[i]) {
          lightDir = uLightPosition[i];
        } else {
          lightDir = normalize(uLightPosition[i] - aVertexPosition.xyz);
        }
        vLightDir[i]    = uNormalTransform * lightDir;
        vShadowCoord[i] = shadowCoord.xyz / shadowCoord.w;
      }
      vLightNum = uLightNum;
    } else {
      vLightNum = uint(0);
    }
  }
`;

const hdrVertexSRC=`#version 300 es
  layout (location = 6) in vec4 aVertexPosition;

  void main(void) {
    gl_Position = aVertexPosition;
  }
`;

const atmoVertexSRC =`#version 300 es
  layout (location = 7) in vec4 aVertexPosition;

  void main(void) {
    gl_Position = aVertexPosition;
  }
`;