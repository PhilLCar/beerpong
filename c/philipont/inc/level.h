#ifndef LEVEL_H
#define LEVEL_H

#include <material.h>
#include <vec3D.h>
#include <list.h>

#define SKIN_EARTH 0
#define SKIN_MARS  1
#define SKIN_MOON  2
#define SKIN_VENUS 3

#define NODE_ANCHOR 0
#define NODE_NORMAL 1
#define NODE_SELECT 2
#define NODE_BROKEN 3

#define NODE_MAX_LINK 32
#define LINK_MAX_NODE  4

typedef struct node {
  int          id;
  int          type;
  int          nlinks;
  Vec3D        position;
  Vec3D        speed;
  Vec3D        acceleration;
  struct link *links[NODE_MAX_LINK];
} Node;

typedef struct link {
  int          id;
  int          material;
  double       length;
  double       width;
  struct node *nodes[LINK_MAX_NODE];
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
  Vec3D   windSpeed;
  Vec3D   gravity;
  // BRIDGE
  List   *nodes;
  List   *links;
} Level;

typedef struct env {
  double  atmoDensity;
  double  humidity;
  Vec3D   windSpeed;
  Vec3D   gravity;
} Env;

extern const Env PRESETS[4];

Level *newLevel(int lid, int uid, char *name, char *designer);
void   initTerrain(Level *level, double waterLevel, double terrainSizeX, double terrainSizeZ, double terrainRes);
void   initRoad(Level *level, int roadSegments);
void   initEnvironment(Level *level, int preset);
void   initBridge(Level *level);
int    saveLevel(Level *level, char auth[32]);
Level *loadLevel(int lid, int uid);
void   freeLevel(Level *level);

void addLink(Node *n1, Node *n2, int material);
void addLinkNode(Node *n, Vec3D *p, int material);

#endif