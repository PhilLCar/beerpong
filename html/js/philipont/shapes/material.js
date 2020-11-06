const MATERIAL_DEFAULT = 0
const MATERIAL_GROUND  = 1;
const MATERIAL_WATER   = 2;
const MATERIAL_GRID    = 3;
const MATERIAL_ATMO    = 4;

const MATERIALS = {
  DEFAULT: {
    TEXTURE:   null,
    AMBIANT:   vec3.fromValues(0.2, 0.2, 0.2),
    DIFFUSE:   vec3.fromValues(1.0, 1.0, 1.0),
    SPEC_SOFT: vec2.fromValues(0.5, 32.0),
    SPEC_HARD: vec2.fromValues(0.0, 32.0),
    TYPE:      MATERIAL_GROUND,
    COLOR_PRESET : {
      R: { min: 0.5, max: 0.5, add: null },
      G: { min: 0.5, max: 0.5, add: null },
      B: { min: 0.5, max: 0.5, add: null },
      A: { min: 1.0, max: 1.0, add: null }
    }
  },
  EARTH: {
    TEXTURE:   null,
    AMBIANT:   vec3.fromValues(0.2, 0.2, 0.2),
    DIFFUSE:   vec3.fromValues(1.0, 1.0, 1.0),
    SPEC_SOFT: vec2.fromValues(0.4, 64.0),
    SPEC_HARD: vec2.fromValues(0.0, 32.0),
    TYPE:      MATERIAL_GROUND,
    COLOR_PRESET : {
      R: { min: 0,   max: 0.1, add: 0.8 },
      G: { min: 0.3, max: 0.7, add: 0.3 },
      B: { min: 0,   max: 0.2, add: 0   },
      A: { min: 1.0, max: 1.0, add: 0   }
    }
  },
  WATER: {
    TEXTURE:   null,
    AMBIANT:   vec3.fromValues(0.2, 0.2, 0.2),
    DIFFUSE:   vec3.fromValues(1.0, 1.0, 1.0),
    SPEC_SOFT: vec2.fromValues(0.5,  256.0),
    SPEC_HARD: vec2.fromValues(8.0, 4096.0),
    TYPE:      MATERIAL_GROUND,
    COLOR_PRESET: {
      R: { min: 0,     max: 0.0, add: null },
      G: { min: 0,     max: 0.2, add: null },
      B: { min: 0.6,   max: 0.8, add: null },
      B: { min: 0.8,   max: 0.8, add: null }
    }
  },
  ATMOSPHERE: {
    TEXTURE:   null,
    AMBIANT:   vec3.fromValues(0.2, 0.2, 0.2),
    DIFFUSE:   vec3.fromValues(1.0, 1.0, 1.0),
    SPEC_SOFT: vec2.fromValues(0.5, 32.0),
    SPEC_HARD: vec2.fromValues(0.0, 32.0),
    TYPE:      MATERIAL_GROUND,
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