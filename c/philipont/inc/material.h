#ifndef MATERIAL_H
#define MATERIAL_H

#define WOOD              0
#define WOODEN_DECK       1
#define STEEL             2
#define STEEL_DECK        3
#define HEAVY_STEEL       4
#define HEAVY_STEEL_DECK  5
#define CONCRETE          6
#define CONCRETE_DECK     7
#define ROPE              8
#define CABLE             9
#define SUSP_CABLE       10
#define EXT_HYDRAULIC    11
#define SHR_HYDRAULIC    12
#define SPRING           13
#define MATERIAL_SLOT1   14
#define MATERIAL_SLOT2   15

typedef struct material {
  double density;
  double thickness;
  double price;
  double compression_max;
  double tension_max;
  double torsion_max;
  double compression_factor;
  double tension_factor;
  double torsion_factor;
  double max_length;
  double max_subunit;
} Material;

extern const Material materials[16];

#endif