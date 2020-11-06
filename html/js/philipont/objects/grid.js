function initGridBack(gl, level) {
  const gX = Math.floor(level.terrainSizeX / level.gridRes);
  const e  = gX * level.gridRes / 2;
  const s  = -e;
  const gridVertices = [];
  const gridNormals  = [];
  const gridColors   = [];
  const gridIndices  = [];
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
    gridColors.push(0);
    gridColors.push(0);
    gridColors.push(0);
    gridColors.push(0.2);
  }
  gridIndices.push(0);
  gridIndices.push(1);
  gridIndices.push(2);
  gridIndices.push(0);
  gridIndices.push(2);
  gridIndices.push(3);
  return new Shape(gl, {
    vertexBuffer: gridVertices, 
    indexBuffer:  gridIndices, 
    normalBuffer: gridNormals,
    colorBuffer:  gridColors
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
  const mod = 1 / level.gridRes * 4;
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
    if (i % mod < 4) color = 1;
    else             color = 0.8;
    gridColors.push(color);
    gridColors.push(color);
    gridColors.push(color);
    gridColors.push(1);
  }
  for (var i = 0; i < gridVertices.length; i++) {
    gridIndices.push(i);
  }
  const shape = new Shape(gl, {
    vertexBuffer: gridVertices, 
    indexBuffer:  gridIndices, 
    normalBuffer: gridNormals,
    colorBuffer:  gridColors
  });
  shape.isLine = true;
  return shape;
}

function initGridHD(gl, level) {
  const gX = Math.floor(level.terrainSizeX / level.gridRes);
  const e  = gX * level.gridRes / 2;
  const s  = -e;
  const gridVertices = [];
  const gridNormals  = [];
  const gridColors   = [];
  const gridIndices  = [];
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
    gridColors.push(0.6);
    gridColors.push(0.6);
    gridColors.push(0.6);
    gridColors.push(0.6);
  }
  for (var i = 0; i < gridVertices.length; i++) {
    gridIndices.push(i);
  }
  const shape = new Shape(gl, {
    vertexBuffer: gridVertices, 
    indexBuffer:  gridIndices, 
    normalBuffer: gridNormals,
    colorBuffer:  gridColors
  });
  shape.isLine = true;
  return shape;
}