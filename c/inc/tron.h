#ifndef TRON_H
#define TRON_H

#include <websocket.h>

#define GRID_SIZE 32

#define DIR_UP     0
#define DIR_DOWN   1
#define DIR_LEFT   2
#define DIR_RIGHT  3

#define GAME_WAIT  0
#define GAME_START 1
#define GAME_DONE  2

#define UPDATE_STANDARD 0
#define UPDATE_FULL     1
#define UPDATE_ASSIGN   2

#define NOUPDATE_MAX_CYCLE 1000

#define TRON_MAX_GAMES  8
#define TRON_MULTICAST -1

#pragma pack(push, 1)
typedef struct status {
  union {
    char value;
    struct {
      unsigned int online    : 1;
      unsigned int ready     : 1;
      unsigned int playing   : 1;
      unsigned int dead      : 1;
      unsigned int direction : 2;
      unsigned int approve   : 1;
    };
  };
} Status;
#pragma pack(pop)

#pragma pack(push, 1)
typedef struct cell {
  union {
    char value;
    struct {
      unsigned int player : 4;
      unsigned int head   : 1;
    };
  };
} Cell;
#pragma pack(pop)

#pragma pack(push, 1)
typedef struct grid {
  Status status[4];
  Cell   cell[GRID_SIZE * GRID_SIZE];
} Grid;
#pragma pack(pop)

void tron(Interface*);

#endif