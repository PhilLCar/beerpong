#ifndef WORLD_H
#define WORLD_H

#include <vec3D.h>
#include <websocket.h>

#define NODE_ANCHOR 0
#define NODE_NORMAL 1
#define NODE_SELECT 2

typedef struct node {
  int          id;
  int          type;
  Vec3D        position;
  Vec3D        speed;
  Vec3D        acceleration;
  struct link *links;
} Node;

void connect(Interface *interface);
void addLink(Node *n1, Node *n2, int material);
void addLinkNode(Node *n, Vec3D *p, int material);

#endif