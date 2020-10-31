/* Most of the code below is strongly inspired by (or straight out copied from):
 * https://developer.mozilla.org/fr/docs/Web/API/WebGL_API/Tutorial/Commencer_avec_WebGL
 */
const terrainPresets = [{ 
  R: { min: 0,   max: 0.1, add: 0.7 }, 
  G: { min: 0.3, max: 0.7, add: 0.2 },
  B: { min: 0,   max: 0.2, add: 0   } 
}];
const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const vec4 = glMatrix.vec4;

// Vertex shader
const vsSource = `
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexColor;
  attribute vec3 aVertexNormal;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat4 uNormalMatrix;

  varying lowp  vec4 vColor;
  varying highp vec3 vLighting;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;

    highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

    highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
    vLighting = ambientLight + (directionalLightColor * directional);
  }
`;

// Fragment shader
const fsSource = `
  varying lowp  vec4 vColor;
  varying highp vec3 vLighting;

  void main(void) {
    gl_FragColor = vec4(vColor.rgb * vLighting, vColor.a);
  }
`;

var CANVAS;
var _rotEnabled = false;
var _modEnabled = false;
var _modDig     = false;
var _previousCoords = null;
var _rotation    = vec3.fromValues(Math.PI / 20, 0, 0);
var _translation = vec3.fromValues(0, 0, -6);
var _transmax =  0;
var _zoommax  = -6;
var _gl = null;
var _programInfo = null;
var _buffers = null;
var _projectMat = null;
var _modelMat   = null;
var _level      = null;

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

function drawScene(gl, programInfo, buffers, rotation, translation) {
  if (buffers === null) return;
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
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
  _projectMat = projectionMatrix;

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
  _modelMat = modelViewMatrix;

  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.terrain);
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
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.terrainColor);
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
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.terrainNormal);
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
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.terrainIndex);

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

  {
    const vertexCount = buffers.nVertex;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
}

function main() {
  CANVAS = document.getElementById("Drawing");
  CANVAS.setAttribute("height", window.innerHeight + "px");
  CANVAS.setAttribute("width",  window.innerWidth - 250  + "px");
  
  const gl = CANVAS.getContext("webgl");

  if (!gl) {
    alert("Impossible d'initialiser WebGL. Votre navigateur ou votre machine peut ne pas le supporter.");
    return;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition:   gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor:      gl.getAttribLocation(shaderProgram, 'aVertexColor'),
      vertexNormal:     gl.getAttribLocation(shaderProgram, 'aVertexNormal')
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix:  gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix:     gl.getUniformLocation(shaderProgram, 'uNormalMatrix')
    }
  };
  _gl = gl;
  _programInfo = programInfo;
}

function mousedown(event) {
  
}

function mouseup(event) {
  var e = event || window.event;
  if (e.which == 2 || _rotEnabled) {
    _rotEnabled = !_rotEnabled;
    _previousCoords = null;
  } else if (e.which == 1) {

  }
}

function mousemove(event) {
  var e = event || window.event;
  if (_rotEnabled) {
    rotate(e);
  } else if (_modEnabled) {
    mod(e);
  }
}

function rotate(e) {
  if (_previousCoords !== null) {
    vec3.sub(_previousCoords, vec3.fromValues(e.clientY, e.clientX, 0), _previousCoords);
    vec3.scale(_previousCoords, _previousCoords, 0.01);
    vec3.add(_rotation, _rotation, _previousCoords);
    if (_rotation[0] >  Math.PI / 2)  _rotation[0] =  Math.PI / 2;
    if (_rotation[0] <  Math.PI / 20) _rotation[0] =  Math.PI / 20;
    if (_rotation[1] >  Math.PI / 2)  _rotation[1] =  Math.PI / 2;
    if (_rotation[1] < -Math.PI / 2)  _rotation[1] = -Math.PI / 2;
    drawScene(_gl, _programInfo, _buffers, _rotation, _translation);
  }
  _previousCoords = vec3.fromValues(e.clientY, e.clientX, 0);
}

