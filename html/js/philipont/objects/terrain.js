const PRESET_LUT = [
  "EARTH",
  "MARS",
  "MOON",
  "VENUS"
]

function initTerrain(scene, level) {
  const material = MATERIALS[PRESET_LUT[level.skin]];
  const nX       = Math.floor(level.terrainSizeX / level.terrainRes);
  const nZ       = Math.floor(level.terrainSizeZ / level.terrainRes);
  const nX1      = nX + 1;
  const terrainVertices = [];
  const terrainNormals  = [];
  const terrainColors   = [];
  const terrainIndices  = [];
  const terrainPosition = [];
  const terrainObjType  = [];
  const terrain         = level.terrain;
  for (var i = 0; i < nX; i++) {
    for (var j = 0; j < nZ; j++) {
      /////////////////////////////////////////////////
      {
        const v1 = terrain[i +     j      * nX1];
        const v2 = terrain[i +    (j + 1) * nX1];
        const v3 = terrain[i + 1 + j      * nX1];
        // top left
        terrainVertices.push(v1[0]);
        terrainVertices.push(v1[1]);
        terrainVertices.push(v1[2]);
        // bottom left
        terrainVertices.push(v2[0]);
        terrainVertices.push(v2[1]);
        terrainVertices.push(v2[2]);
        // top right
        terrainVertices.push(v3[0]);
        terrainVertices.push(v3[1]);
        terrainVertices.push(v3[2]);
        // normal
        const a1   = vec3.create();
        const a2   = vec3.create();
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
        const v1 = terrain[i + 1 +  j      * nX1];
        const v2 = terrain[i +     (j + 1) * nX1];
        const v3 = terrain[i + 1 + (j + 1) * nX1];
        // top left
        terrainVertices.push(v1[0]);
        terrainVertices.push(v1[1]);
        terrainVertices.push(v1[2]);
        // bottom left
        terrainVertices.push(v2[0]);
        terrainVertices.push(v2[1]);
        terrainVertices.push(v2[2]);
        // top right
        terrainVertices.push(v3[0]);
        terrainVertices.push(v3[1]);
        terrainVertices.push(v3[2]);
        // normal
        const a1   = vec3.create();
        const a2   = vec3.create();
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
  for (var i = 0; i < 2 * nX * nZ; i++) {
    var R = Math.random() * (material.COLOR_PRESET.R.max - material.COLOR_PRESET.R.min) + material.COLOR_PRESET.R.min;
    var G = Math.random() * (material.COLOR_PRESET.G.max - material.COLOR_PRESET.G.min) + material.COLOR_PRESET.G.min;
    var B = Math.random() * (material.COLOR_PRESET.B.max - material.COLOR_PRESET.B.min) + material.COLOR_PRESET.B.min;
    var A = Math.random() * (material.COLOR_PRESET.A.max - material.COLOR_PRESET.A.min) + material.COLOR_PRESET.A.min;
    for (var j = 0; j < 3; j++) {
      terrainColors.push(R);
      terrainColors.push(G);
      terrainColors.push(B);
      terrainColors.push(A);
    }
  }
  for (var i = 0; i < 6 * nX * nZ; i++) {
    terrainIndices. push(i);
    terrainPosition.push(0);
    terrainPosition.push(0);
    terrainPosition.push(0);
    terrainObjType.push(material.TYPE);
  }
  // BORDERS
  for (var i = 0; i < nX; i++) {
    /////////////////////////////////////////////////
    {
      const v1 = terrain[i];
      const v2 = terrain[i + 1];
      const i1 = i * nZ * 6;
      terrainVertices.push(v1[0]);
      terrainVertices.push(v1[1]);
      terrainVertices.push(v1[2]);
      terrainVertices.push(v2[0]);
      terrainVertices.push(v2[1]);
      terrainVertices.push(v2[2]);
      terrainVertices.push(v1[0]);
      terrainVertices.push(-level.terrainSizeZ);
      terrainVertices.push(v1[2]);
      terrainVertices.push(v2[0]);
      terrainVertices.push(-level.terrainSizeZ);
      terrainVertices.push(v2[2]);
      terrainIndices.push(terrainVertices.length / 3 - 4);
      terrainIndices.push(terrainVertices.length / 3 - 3);
      terrainIndices.push(terrainVertices.length / 3 - 2);
      terrainIndices.push(terrainVertices.length / 3 - 3);
      terrainIndices.push(terrainVertices.length / 3 - 1);
      terrainIndices.push(terrainVertices.length / 3 - 2);
      for (var j = 0; j < 4; j++) {
        terrainNormals.push(0);
        terrainNormals.push(0);
        terrainNormals.push(-1);
        terrainColors.push(terrainColors[i1 * 4]);
        terrainColors.push(terrainColors[i1 * 4 + 1]);
        terrainColors.push(terrainColors[i1 * 4 + 2]);
        terrainColors.push(terrainColors[i1 * 4 + 3]);
        terrainPosition.push(0);
        terrainPosition.push(0);
        terrainPosition.push(0);
        terrainObjType.push(material.TYPE);
      }
    }
    /////////////////////////////////////////////////
    {
      const v1 = terrain[i     + nZ * nX1];
      const v2 = terrain[i + 1 + nZ * nX1];
      const i1 = (i * nZ + nZ - 1) * 6 + 4;
      terrainVertices.push(v1[0]);
      terrainVertices.push(v1[1]);
      terrainVertices.push(v1[2]);
      terrainVertices.push(v2[0]);
      terrainVertices.push(v2[1]);
      terrainVertices.push(v2[2]);
      terrainVertices.push(v1[0]);
      terrainVertices.push(-level.terrainSizeZ);
      terrainVertices.push(v1[2]);
      terrainVertices.push(v2[0]);
      terrainVertices.push(-level.terrainSizeZ);
      terrainVertices.push(v2[2]);
      terrainIndices.push(terrainVertices.length / 3 - 3);
      terrainIndices.push(terrainVertices.length / 3 - 4);
      terrainIndices.push(terrainVertices.length / 3 - 2);
      terrainIndices.push(terrainVertices.length / 3 - 3);
      terrainIndices.push(terrainVertices.length / 3 - 2);
      terrainIndices.push(terrainVertices.length / 3 - 1);
      for (var j = 0; j < 4; j++) {
        terrainNormals.push(0);
        terrainNormals.push(0);
        terrainNormals.push(1);
        terrainColors.push(terrainColors[i1 * 4]);
        terrainColors.push(terrainColors[i1 * 4 + 1]);
        terrainColors.push(terrainColors[i1 * 4 + 2]);
        terrainColors.push(terrainColors[i1 * 4 + 3]);
        terrainPosition.push(0);
        terrainPosition.push(0);
        terrainPosition.push(0);
        terrainObjType.push(material.TYPE);
      }
    }
  }
  for (var j = 0; j < nZ; j++) {
    /////////////////////////////////////////////////
    {
      const v1 = terrain[ j      * nX1];
      const v2 = terrain[(j + 1) * nX1];
      const i1 = j * 6;
      // 1
      terrainVertices.push(v1[0]);
      terrainVertices.push(v1[1]);
      terrainVertices.push(v1[2]);
      terrainVertices.push(v2[0]);
      terrainVertices.push(v2[1]);
      terrainVertices.push(v2[2]);
      terrainVertices.push(v1[0]);
      terrainVertices.push(-level.terrainSizeZ);
      terrainVertices.push(v1[2]);
      terrainVertices.push(v2[0]);
      terrainVertices.push(-level.terrainSizeZ);
      terrainVertices.push(v2[2]);
      terrainIndices.push(terrainVertices.length / 3 - 3);
      terrainIndices.push(terrainVertices.length / 3 - 4);
      terrainIndices.push(terrainVertices.length / 3 - 2);
      terrainIndices.push(terrainVertices.length / 3 - 3);
      terrainIndices.push(terrainVertices.length / 3 - 2);
      terrainIndices.push(terrainVertices.length / 3 - 1);
      for (var i = 0; i < 4; i++) {
        terrainNormals.push(-1);
        terrainNormals.push(0);
        terrainNormals.push(0);
        terrainColors.push(terrainColors[i1 * 4]);
        terrainColors.push(terrainColors[i1 * 4 + 1]);
        terrainColors.push(terrainColors[i1 * 4 + 2]);
        terrainColors.push(terrainColors[i1 * 4 + 3]);
        terrainPosition.push(0);
        terrainPosition.push(0);
        terrainPosition.push(0);
        terrainObjType.push(material.TYPE);
      }
    }
    /////////////////////////////////////////////////
    {
      const v1 = terrain[nX +  j      * nX1];
      const v2 = terrain[nX + (j + 1) * nX1];
      const i1 = ((nX - 1) * nZ + j) * 6 + 5;
      // 1
      terrainVertices.push(v1[0]);
      terrainVertices.push(v1[1]);
      terrainVertices.push(v1[2]);
      terrainVertices.push(v2[0]);
      terrainVertices.push(v2[1]);
      terrainVertices.push(v2[2]);
      terrainVertices.push(v1[0]);
      terrainVertices.push(-level.terrainSizeZ);
      terrainVertices.push(v1[2]);
      terrainVertices.push(v2[0]);
      terrainVertices.push(-level.terrainSizeZ);
      terrainVertices.push(v2[2]);
      terrainIndices.push(terrainVertices.length / 3 - 4);
      terrainIndices.push(terrainVertices.length / 3 - 3);
      terrainIndices.push(terrainVertices.length / 3 - 2);
      terrainIndices.push(terrainVertices.length / 3 - 3);
      terrainIndices.push(terrainVertices.length / 3 - 1);
      terrainIndices.push(terrainVertices.length / 3 - 2);
      for (var i = 0; i < 4; i++) {
        terrainNormals.push(1);
        terrainNormals.push(0);
        terrainNormals.push(0);
        terrainColors.push(terrainColors[i1 * 4]);
        terrainColors.push(terrainColors[i1 * 4 + 1]);
        terrainColors.push(terrainColors[i1 * 4 + 2]);
        terrainColors.push(terrainColors[i1 * 4 + 3]);
        terrainPosition.push(0);
        terrainPosition.push(0);
        terrainPosition.push(0);
        terrainObjType.push(material.TYPE);
      }
    }
  }
  const shape = new Shape(scene, { 
    vertexBuffer:   terrainVertices, 
    indexBuffer:    terrainIndices, 
    normalBuffer:   terrainNormals,
    colorBuffer:    terrainColors,
    positionBuffer: terrainPosition,
    objTypeBuffer:  terrainObjType
  }, false);
  shape.nX       = nX;
  shape.nX1      = nX1;
  shape.nZ       = nZ;
  shape.nZ1      = nZ + 1;
  shape.level    = level;
  shape.prevmr   = null;
  shape.colorRef = terrainColors;
  shape.mouse    = null;
  shape.animate  = function(scene, t) {
    const nX       = shape.nX;
    const nZ       = shape.nZ;
    const nX1      = shape.nX1;
    const nZ1      = shape.nZ1;
    const terrain  = shape.level.terrain;
    const mouseray = scene.mouseray;
    const modArea  = scene.modArea;
    const colors   = shape.colorBuffer[0];
    const colorRef = shape.colorRef;

    if (mouseray !== null && mouseray != shape.prevmr) {
      shape.prevmr = mouseray;
      // MOD ENABLED
      ///////////////////////////////////////////////////////////////////////
      if (scene.modEnabled) {
        shape.mouse = null;
        for (var i = 0; i < nX; i++) {
          for (var j = 0; j < nZ; j++) {
            {
              const v1 = terrain[i +     j      * nX1];
              const v2 = terrain[i +    (j + 1) * nX1];
              const v3 = terrain[i + 1 + j      * nX1];
              const p = intersect(v1, v2, v3, mouseray);
              if (p !== null) {
                if (shape.mouse) {
                  const z1  = vec3.create();
                  const z2  = vec3.create();
                  vec3.transformMat4(z1, p, scene.modelViewMatrix);
                  vec3.transformMat4(z2, shape.mouse, scene.modelViewMatrix);
                  if (vec3.length(z1) < vec3.length(z2)) {
                    shape.mouse = p;
                  }
                } else {
                  shape.mouse = p;
                }
              }
            }
            {
              const v1 = terrain[i + 1 +  j      * nX1];
              const v2 = terrain[i +     (j + 1) * nX1];
              const v3 = terrain[i + 1 + (j + 1) * nX1];
              const p = intersect(v1, v2, v3, mouseray);
              if (p !== null) {
                if (shape.mouse) {
                  const z1  = vec3.create();
                  const z2  = vec3.create();
                  vec3.transformMat4(z1, p, scene.modelViewMatrix);
                  vec3.transformMat4(z2, shape.mouse, scene.modelViewMatrix);
                  if (vec3.length(z1) < vec3.length(z2)) {
                    shape.mouse = p;
                  }
                } else {
                  shape.mouse = p;
                }
              }
            }
          }
        }
        if (shape.mouse != null) {
          const mouse    = shape.mouse;
          for (var i = 0; i < nX; i++) {
            for (var j = 0; j < nZ; j++) {
              const index = (i * nZ + j) * 24;
              {
                const v1 = terrain[i +     j      * nX1];
                const v2 = terrain[i +    (j + 1) * nX1];
                const v3 = terrain[i + 1 + j      * nX1];
                const l1 = vec3.create();
                const l2 = vec3.create();
                const l3 = vec3.create();
                vec3.sub(l1, v1, mouse);
                vec3.sub(l2, v2, mouse);
                vec3.sub(l3, v3, mouse);
                if (vec3.length(l1) < modArea &&
                    vec3.length(l2) < modArea &&
                    vec3.length(l3) < modArea) {
                  for (var k = 0; k < 3; k++) {
                    colors[index + 4 * k]     = colorRef[index + 4 * k]     + material.COLOR_PRESET.R.add;
                    colors[index + 4 * k + 1] = colorRef[index + 4 * k + 1] + material.COLOR_PRESET.G.add;
                    colors[index + 4 * k + 2] = colorRef[index + 4 * k + 2] + material.COLOR_PRESET.B.add;
                    colors[index + 4 * k + 3] = colorRef[index + 4 * k + 3] + material.COLOR_PRESET.A.add;
                  }
                } else {
                  for (var k = 0; k < 3; k++) {
                    colors[index + 4 * k]     = colorRef[index + 4 * k];
                    colors[index + 4 * k + 1] = colorRef[index + 4 * k + 1];
                    colors[index + 4 * k + 2] = colorRef[index + 4 * k + 2];
                    colors[index + 4 * k + 3] = colorRef[index + 4 * k + 3];
                  }
                }
              }
              {
                const v1 = terrain[i + 1 +  j      * nX1];
                const v2 = terrain[i +     (j + 1) * nX1];
                const v3 = terrain[i + 1 + (j + 1) * nX1];
                const l1 = vec3.create();
                const l2 = vec3.create();
                const l3 = vec3.create();
                vec3.sub(l1, v1, mouse);
                vec3.sub(l2, v2, mouse);
                vec3.sub(l3, v3, mouse);
                if (vec3.length(l1) < modArea &&
                    vec3.length(l2) < modArea &&
                    vec3.length(l3) < modArea) {
                  for (var k = 0; k < 3; k++) {
                    colors[index + 4 * k + 12] = colorRef[index + 4 * k + 12] + material.COLOR_PRESET.R.add;
                    colors[index + 4 * k + 13] = colorRef[index + 4 * k + 13] + material.COLOR_PRESET.G.add;
                    colors[index + 4 * k + 14] = colorRef[index + 4 * k + 14] + material.COLOR_PRESET.B.add;
                    colors[index + 4 * k + 15] = colorRef[index + 4 * k + 15] + material.COLOR_PRESET.A.add;
                  }
                } else {
                  for (var k = 0; k < 3; k++) {
                    colors[index + 4 * k + 12] = colorRef[index + 4 * k + 12]
                    colors[index + 4 * k + 13] = colorRef[index + 4 * k + 13];
                    colors[index + 4 * k + 14] = colorRef[index + 4 * k + 14];
                    colors[index + 4 * k + 15] = colorRef[index + 4 * k + 15];
                  }
                }
              }
            }
          }
        } else {
          for (var i = 0; i < this.colorRef.length; i++) {
            colors[i] = colorRef[i];
          }
        }
      }
    }
    // MOD APPLY
    ///////////////////////////////////////////////////////////////////////
    if (scene.modEnabled && scene.modApply) {
      const vertices = shape.vertexBuffer[0];
      const normals  = shape.normalBuffer[0];
      if (shape.mouse !== null) {
        const mouse = shape.mouse;
        const d     = vec3.create();
        for (var i = 0; i < nX1; i++) {
          for (var j = 0; j < nZ1; j++) {
            const v = terrain[i + j * nX1];
            vec3.sub(d, v, mouse);
            const l = vec3.length(d);
            if (l < modArea) {
              if (scene.modSubstract) {
                vec3.sub(v, v, vec3.fromValues(0, (modArea - l) * 0.01, 0));
              } else {
                vec3.add(v, v, vec3.fromValues(0, (modArea - l) * 0.01, 0));
              }
              if (i == 0) {
                const i1 = 18 * nX * nZ + 24 * nX + 24 * j + 1;
                const i2 = i1 - 21;
                vertices[i1] = v[1];
                if (j > 0) vertices[i2] = v[1];
              } else if (i == nX) {
                const i1 = 18 * nX * nZ + 24 * nX + 24 * j + 13;
                const i2 = i1 - 21;
                vertices[i1] = v[1];
                if (j > 0) vertices[i2] = v[1];
              }
              if (j == 0) {
                const i1 = 18 * nX * nZ + 24 * i + 1;
                const i2 = i1 - 21;
                vertices[i1] = v[1];
                if (i > 0) vertices[i2] = v[1];
              } else if (j == nZ) {
                const i1 = 18 * nX * nZ + 24 * i + 13;
                const i2 = i1 - 21;
                vertices[i1] = v[1];
                if (i > 0) vertices[i2] = v[1];
              }
              if (i < nX && j < nZ) {
                const i1 = (i * nZ + j) * 18 + 1;
                vertices[i1] = v[1];
              }
              if (i > 0 && j < nZ) {
                const i2 = ((i - 1) * nZ + j) * 18 + 7;
                const i3 = i2 + 3;
                vertices[i2] = v[1];
                vertices[i3] = v[1];
              }
              if (i < nX && j > 0) {
                const i4 = (i * nZ + j - 1) * 18 + 4;
                const i5 = i4 + 9;
                vertices[i4] = v[1];
                vertices[i5] = v[1];
              }
              if (i > 0 && j > 0) {
                const i6 = ((i - 1) * nZ + j - 1) * 18 + 16;
                vertices[i6] = v[1];
              }
            }
          }
        }
        // Normals // Optimizable
        for (var i = 0; i < nX; i++) {
          for (var j = 0; j < nZ; j++) {
            const index = (i * nZ + j) * 18;
            {
              const v1 = terrain[i +     j      * nX1];
              const v2 = terrain[i +    (j + 1) * nX1];
              const v3 = terrain[i + 1 + j      * nX1];
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
              const v1 = terrain[i + 1 +  j      * nX1];
              const v2 = terrain[i +     (j + 1) * nX1];
              const v3 = terrain[i + 1 + (j + 1) * nX1];
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
    }
  }
  return shape;
}