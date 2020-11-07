function initGridBack(level) {
  const gX = Math.floor(level.terrainSizeX / level.gridRes);
  const e  = gX * level.gridRes / 2;
  const s  = -e;
  const gridVertices = [];
  const gridNormals  = [];
  const gridColors   = [];
  const gridIndices  = [];
  const gridPosition = [];
  const gridObjType  = [];
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
  for (var i = 0; i < gridVertices.length / 3; i++) {
    gridNormals.push(0);
    gridNormals.push(0);
    gridNormals.push(1);
  }
  for (var i = 0; i < gridVertices.length / 3; i++) {
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
  for (var i = 0; i < gridVertices.length / 3; i++) {
    gridPosition.push(0);
    gridPosition.push(0);
    gridPosition.push(level.gridZ);
    gridObjType.push(MATERIALS.GRID.TYPE);
  }
  return new Shape({
    vertexBuffer:   gridVertices, 
    indexBuffer:    gridIndices, 
    normalBuffer:   gridNormals,
    colorBuffer:    gridColors,
    positionBuffer: gridPosition,
    objTypeBuffer:  gridObjType
  });
}

function initGrid(level) {
  const gX = Math.floor(level.terrainSizeX / level.gridRes);
  const e  = gX * level.gridRes / 2;
  const s  = -e;
  const gridVertices = [];
  const gridNormals  = [];
  const gridColors   = [];
  const gridIndices  = [];
  const gridPosition = [];
  const gridObjType  = [];
  const mod = 1 / level.gridRes * 2;
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
  for (var i = 0; i < gridVertices.length / 3; i++) {
    gridNormals.push(0);
    gridNormals.push(0);
    gridNormals.push(1);
  }
  for (var i = 0; i < gridVertices.length / 3; i++) {
    var color;
    if (i % mod < 4) color = MATERIALS.GRID.COLOR_PRESET.R.max;
    else             color = (MATERIALS.GRID.COLOR_PRESET.R.max - MATERIALS.GRID.COLOR_PRESET.R.min) / 2 + MATERIALS.GRID.COLOR_PRESET.R.min;
    gridColors.push(color);
    gridColors.push(color);
    gridColors.push(color);
    gridColors.push(MATERIALS.GRID.COLOR_PRESET.A.max);
  }
  for (var i = 0; i < gridVertices.length / 3; i++) {
    gridIndices.push(i);
    gridPosition.push(0);
    gridPosition.push(0);
    gridPosition.push(level.gridZ);
    gridObjType.push(MATERIALS.GRID.TYPE);
  }
  return new Shape({
    vertexBuffer:   gridVertices, 
    indexBuffer:    gridIndices, 
    normalBuffer:   gridNormals,
    colorBuffer:    gridColors,
    positionBuffer: gridPosition,
    objTypeBuffer:  gridObjType
  });
}

function initGridHD(level) {
  const gX = Math.floor(level.terrainSizeX / level.gridRes);
  const e  = gX * level.gridRes / 2;
  const s  = -e;
  const gridVertices = [];
  const gridNormals  = [];
  const gridColors   = [];
  const gridIndices  = [];
  const gridPosition = [];
  const gridObjType  = [];
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
  for (var i = 0; i < gridVertices.length / 3; i++) {
    gridNormals.push(0);
    gridNormals.push(0);
    gridNormals.push(1);
  }
  for (var i = 0; i < gridVertices.length / 3; i++) {
    var color;
    color = MATERIALS.GRID.COLOR_PRESET.R.min;
    gridColors.push(color);
    gridColors.push(color);
    gridColors.push(color);
    gridColors.push(MATERIALS.GRID.COLOR_PRESET.A.max);
  }
  for (var i = 0; i < gridVertices.length / 3; i++) {
    gridIndices.push(i);
    gridPosition.push(0);
    gridPosition.push(0);
    gridPosition.push(level.gridZ);
    gridObjType.push (MATERIALS.GRID.TYPE);
  }
  return new Shape({
    vertexBuffer:   gridVertices, 
    indexBuffer:    gridIndices, 
    normalBuffer:   gridNormals,
    colorBuffer:    gridColors,
    positionBuffer: gridPosition,
    objTypeBuffer:  gridObjType
  });
}