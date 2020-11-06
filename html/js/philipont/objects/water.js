function initWaterPlane(gl, level) {
  const preset = MATERIALS.WATER;
  const tl     = level.terrain[0];
  const tr     = level.terrain[nX];
  const bl     = level.terrain[nZ * nX1];
  const br     = level.terrain[nX + nZ * nX1];
  const waterVertices = [];
  const waterNormals  = [];
  const waterColors   = [];
  const waterIndices  = [];
  waterVertices.push(tr[0]);
  waterVertices.push(level.waterLevel);
  waterVertices.push(tr[2]);
  waterVertices.push(tl[0]);
  waterVertices.push(level.waterLevel);
  waterVertices.push(tl[2]);
  waterVertices.push(bl[0]);
  waterVertices.push(level.waterLevel);
  waterVertices.push(bl[2]);
  waterVertices.push(br[0]);
  waterVertices.push(level.waterLevel);
  waterVertices.push(br[2]);
  for (var i = 0; i < 4; i++) {
    waterNormals.push(0);
    waterNormals.push(1);
    waterNormals.push(0);
  }
  for (var i = 0; i < 4; i++) {
    waterColors.push(waterPreset.R.max);
    waterColors.push(waterPreset.G.max);
    waterColors.push(waterPreset.B.max);
    waterColors.push(0.8);
  }
  waterIndices.push(0);
  waterIndices.push(1);
  waterIndices.push(2);
  waterIndices.push(0);
  waterIndices.push(2);
  waterIndices.push(3);
  return new Shape(
    gl,
    { 
      vertexBuffer: terrainVertices, 
      indexBuffer:  terrainIndices, 
      normalBuffer: terrainNormals,
      colorBuffer:  terrainColors
    },
    preset
  );
}

function initWaterWaves(gl, level) {

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
    
  }
}