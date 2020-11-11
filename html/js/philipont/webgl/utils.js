const mat3 = glMatrix.mat3;
const mat4 = glMatrix.mat4;
const vec2 = glMatrix.vec2;
const vec3 = glMatrix.vec3;
const vec4 = glMatrix.vec4;

const TEXTYPE_NONE   = 0;
const TEXTYPE_PLANE  = 1;
const TEXTYPE_SPHERE = 2;
const TEXTYPE_ATMO   = 3;

const SHADOW_TEXTURE_SIZE = 1024;
const ATMOSPHERE_TEXTURE_SIZE = 1024;

const ATMO_PADDING = 32;

const MAX_NUM_LIGHTS = 4;
const MAX_TEXTURES   = 8;

const MAX_INDICES    = 1 << 16; // test that for now

const ZNEAR = 0.1;
const ZFAR  = 100.0;

var _unique_texture_id = MAX_NUM_LIGHTS;

function getUniqueTextureID() {
  return _unique_texture_id++;
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