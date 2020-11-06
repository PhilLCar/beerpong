const PRESET_LUT = [
  "EARTH",
  "MARS",
  "MOON",
  "VENUS"
]

function initTerrain(gl, level) {
  const preset = MATERIALS[PRESET_LUT[level.skin]];
  const nX = Math.floor(level.terrainSizeX / level.terrainRes);
  const nZ = Math.floor(level.terrainSizeZ / level.terrainRes);
  const nX1 = nX + 1;
  const nZ1 = nZ + 1;
  const terrainVertices = [];
  const terrainNormals  = [];
  const terrainColors   = [];
  const terrainIndices  = [];
  for (var i = 0; i < nX; i++) {
    for (var j = 0; j < nZ; j++) {
      /////////////////////////////////////////////////
      {
        const v1 = level.terrain[i +     j      * nX1];
        const v2 = level.terrain[i +    (j + 1) * nX1];
        const v3 = level.terrain[i + 1 + j      * nX1];
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
        const v1 = level.terrain[i + 1 +  j      * nX1];
        const v2 = level.terrain[i +     (j + 1) * nX1];
        const v3 = level.terrain[i + 1 + (j + 1) * nX1];
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
    var R = Math.random() * (preset.COLOR_PRESET.R.max - preset.COLOR_PRESET.R.min) + preset.COLOR_PRESET.R.min;
    var G = Math.random() * (preset.COLOR_PRESET.G.max - preset.COLOR_PRESET.G.min) + preset.COLOR_PRESET.G.min;
    var B = Math.random() * (preset.COLOR_PRESET.B.max - preset.COLOR_PRESET.B.min) + preset.COLOR_PRESET.B.min;
    var A = Math.random() * (preset.COLOR_PRESET.A.max - preset.COLOR_PRESET.A.min) + preset.COLOR_PRESET.A.min;
    for (var j = 0; j < 3; j++) {
      terrainColors.push(R);
      terrainColors.push(G);
      terrainColors.push(B);
      terrainColors.push(A);
    }
  }
  for (var i = 0; i < 6 * nX * nZ; i++) {
    terrainIndices.push(i);
  }
  const shape = new Shape(
    gl,
    { 
      vertexBuffer: terrainVertices, 
      indexBuffer:  terrainIndices, 
      normalBuffer: terrainNormals,
      colorBuffer:  terrainColors
    },
    preset
  );
  shape.nX     = nX;
  shape.nX1    = nX1;
  shape.nZ     = nZ;
  shape.nZ1    = nZ1;
  shape.level  = level;
  shape.prevmr = null;
  shape.prototype.animate = function(scene, t) {
    const nX       = this.nX;
    const nZ       = this.nZ;
    const nX1      = this.nX1;
    const nZ1      = this.nZ1;
    const terrain  = this.level.terrain;
    const mouseray = scene.mouseray;
    const modArea  = scene.modArea;
    const modApply = scene.modApply;
    var   mouse    = null;

    if (mouseray === null || mouseray == this.prevmr) return;
    this.prevmr = mouseray;

    // MOD ENABLED
    ///////////////////////////////////////////////////////////////////////
    if (scene.modEnabled) {
      for (var i = 0; i < nX; i++) {
        for (var j = 0; j < nZ; j++) {
          {
            const v1 = terrain[i +     j      * nX1];
            const v2 = terrain[i +    (j + 1) * nX1];
            const v3 = terrain[i + 1 + j      * nX1];
            const p = intersect(v1, v2, v3, mouseray);
            if (p !== null) {
              mouse = p;
              i = this.nX;
              j = this.nZ;
              break;
            }
          }
          {
            const v1 =terrain[i + 1 +  j      * nX1];
            const v2 =terrain[i +     (j + 1) * nX1];
            const v3 =terrain[i + 1 + (j + 1) * nX1];
            const p = intersect(v1, v2, v3, mouseray);
            if (p !== null) {
              mouse = p;
              i = this.nX;
              j = this.nZ;
              break;
            }
          }
        }
      }
      if (mouse != null) {
        for (var i = 0; i < nX; i++) {
          for (var j = 0; j < nZ; j++) {
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
                  this.colors[(i * nZ + j) * 24 + 4 * k]     += this.preset.R.add;
                  this.colors[(i * nZ + j) * 24 + 4 * k + 1] += this.preset.G.add;
                  this.colors[(i * nZ + j) * 24 + 4 * k + 2] += this.preset.B.add;
                  this.colors[(i * nZ + j) * 24 + 4 * k + 3] += this.preset.A.add;
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
                  this.colors[(i * nZ + j) * 24 + 4 * k + 12] += this.preset.R.add;
                  this.colors[(i * nZ + j) * 24 + 4 * k + 13] += this.preset.G.add;
                  this.colors[(i * nZ + j) * 24 + 4 * k + 14] += this.preset.B.add;
                  this.colors[(i * nZ + j) * 24 + 4 * k + 15] += this.preset.A.add;
                }
              }
            }
          }
        }
      }
    }
    // MOD APPLY
    ///////////////////////////////////////////////////////////////////////
    if (scene.modEnabled && scene.modApply) {
      if (mouse !== null) {
        const d = vec3.create();
        for (var i = 0; i < nX1; i++) {
          for (var j = 0; j < nZ1; j++) {
            var v = terrain[i + j * nX1];
            var l;
            vec3.sub(d, v, mouse);
            l = vec3.length(d);
            if (l < modArea) {
              if (scene.modSubstract) {
                vec3.sub(v, v, vec3.fromValues(0, (modArea - l) * 0.01, 0));
              } else {
                vec3.add(v, v, vec3.fromValues(0, (modArea - l) * 0.01, 0));
              }
              // todo index projections!!
            }
          }
        }
      }
    }
  }
  return shape;
}