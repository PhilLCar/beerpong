function initSphere(gl, size = 1, resolution = 20, inverted = false, material = MATERIALS.DEFAULT, position = vec3.fromValues(0, 0, 0)) {
  const preset = material.COLOR_PRESET;
  const vertices  = [];
  const normals   = [];
  const colors    = [];
  const indices   = [];

  // Add top point
  vertices.push(position[0]);
  vertices.push(position[1] + size);
  vertices.push(position[2]);
  normals.push(0.0);
  normals.push(inverted ? -1.0 : 1.0);
  normals.push(0.0);
  colors.push(preset.R.max);
  colors.push(preset.G.max);
  colors.push(preset.B.max);
  colors.push(preset.A.max);
  for (var i = 1; i < resolution / 2; i++) {
    for (var j = 0; j < resolution; j++) {
      // VERTEX
      var y   = Math.cos(Math.PI * i / (resolution / 2)) * size;
      var rxz = Math.sin(Math.PI * i / (resolution / 2)) * size;
      var x   = Math.cos(Math.PI * 2 * j / resolution) * rxz;
      var z   = Math.sin(Math.PI * 2 * j / resolution) * rxz;
      vertices.push(x + position[0]);
      vertices.push(y + position[1]);
      vertices.push(z + position[2]);
      // NORMAL
      const normal = vec3.fromValues(x, y, z);
      vec3.normalize(normal, normal);
      if (inverted) {
        normals.push(-normal[0]);
        normals.push(-normal[1]);
        normals.push(-normal[2]);
      } else {
        normals.push(normal[0]);
        normals.push(normal[1]);
        normals.push(normal[2]);
      }
      // COLOR
      colors.push(preset.R.max);
      colors.push(preset.G.max);
      colors.push(preset.B.max);
      colors.push(preset.A.max);
    }
  }
  // Add bottom point
  vertices.push(position[0]);
  vertices.push(position[1] - size);
  vertices.push(position[2]);
  normals.push(0.0);
  normals.push(inverted ? 1.0 : -1.0);
  normals.push(0.0);
  colors.push(preset.R.max);
  colors.push(preset.G.max);
  colors.push(preset.B.max);
  colors.push(preset.A.max);
  // INDICES
  // top row
  if (inverted) {
    for (var i = 0; i < resolution; i++) {
      indices.push(0);
      indices.push( i                   + 1);
      indices.push((i + 1) % resolution + 1);
    }
    for (var i = 0; i < (resolution / 2) - 2; i++) {
      for (var j = 0; j < resolution; j++) {
        indices.push( j                   +  i      * resolution + 1);
        indices.push((j + 1) % resolution + (i + 1) * resolution + 1);
        indices.push((j + 1) % resolution +  i      * resolution + 1);
        indices.push( j                   +  i      * resolution + 1);
        indices.push( j                   + (i + 1) * resolution + 1);
        indices.push((j + 1) % resolution + (i + 1) * resolution + 1);
      }
    }
    // bottom row
    for (var i = 0; i < resolution; i++) {
      indices.push( i                   + (resolution / 2 - 2) * resolution + 1);
      indices.push(                       (resolution / 2 - 1) * resolution + 1);
      indices.push((i + 1) % resolution + (resolution / 2 - 2) * resolution + 1);
    }
  } else {
    for (var i = 0; i < resolution; i++) {
      indices.push(0);
      indices.push((i + 1) % resolution + 1);
      indices.push( i                   + 1);
    }
    for (var i = 0; i < (resolution / 2) - 2; i++) {
      for (var j = 0; j < resolution; j++) {
        indices.push( j                   +  i      * resolution + 1);
        indices.push((j + 1) % resolution +  i      * resolution + 1);
        indices.push((j + 1) % resolution + (i + 1) * resolution + 1);
        indices.push( j                   +  i      * resolution + 1);
        indices.push((j + 1) % resolution + (i + 1) * resolution + 1);
        indices.push( j                   + (i + 1) * resolution + 1);
      }
    }
    // bottom row
    for (var i = 0; i < resolution; i++) {
      indices.push( i                   + (resolution / 2 - 2) * resolution + 1);
      indices.push((i + 1) % resolution + (resolution / 2 - 2) * resolution + 1);
      indices.push(                       (resolution / 2 - 1) * resolution + 1);
    }
  }
  return new Shape(gl,
    {
      vertexBuffer: vertices,
      normalBuffer: normals,
      colorBuffer:  colors,
      indexBuffer:  indices
    },
    material
  );
}

function initAtmo(gl, level) {
  const size = Math.sqrt(level.terrainSizeX * level.terrainSizeX +
                         level.terrainSizeZ * level.terrainSizeZ) * 3;
  return initSphere(gl, size, 20, true, MATERIALS.ATMOSPHERE);
}