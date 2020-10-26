#ifndef LEVEL_H
#define LEVEL_H

#include <material.h>
#include <vec3D.h>

#define SKIN_EARTH 0
#define SKIN_MARS  1
#define SKIN_MOON  2
#define SKIN_VENUS 3

#define NODE_ANCHOR 0
#define NODE_NORMAL 1
#define NODE_SELECT 2
#define NODE_BROKEN 3

#define NODE_MAX_LINK 32

typedef struct node {
  int          nlinks;
  int          type;
  Vec3D        position;
  Vec3D        speed;
  Vec3D        acceleration;
  struct link *links[NODE_MAX_LINK];
} Node;

typedef struct link {
  int          material;
  double       length;
  double       width;
  struct node *nodes[4];
} Link;

typedef struct level {
  // METADATA
  char   *name;
  int     lid;
  char   *designer;
  int     uid;
  char    auth[32];
  // TERRAIN
  double  waterLevel;
  double  terrainSizeX;
  double  terrainSizeZ;
  double  terrainRes;
  Vec3D  *terrain;
  // ROAD
  int     roadSegments;
  Vec3D  *road;
  // ENVIRONMENT
  int     skin;
  double  atmoDensity;
  double  humidity;
  double  windSpeed;
  Vec3D   windDirection;
  Vec3D   gravity;
  // BRIDGE
  int     nodes_size;
  int     nodes_cap;
  Node   *nodes;
  int     links_size;
  int     links_cap;
  Link   *links;
} Level;

int    newLevel(/*TODO: ARGS*/);
int    saveLevel(Level *level);
Level *loadLevel(int lid, int uid);
void   freeLevel(Level *level);

void addLink(Node *n1, Node *n2, int material);
void addLinkNode(Node *n, Vec3D *p, int material);

#endif