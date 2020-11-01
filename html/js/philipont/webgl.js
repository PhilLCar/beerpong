/* Most of the code below is strongly inspired by (or straight out copied from):
 * https://developer.mozilla.org/fr/docs/Web/API/WebGL_API/Tutorial/Commencer_avec_WebGL
 */
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
const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const vec4 = glMatrix.vec4;

// Vertex shader
const vsSource = `
  attribute vec4  aVertexPosition;
  attribute vec4  aVertexColor;
  attribute vec3  aVertexNormal;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat4 uNormalMatrix;
  uniform bool uIsLit;

  varying lowp  vec4 vColor;
  varying highp vec3 vLighting;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;

    if (uIsLit) {
      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    } else {
      vLighting = vec3(1.0, 1.0, 1.0);
    }
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

const DM = new DisplayManager();
const MODAREA = 2.0;

var CANVAS;
var _rotEnabled = false;
var _modEnabled = false;
var _modDig     = true;
var _modApply   = null;
var _previousCoords = null;
var _rotation    = vec3.fromValues(Math.PI / 20, 0, 0);
var _translation = vec3.fromValues(0, 0, -6);
var _transmax    =  0;
var _zoommax     = -6;
var _gl          = null;
var _programInfo = null;
var _buffers     = null;
var _projectMat = null;
var _modelMat   = null;
var _mouseray   = null;
var _animate    = false;
var _gridOn     = false;
var _gridHD     = true;
var _isLit      = false;

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
  {
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
  {
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
  gl.uniform1i(programInfo.uniformLocations.isLit, _isLit);

  { // Draw lines first
    const vertexCount = buffers.nVLines[0];
    const type = gl.UNSIGNED_INT;
    const offset = 4 * buffers.nVLines[1];
    gl.drawElements(gl.LINES, vertexCount, type, offset);
  }
  {
    const vertexCount = buffers.nVTriangles[0];
    const type = gl.UNSIGNED_INT;
    const offset = 4 * buffers.nVTriangles[1];
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
}

function main() {
  CANVAS = document.getElementById("Drawing");
  CANVAS.setAttribute("height", window.innerHeight + "px");
  CANVAS.setAttribute("width",  window.innerWidth - 250  + "px");
  
  const gl = CANVAS.getContext("webgl");
  gl.getExtension('OES_element_index_uint');
  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFuncSeparate(
    gl.SRC_ALPHA,
    gl.ONE_MINUS_SRC_ALPHA,
    gl.ONE,
    gl.ONE_MINUS_SRC_ALPHA
  );

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
      normalMatrix:     gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
      isLit:            gl.getUniformLocation(shaderProgram, 'uIsLit')
    }
  };
  _gl = gl;
  _programInfo = programInfo;
  DM.start();
}

function mousedown(event) {
  var e = event || window.event;
  if (e.which == 1 && _modEnabled && !_rotEnabled) {
    _modApply = true;
  }
}

function mouseup(event) {
  var e = event || window.event;
  if (e.which == 2 || _rotEnabled) {
    _rotEnabled = !_rotEnabled;
    _previousCoords = null;
  }
  _modApply = false;
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

  _mouseray = [ pos0, mRay ];
}

function DisplayManager() {
  this.level = null;
  this.start = async function() {
    var deltams = 30;
    var time    = null;
    var pmray   = null;
    var prot    = null;
    var ptrans  = null;
    var plvl    = null;
    var pgrid   = _gridOn;
    var pgHD    = _gridHD;
    var fr      = document.getElementById("Pos");
    while (true) {
      var ticks = new Date().getTime();
      var display = false;
      var draw    = false;
      await new Promise(resolve => setTimeout(resolve, deltams));
      if (_animate) {
        display = true;
        if (time === null) time = 0;
        else               time += deltams / 1000; 
      } else               time = null;
      if ((_modEnabled && _mouseray != null)   &&
          (pmray === null                      ||
          !vec3.equals(pmray[0], _mouseray[0]) ||
          !vec3.equals(pmray[1], _mouseray[1]) ||
          _modApply)) {
        display = true;
        pmray = [ vec3.clone(_mouseray[0]), vec3.clone(_mouseray[1]) ];
      } else if (!_modEnabled) {
        pmray = null;
      }
      if (_rotEnabled && (prot === null || !vec3.equals(prot, _rotation))) {
        draw = true;
        prot = vec3.clone(_rotation);
      } else if (!_rotEnabled) {
        prot = null;
      }
      if (ptrans === null || !vec3.equals(ptrans, _translation)) {
        draw = true;
        ptrans = vec3.clone(_translation);
      }
      if (plvl === null && this.level !== null) {
        display = true;
        plvl = this.level;
      }
      if (pgrid != _gridOn) {
        display = true;
        pgrid   = _gridOn;
      }
      if (pgHD != _gridHD) {
        display = true;
        pgHD    = _gridHD;
      }
      if (display && this.level !== null) {
        displayLevel(this.level, _mouseray, time);
      } else if (draw && this.level !== null) {
        drawScene(_gl, _programInfo, _buffers, _rotation, _translation);
      }
      ticks = new Date().getTime() - ticks;
      fr.innerHTML = (1000 / ticks).toFixed(1) + " FPS";
      if (ticks > 500) {
        console.log("The rendering function was stopped because the frame rate was too low!");
        break;
      }
    }
  }
}

function toggleAnimation() {
  _animate = !_animate;
}

function toggleGrid() {
  _gridOn = !_gridOn;
}

function toggleGridHD() {
  _gridHD = !_gridHD;
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
}

function translateZ(event) {
  var e = event || window.event;
  if (e.deltaY < 0) {
    if (_translation[2] - (e.deltaY / 10.0) <= -6.0) {
      _translation[2] -= e.deltaY / 10.0;
    }
  } else {
    if (_translation[2] - (e.deltaY / 10.0) > _zoommax) {
      _translation[2] -= e.deltaY / 10.0;
    }
  }
}

function displayLevel(level, mouseray, t) {
  level.mouse = null;

  // VERTICES
  ///////////////////////////////////////////////////////////////////////////////
  var terrain = [];
  var terrainNormals = [];
  var water = [];
  var waterNormals = [];
  var grid = [];
  var gridNormals = [];

  if (_gridHD) level.gridRes = level.gridSub / 2;
  else         level.gridRes = level.gridSub;
  fillTerrainAndWaterArrays(level, mouseray, t, terrain, terrainNormals, water, waterNormals);
  if (_gridOn) fillGridArray(level, grid, gridNormals);


  const vertices = terrain.concat(water).concat(grid);
  const normals  = terrainNormals.concat(waterNormals).concat(gridNormals);
  const vertexBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ARRAY_BUFFER, vertexBuffer);
  _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(vertices), _gl.STATIC_DRAW);
  const normalBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ARRAY_BUFFER, normalBuffer);
  _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(normals), _gl.STATIC_DRAW);

  if (level.mouse !== null && _modApply) {
    applymod(level);
  }

  // COLORS
  ///////////////////////////////////////////////////////////////////////////////
  var colors;

  if (level.colors === null) {
    setTerrainAndWaterColors(level);
  }
  
  colors = fillTerrainAndWaterColorArrays(level, t);
  if (_gridOn) appendGridColors(level, colors);


  const colorBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ARRAY_BUFFER, colorBuffer);
  _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(colors), _gl.STATIC_DRAW);

  // INDICES
  ///////////////////////////////////////////////////////////////////////////////
  var indices = [];
  var nVTriangles = [ 0, 0, 0 ];
  var nVLines = [ 0, 0, 0 ];

  fillTerrainAndWaterIndices(level, t, indices, nVTriangles);
  if (_gridOn) appendGridIndices(level, indices, nVLines, nVTriangles);

  const indexBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), _gl.STATIC_DRAW);


  ///////////////////////////////////////////////////////////////////////////////
  _buffers = {
    vertices:       vertexBuffer,
    normals:        normalBuffer,
    colors:         colorBuffer,
    indices:        indexBuffer,
    nVTriangles:    nVTriangles,
    nVLines:        nVLines
  };

  _transmax = level.terrainSizeX / 2;
  _zoommax  = -2 * level.terrainSizeZ;
  _modEnabled = true;
  drawScene(_gl, _programInfo, _buffers, _rotation, _translation);
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
        if (_modDig) {
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
    nVTriangles[0] = indices.length;
    nVTriangles[2] = indices.length;
  } else {
    indices.push(l + 0);
    indices.push(l + 1);
    indices.push(l + 2);
    indices.push(l + 0);
    indices.push(l + 2);
    indices.push(l + 3);
    nVTriangles[0] = indices.length;
    nVTriangles[2] = indices.length - 2;
  }
}

function appendGridIndices(level, indices, nVLines, nVTriangles) {
  var gX = Math.floor(level.terrainSizeX / level.gridRes);
  var lt = nVTriangles[2];
  var ll = nVLines[2];
  indices.push(lt + 0);
  indices.push(lt + 1);
  indices.push(lt + 2);
  indices.push(lt + 0);
  indices.push(lt + 2);
  indices.push(lt + 3);
  lt += 4;
  nVTriangles[2] = lt;
  nVTriangles[0] = indices.length;
  nVLines[1] = nVTriangles[0];
  for (var i = 0; i <= gX; i++) {
    indices.push(lt + ll++);
    indices.push(lt + ll++);
    indices.push(lt + ll++);
    indices.push(lt + ll++);
  }
  nVLines[0] = ll;
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