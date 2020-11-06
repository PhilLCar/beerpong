function initGridBack(gl, level) {
  const gX = Math.floor(level.terrainSizeX / level.gridRes);
  const e  = gX * level.gridRes / 2;
  const s  = -e;
  const gridVertices = [];
  const gridNormals  = [];
  const gridColors   = [];
  const gridIndices  = [];
  const gridPosition = [];
  const gridLighting = [];
  const gridSpecSoft = [];
  const gridSpecHard = [];
  const gridTexture  = [];
  const gridTexType  = [];
  // top right corner
  gridVertices.push(e);
  gridVertices.push(e);
  gridVertices.push(level.gridZ);
  // top left corner
  gridVertices.push(s);
  gridVertices.push(e);
  gridVertices.push(level.gridZ);
  // bottom left corner
  gridVertices.push(s);
  gridVertices.push(s);
  gridVertices.push(level.gridZ);
  // bottom right corner
  gridVertices.push(e);
  gridVertices.push(s);
  gridVertices.push(level.gridZ);
  for (var i = 0; i < gridVertices.length; i++) {
    gridNormals.push(0);
    gridNormals.push(0);
    gridNormals.push(1);
  }
  for (var i = 0; i < gridVertices.length; i++) {
    gridColors.push(MATERIALS.GRID.BACK.R);
    gridColors.push(MATERIALS.GRID.BACK.G);
    gridColors.push(MATERIALS.GRID.BACK.B);
    gridColors.push(MATERIALS.GRID.BACK.A);
  }
  gridIndices.push(0);
  gridIndices.push(1);
  gridIndices.push(2);
  gridIndices.push(0);
  gridIndices.push(2);
  gridIndices.push(3);
  for (var i = 0; i < 6 * nX * nZ; i++) {
    gridPosition.push(0);
    gridPosition.push(0);
    gridPosition.push(level.gridZ);
    gridLighting.push(MATERIALS.GRID.AMBIANT);
    gridLighting.push(MATERIALS.GRID.DIFFUSE);
    gridSpecSoft.push(MATERIALS.GRID.SPECULAR_SOFT[0]);
    gridSpecSoft.push(MATERIALS.GRID.SPECULAR_SOFT[1]);
    gridSpecHard.push(MATERIALS.GRID.SPECULAR_HARD[0]);
    gridSpecHard.push(MATERIALS.GRID.SPECULAR_HARD[1]);
    gridTexture.push (MATERIALS.GRID.TEXTURE);
    gridTexType.push (MATERIALS.GRID.TEXTYPE);
  }
  return new Shape({
    vertexBuffer:   gridVertices, 
    indexBuffer:    gridIndices, 
    normalBuffer:   gridNormals,
    colorBuffer:    gridColors,
    positionBuffer: gridPosition,
    lightingBuffer: gridLighting,
    specSoftBuffer: gridSpecSoft,
    specHardBuffer: gridSpecHard,
    textureBuffer:  gridTexture,
    texTypeBuffer:  gridTexType
  });
}

