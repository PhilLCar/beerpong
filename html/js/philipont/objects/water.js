function initWaterPlane(gl, level) {
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
  return new Shape(
    gl,
    { 
      vertexBuffer: waterVertices, 
      indexBuffer:  waterIndices, 
      normalBuffer: waterNormals,
      colorBuffer:  waterColors
    },
    material
  );
}

function initWaterWaves(gl, level) {
  const material = MATERIALS.WATER;
  const nX       = Math.floor(level.terrainSizeX / level.terrainRes);
  const nZ       = Math.floor(level.terrainSizeZ / level.terrainRes);
  const nX1      = nX + 1;
  const waterVertices = [];
  const waterNormals  = [];
  const waterColors   = [];
  const waterIndices  = [];
  const terrain       = level.terrain;
  const waterLevel    = level.waterLevel;
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
  }
  const shape = new Shape(
    gl,
    { 
      vertexBuffer: waterVertices, 
      indexBuffer:  waterIndices, 
      normalBuffer: waterNormals,
      colorBuffer:  waterColors
    },
    material
  );
  shape.nX         = nX;
  shape.nX1        = nX1;
  shape.nZ         = nZ;
  shape.freq       = 1.5;
  shape.amp        = 0.05;
  shape.waterLevel = waterLevel;
  shape.animate = function(scene, t) {
    const nX         = shape.nX;
    const nX1        = shape.nX1;
    const nZ         = shape.nZ;
    const waterLevel = shape.waterLevel;
    const vertices   = shape.vertices;

    for (var i = 0; i < nX; i++) {
      for (var j = 0; j < nZ; j++) {
        const index = (i * nZ + j) * 18;
        /////////////////////////////////////////////////
        {
          const i1 = i + 1 +  j      * nX1;
          const i2 = i +     (j + 1) * nX1;
          const i3 = i + 1 + (j + 1) * nX1;
          const y1 =  waterLevel + Math.sin(t / (Math.PI / 2) * freq + i1) * amp;
          const y2 =  waterLevel + Math.sin(t / (Math.PI / 2) * freq + i2) * amp;
          const y3 =  waterLevel + Math.sin(t / (Math.PI / 2) * freq + i3) * amp;
          vertices[index + 1] = y1;
          vertices[index + 4] = y2;
          vertices[index + 7] = y3;
        }
        /////////////////////////////////////////////////
        {
          const i1 = i + 1 +  j      * nX1;
          const i2 = i +     (j + 1) * nX1;
          const i3 = i + 1 + (j + 1) * nX1;
          const y1 = waterLevel + Math.sin(t / (Math.PI / 2) * freq + i1) * amp;
          const y2 = waterLevel + Math.sin(t / (Math.PI / 2) * freq + i2) * amp;
          const y3 = waterLevel + Math.sin(t / (Math.PI / 2) * freq + i3) * amp;
          vertices[index + 10] = y1;
          vertices[index + 13] = y2;
          vertices[index + 16] = y3;
        }
      }
    }
  }
  return shape;
}