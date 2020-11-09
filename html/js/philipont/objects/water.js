function initWaterPlane(scene, level) {
  const material = MATERIALS.WATER;
  const nX        = Math.floor(level.terrainSizeX / level.terrainRes);
  const nZ        = Math.floor(level.terrainSizeZ / level.terrainRes);
  const tl        = level.terrain[0];
  const tr        = level.terrain[nX];
  const bl        = level.terrain[nZ * (nX + 1)];
  const br        = level.terrain[nX + nZ * (nX + 1)];
  const waterVertices = [];
  const waterNormals  = [];
  const waterColors   = [];
  const waterIndices  = [];
  const waterPosition = [];
  const waterObjType  = [];
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
    waterColors.push(material.COLOR_PRESET.R.max);
    waterColors.push(material.COLOR_PRESET.G.max);
    waterColors.push(material.COLOR_PRESET.B.max);
    waterColors.push(material.COLOR_PRESET.A.max);
  }
  waterIndices.push(0);
  waterIndices.push(1);
  waterIndices.push(2);
  waterIndices.push(0);
  waterIndices.push(2);
  waterIndices.push(3);
  for (var i = 0; i < 4; i++) {
    waterPosition.push(0);
    waterPosition.push(level.waterLevel);
    waterPosition.push(0);
    waterObjType.push(material.TYPE);
  }
  return new Shape(scene, { 
    vertexBuffer:   waterVertices, 
    indexBuffer:    waterIndices, 
    normalBuffer:   waterNormals,
    colorBuffer:    waterColors,
    positionBuffer: waterPosition,
    objTypeBuffer:  waterObjType
  }, false);
}