function mod(e) {
  const invMat = mat4.create();
  const posn   = vec4.create();
  const posf   = vec4.create();
  const pos0   = vec3.create();
  const pos1   = vec3.create();
  const mRay   = vec3.create();
  var x =  (e.clientX - CANVAS.clientLeft - CANVAS.clientWidth  / 2) / (CANVAS.clientWidth  / 2);
  var y = -(e.clientY - CANVAS.clientTop  - CANVAS.clientHeight / 2) / (CANVAS.clientHeight / 2);
  mat4.mul(invMat, _projectMat, _modelMat);
  mat4.invert(invMat, invMat);
  vec4.transformMat4(posn, vec4.fromValues(x, y, -1, 1), invMat);
  vec4.transformMat4(posf, vec4.fromValues(x, y,  1, 1), invMat);
  if (posn[3] == 0 || posf[3] == 0) return;
  pos0[0] = posn[0] / posn[3];
  pos0[1] = posn[1] / posn[3];
  pos0[2] = posn[2] / posn[3];
  pos1[0] = posf[0] / posf[3];
  pos1[1] = posf[1] / posf[3];
  pos1[2] = posf[2] / posf[3];
  vec3.sub(mRay, pos1, pos0);
  vec3.normalize(mRay, mRay);

  displayLevel(_level, [ pos0, mRay ])
}

function translateXY(event) {
  var e = event || window.event;
  var step = 0.1
  switch (e.keyCode) {
    case 37: // LEFT
      if (_translation[0] + step < _transmax) _translation[0] += step;
      break;
    case 38: // UP
      if (_translation[1] - step > -_transmax) _translation[1] -= step;
      break;
    case 39: // RIGHT
      if (_translation[0] - step > -_transmax) _translation[0] -= step;
      break;
    case 40: // DOWN
      if (_translation[1] + step < _transmax) _translation[1] += step;
      break;
    case 82: // R
      _translation = vec3.fromValues(0, 0, -6);
      _rotation    = vec3.fromValues(10, 0, 0);
  }
  if (e.keyCode >= 37 && e.keyCode <= 40 || e.keyCode == 82) {
    drawScene(_gl, _programInfo, _buffers, _rotation, _translation);
  }
}

function translateZ(event) {
  var e = event || window.event;
  if (e.deltaY < 0) {
    if (_translation[2] - (e.deltaY / 10.0) <= -6.0) {
      _translation[2] -= e.deltaY / 10.0;
      drawScene(_gl, _programInfo, _buffers, _rotation, _translation);
    }
  } else {
    if (_translation[2] - (e.deltaY / 10.0) > _zoommax) {
      _translation[2] -= e.deltaY / 10.0;
      drawScene(_gl, _programInfo, _buffers, _rotation, _translation);
    }
  }
}

