const MATERIAL_GROUND = 0;
const MATERIAL_WATER  = 1;
const MATERIAL_GRID   = 2;
const MATERIAL_ATMO   = 3;

const COLOR_PRESETS = {
  EARTH: {
    R: { min: 0,   max: 0.1, add: 0.8 },
    G: { min: 0.3, max: 0.7, add: 0.3 },
    B: { min: 0,   max: 0.2, add: 0   },
    A: { min: 1.0, max: 1.0, add: 0   }
  },
  WATER: {
   R: { min: 0,     max: 0.0 },
   G: { min: 0,     max: 0.2 },
   B: { min: 0.6,   max: 0.8 },
   B: { min: 0.8,   max: 0.8 }
  }
};

class Solid {
  
}