function initWaterWaves(scene, level) {
  const material = MATERIALS.WATER;
  const nX       = Math.floor(level.terrainSizeX / level.terrainRes);
  const nZ       = Math.floor(level.terrainSizeZ / level.terrainRes);
  const nX1      = nX + 1;
  const waterVertices = [];
  const waterNormals  = [];
  const waterColors   = [];
  const waterIndices  = [];
  const waterPosition = [];
  const waterObjType  = [];
  const waterLevel    = level.waterLevel;
  const terrain       = level.terrain;
  for (var i = 0; i < nX; i++) {
    for (var j = 0; j < nZ; j++) {
      /////////////////////////////////////////////////
      {
        const v1   = terrain[i +     j      * nX1];
        const v2   = terrain[i +    (j + 1) * nX1];
        const v3   = terrain[i + 1 + j      * nX1];
        const u1   = vec3.fromValues(v1[0], waterLevel, v1[2]);
        const u2   = vec3.fromValues(v2[0], waterLevel, v2[2]);
        const u3   = vec3.fromValues(v3[0], waterLevel, v3[2]);
        const a1   = vec3.create();
        const a2   = vec3.create();
        const norm = vec3.create();
        waterVertices.push(u1[0]);
        waterVertices.push(u1[1]);
        waterVertices.push(u1[2]);
        waterVertices.push(u2[0]);
        waterVertices.push(u2[1]);
        waterVertices.push(u2[2]);
        waterVertices.push(u3[0]);
        waterVertices.push(u3[1]);
        waterVertices.push(u3[2]);
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
      /////////////////////////////////////////////////
      {
        const v1   = terrain[i + 1 +  j      * nX1];
        const v2   = terrain[i +     (j + 1) * nX1];
        const v3   = terrain[i + 1 + (j + 1) * nX1];
        const u1   = vec3.fromValues(v1[0], waterLevel, v1[2]);
        const u2   = vec3.fromValues(v2[0], waterLevel, v2[2]);
        const u3   = vec3.fromValues(v3[0], waterLevel, v3[2]);
        const a1   = vec3.create();
        const a2   = vec3.create();
        const norm = vec3.create();
        waterVertices.push(u1[0]);
        waterVertices.push(u1[1]);
        waterVertices.push(u1[2]);
        waterVertices.push(u2[0]);
        waterVertices.push(u2[1]);
        waterVertices.push(u2[2]);
        waterVertices.push(u3[0]);
        waterVertices.push(u3[1]);
        waterVertices.push(u3[2]);
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
  for (var i = 0; i < 2 * nX * nZ; i++) {
    var R = Math.random() * (material.COLOR_PRESET.R.max - material.COLOR_PRESET.R.min) + material.COLOR_PRESET.R.min;
    var G = Math.random() * (material.COLOR_PRESET.G.max - material.COLOR_PRESET.G.min) + material.COLOR_PRESET.G.min;
    var B = Math.random() * (material.COLOR_PRESET.B.max - material.COLOR_PRESET.B.min) + material.COLOR_PRESET.B.min;
    var A = Math.random() * (material.COLOR_PRESET.A.max - material.COLOR_PRESET.A.min) + material.COLOR_PRESET.A.min;
    for (var j = 0; j < 3; j++) {
      waterColors.push(R);
      waterColors.push(G);
      waterColors.push(B);
      waterColors.push(A);
    }
  }
  for (var i = 0; i < 6 * nX * nZ; i++) {
    waterIndices.push(i);
    waterPosition.push(0);
    waterPosition.push(waterLevel);
    waterPosition.push(0);
    waterObjType.push(material.TYPE);
  }
  const shape = new Shape(scene, { 
    vertexBuffer:   waterVertices, 
    indexBuffer:    waterIndices, 
    normalBuffer:   waterNormals,
    colorBuffer:    waterColors,
    positionBuffer: waterPosition,
    objTypeBuffer:  waterObjType
  }, false);
  shape.nX         = nX;
  shape.nX1        = nX1;
  shape.nZ         = nZ;
  shape.nZ1        = nZ + 1;
  shape.freq       = 1.5;
  shape.amp        = 0.05;
  shape.waterLevel = waterLevel;
  shape.animate = function(scene, t) {
    const nX1        = shape.nX1;
    const nZ         = shape.nZ;
    const nZ1        = shape.nZ1;
    const waterLevel = shape.waterLevel;
    const vertices   = shape.vertexBuffer[0];
    const normals    = shape.normalBuffer[0];
    const freq       = shape.freq;
    const amp        = shape.amp;

    if (t === null) return;

    for (var i = 0; i < nX1; i++) {
      for (var j = 0; j < nZ1; j++) {
        const y  =  waterLevel + Math.sin(t / (Math.PI / 2) * freq + i * j) * amp;
        if (i < nX && j < nZ) {
          const i1 = (i * nZ + j) * 18 + 1;
          vertices[i1] = y;
        }
        if (i > 0 && j < nZ) {
          const i2 = ((i - 1) * nZ + j) * 18 + 7;
          const i3 = i2 + 3;
          vertices[i2] = y;
          vertices[i3] = y;
        }
        if (i < nX && j > 0) {
          const i4 = (i * nZ + j - 1) * 18 + 4;
          const i5 = i4 + 9;
          vertices[i4] = y;
          vertices[i5] = y;
        }
        if (i > 0 && j > 0) {
          const i6 = ((i - 1) * nZ + j - 1) * 18 + 16;
          vertices[i6] = y;
        }
      }
    }
    // Normals // Optimizable
    for (var i = 0; i < nX; i++) {
      for (var j = 0; j < nZ; j++) {
        const index = (i * nZ + j) * 18;
        {
          const v1 = vec3.fromValues(vertices[index],     vertices[index + 1], vertices[index + 2]);
          const v2 = vec3.fromValues(vertices[index + 3], vertices[index + 4], vertices[index + 5]);
          const v3 = vec3.fromValues(vertices[index + 6], vertices[index + 7], vertices[index + 8]);
          const a1   = vec3.create();
          const a2   = vec3.create();
          const norm = vec3.create();
          vec3.sub(a1, v2, v1);
          vec3.sub(a2, v3, v1);
          vec3.cross(norm, a1, a2);
          vec3.normalize(norm, norm);
          for (var k = 0; k < 3; k++) {
            normals[index + k * 3]     = norm[0];
            normals[index + k * 3 + 1] = norm[1];
            normals[index + k * 3 + 2] = norm[2];
          }
        }
        {
          const v1 = vec3.fromValues(vertices[index + 9],  vertices[index + 10], vertices[index + 11]);
          const v2 = vec3.fromValues(vertices[index + 12], vertices[index + 13], vertices[index + 14]);
          const v3 = vec3.fromValues(vertices[index + 15], vertices[index + 16], vertices[index + 17]);
          const a1   = vec3.create();
          const a2   = vec3.create();
          const norm = vec3.create();
          vec3.sub(a1, v2, v1);
          vec3.sub(a2, v3, v1);
          vec3.cross(norm, a1, a2);
          vec3.normalize(norm, norm);
          for (var k = 0; k < 3; k++) {
            normals[index + k * 3 + 9]  = norm[0];
            normals[index + k * 3 + 10] = norm[1];
            normals[index + k * 3 + 11] = norm[2];
          }
        }
      }
    }
  }
  return shape;
}