function initGrid(gl, level) {
  const gX = Math.floor(level.terrainSizeX / level.gridRes);
  const e  = gX * level.gridRes / 2;
  const s  = -e;
  const gridVertices = [];
  const gridNormals  = [];
  const gridColors   = [];
  const gridIndices  = [];
  const gridPosition = [];
  const gridLighting = [];
  const gridSpecSoft = [];
  const gridSpecHard = [];
  const gridTexture  = [];
  const gridTexType  = [];
  const mod = 1 / level.gridRes * 12;
  for (var i = 0; i <= gX; i++) {
    if (i % 2 == 1) continue;
    // top line
    gridVertices.push(s + i * level.gridRes);
    gridVertices.push(e);
    gridVertices.push(level.gridZ);
    // bottom line
    gridVertices.push(s + i * level.gridRes);
    gridVertices.push(s);
    gridVertices.push(level.gridZ);
    // left line
    gridVertices.push(s);
    gridVertices.push(s + i * level.gridRes);
    gridVertices.push(level.gridZ);
    // right line
    gridVertices.push(e);
    gridVertices.push(s + i * level.gridRes);
    gridVertices.push(level.gridZ);
  }
  for (var i = 0; i < gridVertices.length; i++) {
    gridNormals.push(0);
    gridNormals.push(0);
    gridNormals.push(1);
  }
  for (var i = 0; i < gridVertices.length; i++) {
    var color;
    if (i % mod < 4) color = MATERIALS.GRID.COLOR_PRESET.R.max;
    else             color = (MATERIALS.GRID.COLOR_PRESET.R.max - MATERIALS.GRID.COLOR_PRESET.R.min) / 2;
    gridColors.push(color);
    gridColors.push(color);
    gridColors.push(color);
    gridColors.push(MATERIALS.GRID.COLOR_PRESET.A.max);
  }
  for (var i = 0; i < gridVertices.length; i++) {
    gridIndices.push(i);
    gridPosition.push(0);
    gridPosition.push(0);
    gridPosition.push(level.gridZ);
    gridLighting.push(MATERIALS.GRID.AMBIANT);
    gridLighting.push(MATERIALS.GRID.DIFFUSE);
    gridSpecSoft.push(MATERIALS.GRID.SPECULAR_SOFT[0]);
    gridSpecSoft.push(MATERIALS.GRID.SPECULAR_SOFT[1]);
    gridSpecHard.push(MATERIALS.GRID.SPECULAR_HARD[0]);
    gridSpecHard.push(MATERIALS.GRID.SPECULAR_HARD[1]);
    gridTexture.push (MATERIALS.GRID.TEXTURE);
    gridTexType.push (MATERIALS.GRID.TEXTYPE);
  }
  return new Shape({
    vertexBuffer:   gridVertices, 
    indexBuffer:    gridIndices, 
    normalBuffer:   gridNormals,
    colorBuffer:    gridColors,
    positionBuffer: gridPosition,
    lightingBuffer: gridLighting,
    specSoftBuffer: gridSpecSoft,
    specHardBuffer: gridSpecHard,
    textureBuffer:  gridTexture,
    texTypeBuffer:  gridTexType
  });
}

function initGridHD(gl, level) {
  const gX = Math.floor(level.terrainSizeX / level.gridRes);
  const e  = gX * level.gridRes / 2;
  const s  = -e;
  const gridVertices = [];
  const gridNormals  = [];
  const gridColors   = [];
  const gridIndices  = [];
  const gridPosition = [];
  const gridLighting = [];
  const gridSpecSoft = [];
  const gridSpecHard = [];
  const gridTexture  = [];
  const gridTexType  = [];
  for (var i = 0; i <= gX; i++) {
    if (i % 2 == 0) continue;
    // top line
    gridVertices.push(s + i * level.gridRes);
    gridVertices.push(e);
    gridVertices.push(level.gridZ);
    // bottom line
    gridVertices.push(s + i * level.gridRes);
    gridVertices.push(s);
    gridVertices.push(level.gridZ);
    // left line
    gridVertices.push(s);
    gridVertices.push(s + i * level.gridRes);
    gridVertices.push(level.gridZ);
    // right line
    gridVertices.push(e);
    gridVertices.push(s + i * level.gridRes);
    gridVertices.push(level.gridZ);
  }
  for (var i = 0; i < gridVertices.length; i++) {
    gridNormals.push(0);
    gridNormals.push(0);
    gridNormals.push(1);
  }
  for (var i = 0; i < gridVertices.length; i++) {
    var color;
    color = MATERIALS.GRID.COLOR_PRESET.R.min;
    gridColors.push(color);
    gridColors.push(color);
    gridColors.push(color);
    gridColors.push(MATERIALS.GRID.COLOR_PRESET.A.max);
  }
  for (var i = 0; i < gridVertices.length; i++) {
    gridIndices.push(i);
    gridPosition.push(0);
    gridPosition.push(0);
    gridPosition.push(level.gridZ);
    gridLighting.push(MATERIALS.GRID.AMBIANT);
    gridLighting.push(MATERIALS.GRID.DIFFUSE);
    gridSpecSoft.push(MATERIALS.GRID.SPECULAR_SOFT[0]);
    gridSpecSoft.push(MATERIALS.GRID.SPECULAR_SOFT[1]);
    gridSpecHard.push(MATERIALS.GRID.SPECULAR_HARD[0]);
    gridSpecHard.push(MATERIALS.GRID.SPECULAR_HARD[1]);
    gridTexture.push (MATERIALS.GRID.TEXTURE);
    gridTexType.push (MATERIALS.GRID.TEXTYPE);
  }
  return new Shape({
    vertexBuffer:   gridVertices, 
    indexBuffer:    gridIndices, 
    normalBuffer:   gridNormals,
    colorBuffer:    gridColors,
    positionBuffer: gridPosition,
    lightingBuffer: gridLighting,
    specSoftBuffer: gridSpecSoft,
    specHardBuffer: gridSpecHard,
    textureBuffer:  gridTexture,
    texTypeBuffer:  gridTexType
  });
}