function displayLevel(level, mouseray) {
  var modArea = 2.0;
  var nX = Math.floor(level.terrainSizeX / level.terrainRes);
  var nZ = Math.floor(level.terrainSizeZ / level.terrainRes);
  var nX1 = nX + 1;
  var terrain = [];
  var terrainNormals = [];
  level.mouse = null;
  for (var i = 0; i < nX; i++) {
    for (var j = 0; j < nZ; j++) {
      /////////////////////////////////////////////////
      {
        var v1 = level.terrain[i + j * nX1];
        var v2 = level.terrain[i + (j + 1) * nX1];
        var v3 = level.terrain[i + 1 + j * nX1];
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
          var t = intersect(v1, v2, v3, mouseray);
          if (t !== null) {
            level.mouse = t;
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
      }
      /////////////////////////////////////////////////
      {
        var v1 = level.terrain[i + 1 + j * nX1];
        var v2 = level.terrain[i + (j + 1) * nX1];
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
          var t = intersect(v1, v2, v3, mouseray);
          if (t !== null) {
            level.mouse = t;
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
      }
    }
  }
  const terrainBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ARRAY_BUFFER, terrainBuffer);
  _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(terrain), _gl.STATIC_DRAW);
  const terrainNormalBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ARRAY_BUFFER, terrainNormalBuffer);
  _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(terrainNormals), _gl.STATIC_DRAW);

  var preset = terrainPresets[level.skin];
  if (level.terrainColors === null) {
    level.terrainColors = [];
    for (var i = 0; i < 2 * nX * nZ; i++) {
      var R = Math.random() * (preset.R.max - preset.R.min) + preset.R.min;
      var G = Math.random() * (preset.G.max - preset.G.min) + preset.G.min;
      var B = Math.random() * (preset.B.max - preset.B.min) + preset.B.min;
      for (var j = 0; j < 3; j++) {
        level.terrainColors.push(R);
        level.terrainColors.push(G);
        level.terrainColors.push(B);
        level.terrainColors.push(1.0);
      }
    }
  }
  var terrainColors = level.terrainColors;
  if (level.mouse !== null) {
    terrainColors = [];
    for (var i = 0; i < nX; i++) {
      for (var j = 0; j < nZ; j++) {
        {
          {
            var v1 = level.terrain[i + j * nX1];
            var v2 = level.terrain[i + (j + 1) * nX1];
            var v3 = level.terrain[i + 1 + j * nX1];
            const l1 = vec3.create();
            const l2 = vec3.create();
            const l3 = vec3.create();
            vec3.sub(l1, v1, level.mouse);
            vec3.sub(l2, v2, level.mouse);
            vec3.sub(l3, v3, level.mouse);
            if (vec3.length(l1) < modArea && 
                vec3.length(l2) < modArea && 
                vec3.length(l3) < modArea) {
              for (var k = 0; k < 3; k++) {
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24]     + preset.R.add);
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 1] + preset.G.add);
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 2] + preset.B.add);
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 3]);
              }
            } else {
              for (var k = 0; k < 3; k++) {
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24]);
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 1]);
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 2]);
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 3]);
              }
            }
          }
          {
            var v1 = level.terrain[i + 1 + j * nX1];
            var v2 = level.terrain[i + (j + 1) * nX1];
            var v3 = level.terrain[i + 1 + (j + 1) * nX1];
            const l1 = vec3.create();
            const l2 = vec3.create();
            const l3 = vec3.create();
            vec3.sub(l1, v1, level.mouse);
            vec3.sub(l2, v2, level.mouse);
            vec3.sub(l3, v3, level.mouse);
            if (vec3.length(l1) < modArea && 
                vec3.length(l2) < modArea && 
                vec3.length(l3) < modArea) {
              for (var k = 0; k < 3; k++) {
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 12] + preset.R.add);
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 13] + preset.G.add);
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 14] + preset.B.add);
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 15]);
              }
            } else {
              for (var k = 0; k < 3; k++) {
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 12]);
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 13]);
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 14]);
                terrainColors.push(level.terrainColors[(i * nZ + j) * 24 + 15]);
              }
            }
          }
        }
      }
    }
  }
  const terrainColorBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ARRAY_BUFFER, terrainColorBuffer);
  _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(terrainColors), _gl.STATIC_DRAW);

  var terrainIndices = [];
  for (var i = 0; i < nX * nZ; i++) {
    terrainIndices.push(6 * i);
    terrainIndices.push(6 * i + 1);
    terrainIndices.push(6 * i + 2);
    terrainIndices.push(6 * i + 3);
    terrainIndices.push(6 * i + 4);
    terrainIndices.push(6 * i + 5);
  }
  const terrainIndexBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, terrainIndexBuffer);
  _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(terrainIndices), _gl.STATIC_DRAW);

  _buffers = {
    terrain:        terrainBuffer,
    terrainColor:   terrainColorBuffer,
    terrainNormal:  terrainNormalBuffer,
    terrainIndex:   terrainIndexBuffer,
    nVertex:        6 * nX * nZ
  };

  _transmax = level.terrainSizeX / 2;
  _zoommax  = -2 * level.terrainSizeZ;
  _modEnabled = true;
  _level = level;
  drawScene(_gl, _programInfo, _buffers, _rotation, _translation);
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