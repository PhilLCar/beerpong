#ifndef MATERIAL_H
#define MATERIAL_H

typedef struct material {
  double density;
  double price;
  double compression_max;
  double tension_max;
  double torsion_max;
  double compression_factor;
  double tension_factor;
  double torsion_factor;
} Material

#endif