#include <world.h>
#include <matrix.h>
#include <material.h>

typedef struct link {
  int       id;
  Material *material;
  double    ulength;
  double    slength;
  double    stress;
  double    weight;
} Link;

Link  *links   = NULL;
int    lsize   = 0;
int    lcap    = 0;
Node  *nodes   = NULL;
int    nsize   = 0;
int    ncap    = 0;
Vec3D  GRAVITY = { 0, -9.82, 0 };

void connect(Interface *interface) {
  
}