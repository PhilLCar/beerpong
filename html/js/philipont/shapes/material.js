const MATERIAL_DEFAULT = 0
const MATERIAL_GROUND  = 1;
const MATERIAL_WATER   = 2;
const MATERIAL_GRID    = 3;
const MATERIAL_ATMO    = 4;

const ATMO_TEXTURE_ID = getUniqueTextureID();
const MATERIALS = {
  DEFAULT: {
    TEXTURE:   null,
    AMBIANT:   0.2,
    DIFFUSE:   1.0,
    SPEC_SOFT: vec2.fromValues(0.5, 32.0),
    SPEC_HARD: vec2.fromValues(0.0, 32.0),
    TYPE:      MATERIAL_DEFAULT,
    TEXTYPE:   TEXTYPE_NONE,
    COLOR_PRESET : {
      R: { min: 0.5, max: 0.5, add: null },
      G: { min: 0.5, max: 0.5, add: null },
      B: { min: 0.5, max: 0.5, add: null },
      A: { min: 1.0, max: 1.0, add: null }
    }
  },
  GRID: {
    TEXTURE:   null,
    AMBIANT:   1.0,
    DIFFUSE:   0.0,
    SPEC_SOFT: vec2.fromValues(0.0, 32.0),
    SPEC_HARD: vec2.fromValues(0.0, 32.0),
    TYPE:      MATERIAL_GRID,
    TEXTYPE:   TEXTYPE_NONE,
    COLOR_PRESET : {
      R: { min: 0.5, max: 1.0, add: null },
      G: { min: 0.5, max: 1.0, add: null },
      B: { min: 0.5, max: 1.0, add: null },
      A: { min: 0.5, max: 0.7, add: null }
    },
    BACK: {
      R: 0.0,
      G: 0.0,
      B: 0.0,
      A: 0.2
    }
  },
  EARTH: {
    TEXTURE:   null,
    AMBIANT:   0.2,
    DIFFUSE:   1.0,
    SPEC_SOFT: vec2.fromValues(0.4, 64.0),
    SPEC_HARD: vec2.fromValues(0.0, 32.0),
    TYPE:      MATERIAL_GROUND,
    TEXTYPE:   TEXTYPE_NONE,
    COLOR_PRESET : {
      R: { min: 0,   max: 0.1, add: 0.8 },
      G: { min: 0.3, max: 0.7, add: 0.3 },
      B: { min: 0,   max: 0.2, add: 0   },
      A: { min: 1.0, max: 1.0, add: 0   }
    }
  },
  WATER: {
    TEXTURE:   null,
    AMBIANT:   0.2,
    DIFFUSE:   1.0,
    SPEC_SOFT: vec2.fromValues(0.5,  256.0),
    SPEC_HARD: vec2.fromValues(8.0, 4096.0),
    TYPE:      MATERIAL_WATER,
    TEXTYPE:   TEXTYPE_NONE,
    COLOR_PRESET: {
      R: { min: 0,     max: 0.0, add: null },
      G: { min: 0,     max: 0.2, add: null },
      B: { min: 0.6,   max: 0.8, add: null },
      A: { min: 0.8,   max: 0.8, add: null }
    }
  },
  ATMOSPHERE: {
    TEXTURE:   ATMO_TEXTURE_ID,
    AMBIANT:   1.0,
    DIFFUSE:   0.0,
    SPEC_SOFT: vec2.fromValues(0.0, 32.0),
    SPEC_HARD: vec2.fromValues(0.0, 32.0),
    TYPE:      MATERIAL_ATMO,
    TEXTYPE:   TEXTYPE_ATMO,
    TEXTURE_APPLY_FUNC: `
      highp float s = length(vPosition - vCenter);
      highp float r = acos((vPosition.y - vCenter.y) / s) / (PI / 2.0);
      highp vec2  p = normalize(vPosition.xz - vCenter.xz) * vec2(1.0, -1.0);
      FragColor = texture(uTextureMap[${ATMO_TEXTURE_ID - MAX_NUM_LIGHTS}], (r * p + vec2(1.0, 1.0)) / 2.0);`,
    COLOR_PRESET : {
      R: { min: 0.0, max: 0.0, add: null },
      G: { min: 0.0, max: 0.0, add: null },
      B: { min: 0.0, max: 0.0, add: null },
      A: { min: 1.0, max: 1.0, add: null }
    }
  }
};

const LIGHTS = {
  DEFAULT: {
    DIRECTIONAL: true,
    BASE_COLOR: vec3.fromValues(1.0, 1.0, 1.0),
    Y_COEFF:    vec3.fromValues(0.0, 0.0, 0.0),
  },
  SUN: {
    DIRECTIONAL: true,
    BASE_COLOR: vec3.fromValues(1.0, 1.0, 1.0),
    Y_COEFF:    vec3.fromValues(0.0, 0.6, 1.0),
  },
  MOON: {
    DIRECTIONAL: true,
    BASE_COLOR: vec3.fromValues(0.8, 0.8, 1.0),
    Y_COEFF:    vec3.fromValues(0.0, 0.3, 1.0),
  }
}