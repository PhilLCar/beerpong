#include <level.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <stdint.h>
#include <math.h>
#include <stdlib.h>

const size_t  BUFFER_SIZE = 1 << 16;
const char   *SAVE_PATH   = "./philipont/levels/";
const Env     PRESETS[4] = {
  // Earth
  { 1.2, 0.5, { 10, 0, 10 }, { 0, -9.82, 0 } },
  // Earth
  { 1.2, 0.5, { 10, 0, 10 }, { 0, -9.82, 0 } },
  // Earth
  { 1.2, 0.5, { 10, 0, 10 }, { 0, -9.82, 0 } },
  // Earth
  { 1.2, 0.5, { 10, 0, 10 }, { 0, -9.82, 0 } }
};

Level *newLevel(unsigned int lid, unsigned int uid, char *name, char *designer) {
  Level *level = malloc(sizeof(Level));
  level->lid = lid;
  level->uid = uid;
  level->name     = malloc((strlen(name)     + 1) * sizeof(char));
  level->designer = malloc((strlen(designer) + 1) * sizeof(char));
  strcpy(level->name,     name);
  strcpy(level->designer, designer);
  return level;
}

void initTerrain(Level *level, double waterLevel, double terrainSizeX, double terrainSizeZ, double terrainRes) {
  int nX = floor(terrainSizeX / terrainRes) + 1;
  int nZ = floor(terrainSizeZ / terrainRes) + 1;

  level->waterLevel   = waterLevel;
  level->terrainSizeX = terrainSizeX;
  level->terrainSizeZ = terrainSizeZ;
  level->terrainRes   = terrainRes;
  level->terrain      = malloc(nX * nZ * sizeof(Vec3D));

  for (int i = 0; i < nX; i++) {
    for (int j = 0; j < nZ; j++) {
      int X = ((double)i - (double)nX / 2.0) / (double)nX * terrainSizeX;
      int Z = ((double)j - (double)nZ / 2.0) / (double)nZ * terrainSizeZ;
      level->terrain[i + j * nX] = V3D(X, 0, Z);
    }
  }
}

void initRoad(Level *level, int roadSegments) {
  level->roadSegments = roadSegments;
  level->road         = malloc(roadSegments * 4 * sizeof(Vec3D));
}

void initEnvironment(Level *level, int preset) {
  level->skin          = preset;
  level->atmoDensity   = PRESETS[preset].atmoDensity;
  level->humidity      = PRESETS[preset].humidity;
  level->windSpeed     = PRESETS[preset].windSpeed;;
  level->gravity       = PRESETS[preset].gravity;;
}

void initBridge(Level *level) {
  level->nodes = newList(sizeof(Node));
  level->links = newList(sizeof(Link));
}

int saveLevel(Level *level, char auth[32]) {
  char buffer[BUFFER_SIZE];
  char filename[256];
  char backupname[256];
  int  file;
  for (int i = 0; i < 32; i++) {
    if (level->auth[i] != auth[i]) {
      fprintf(stderr, "Can't save due to bad credentials!\n");
      return -1;
    }
  }
  sprintf(filename,   "%s%08X%08X.lvl", SAVE_PATH, level->lid, level->uid);
  sprintf(backupname, "%s.bak", filename);

  if (access(backupname, F_OK)) {
    if (remove(backupname)) {
      fprintf(stderr, "Couldn't erase backup file! Saving aborted...\n");
      return -2;
    }
  }
  if (access(filename, F_OK)) {
    if (rename(filename, backupname)) {
      fprintf(stderr, "Couldn't create backup file! Saving aborted...\n");
      return -3;
    }
  }
  file = open(filename, O_WRONLY | O_CREAT);
  if (file < 0) {
    fprintf(stderr, "Couldn't create save file! Saving aborted...\n");
    return -4;
  }
  // Wanted for the file to have a fixed size, but it'll have to be platform dependant
  // Not suuuper safe, (if the server were to be migrated) but can't avoid
  // since no fixed-size float standard...
  // That goes for ints and other structs as well, so #pragma pack isn't necessary
  *(int*)buffer = level->lid;
  write(file, buffer, sizeof(unsigned int));
  *(int*)buffer = level->uid;
  write(file, buffer, sizeof(unsigned int));
  write(file, level->auth, 32);
  memset(buffer, 0, 256);
  strcpy(buffer, level->name);
  write(file, buffer, 256);
  memset(buffer, 0, 256);
  strcpy(buffer, level->designer);
  write(file, buffer, 256);
  *(double*)buffer = level->waterLevel;
  write(file, buffer, sizeof(double));
  *(double*)buffer = level->terrainSizeX;
  write(file, buffer, sizeof(double));
  *(double*)buffer = level->terrainSizeZ;
  write(file, buffer, sizeof(double));
  *(double*)buffer = level->terrainRes;
  write(file, buffer, sizeof(double));
  { // TERRAIN
    int nX     = floor(level->terrainSizeX / level->terrainRes) + 1;
    int nZ     = floor(level->terrainSizeZ / level->terrainRes) + 1;
    int offset = 0;
    for (int j = 0; j < nZ; j++) {
      for (int i = 0; i < nX; i++) {
        int index = i + j * nX;
        if ((index - offset + 1) * sizeof(Vec3D) > BUFFER_SIZE) {
          write(file, buffer, (index - offset) * sizeof(Vec3D));
          offset = index;
        }
        ((Vec3D*)buffer)[index - offset] = level->terrain[index];
      }
    }
    write(file, buffer, (nX * nZ - offset) * sizeof(Vec3D));
  } { // ROAD
    *(int*)buffer = level->roadSegments;
    write(file, buffer, sizeof(int));
    for (int i = 0; i < level->roadSegments * 4; i++) {
      ((Vec3D*)buffer)[i] = level->road[i];
    }
    write(file, buffer, level->roadSegments * 4 * sizeof(Vec3D));
  } // ENVIRONMENT
  *(int*)buffer = level->skin;
  write(file, buffer, sizeof(int));
  *(double*)buffer = level->atmoDensity;
  write(file, buffer, sizeof(double));
  *(double*)buffer = level->humidity;
  write(file, buffer, sizeof(double));
  *(Vec3D*)buffer = level->windSpeed;
  write(file, buffer, sizeof(Vec3D));
  *(Vec3D*)buffer = level->gravity;
  write(file, buffer, sizeof(Vec3D));
  // BRIDGE NODES
  {
    int i = 0;
    int sizeOfNodeWOLinks = sizeof(Node) - NODE_MAX_LINK * sizeof(Link*);
    *(int*)buffer = sizeOf(level->nodes);
    write(file, buffer, sizeof(int));
    for (List *l = level->nodes->next; l; l = l->next) {
      Node *n = l->content;
      int bytes = sizeOfNodeWOLinks + n->nlinks * sizeof(int);
      if (i + bytes > BUFFER_SIZE) {
        write(file, buffer, i);
        i = 0;
      }
      memcpy(&buffer[i], n, sizeOfNodeWOLinks);
      for (int j = 0; j < n->nlinks; j++) {
        int index = i + sizeOfNodeWOLinks + j * sizeof(int);
        *(int*)&buffer[index] = indexOf(level->links, n->links[j]);
      }
      i += bytes;
    }
    write(file, buffer, i);
  }
  // BRIDGE LINKS
  {
    int i = 0;
    int sizeOfLinkWONodes = sizeof(Link) - LINK_MAX_NODE * sizeof(Node*);
    *(int*)buffer = sizeOf(level->links);
    write(file, buffer, sizeof(int));
    for (List *l = level->links->next; l; l = l->next) {
      Link *n = l->content;
      if (i + sizeof(Link) > BUFFER_SIZE) {
        write(file, buffer, i);
        i = 0;
      }
      memcpy(&buffer[i], n, sizeOfLinkWONodes);
      for (int j = 0; j < LINK_MAX_NODE; j++) {
        int index = i + sizeOfLinkWONodes + j * sizeof(int);
        if (n->nodes[j]) *(int*)&buffer[index] = indexOf(level->nodes, n->nodes[j]);
        else             *(int*)&buffer[index] = -1;
      }
      i += sizeof(Link);
    }
    write(file, buffer, i);
  }
  close(file);
  return 0;
}

Level *loadLevel(int lid, int uid) {
  char   buffer[BUFFER_SIZE];
  char   filename[256];
  int    file;
  Level *level;

  sprintf(filename, "%s%08X%08X.lvl", SAVE_PATH, lid, uid);
  file = open(filename, O_RDONLY);
  if (file < 0) {
    fprintf(stderr, "Couldn't load the requested level!\n");
    return NULL;
  }

  level = malloc(sizeof(Level));
  read(file, buffer, sizeof(unsigned int));
  level->lid = *(unsigned int*)buffer;
  read(file, buffer, sizeof(unsigned int));
  level->uid = *(unsigned int*)buffer;
  read(file, level->auth, 32);
  read(file, buffer, 256);
  level->name = malloc(strlen(buffer) * sizeof(char));
  strcpy(level->name, buffer);
  read(file, buffer, 256);
  level->designer = malloc(strlen(buffer) * sizeof(char));
  strcpy(level->designer, buffer);
  read(file, buffer, sizeof(double));
  level->waterLevel = *(double*)buffer;
  read(file, buffer, sizeof(double));
  level->terrainSizeX = *(double*)buffer;
  read(file, buffer, sizeof(double));
  level->terrainSizeZ = *(double*)buffer;
  read(file, buffer, sizeof(double));
  level->terrainRes = *(double*)buffer;
  { // TERRAIN
    int nX     = floor(level->terrainSizeX / level->terrainRes) + 1;
    int nZ     = floor(level->terrainSizeZ / level->terrainRes) + 1;
    int index  = 0;
    int bytes  = nX * nZ;
    level->terrain = malloc(bytes * sizeof(Vec3D));
    do {
      int pass = bytes * sizeof(Vec3D) < BUFFER_SIZE ? bytes : BUFFER_SIZE / sizeof(Vec3D);
      read(file, buffer, pass * sizeof(Vec3D));
      for (int i = 0; i < pass; i++) {
        level->terrain[index++] = ((Vec3D*)buffer)[i];
      }
      bytes -= pass;
    } while (bytes);
  } { // ROAD
    read(file, buffer, sizeof(int));
    level->roadSegments = *(int*)buffer;
    read(file, buffer, level->roadSegments * 4 * sizeof(Vec3D));
    level->road = malloc(level->roadSegments * 4 * sizeof(Vec3D));
    for (int i = 0; i < level->roadSegments * 4; i++) {
      level->road[i] = ((Vec3D*)buffer)[i];
    }
  } // ENVIRONEMENT
  read(file, buffer, sizeof(int));
  level->skin = *(int*)buffer;
  read(file, buffer, sizeof(double));
  level->atmoDensity = *(double*)buffer;
  read(file, buffer, sizeof(double));
  level->humidity = *(double*)buffer;
  read(file, buffer, sizeof(Vec3D));
  level->windSpeed = *(Vec3D*)buffer;
  read(file, buffer, sizeof(Vec3D));
  level->gravity = *(Vec3D*)buffer;
  // BRIDGE NODES
  {
    int size;
    int sizeOfNodeWOLinks = sizeof(Node) - NODE_MAX_LINK * sizeof(Link*);
    level->nodes = newList(sizeof(Node));
    read(file, buffer, sizeof(int));
    size = *(int*)buffer;
    for (int i = 0; i < size; i++) {
      read(file, buffer, sizeOfNodeWOLinks);
      read(file, &buffer[sizeOfNodeWOLinks], ((Node*)buffer)->nlinks * sizeof(int));
      push(level->nodes, buffer);
    }
    for (List *l = level->nodes->next; l; l = l->next) {
      int   indices[NODE_MAX_LINK];
      Node *n = l->content;
      memcpy(indices, n->links, NODE_MAX_LINK * sizeof(int));
      for (int i = 0; i < n->nlinks; i++) {
        n->links[i] = at(level->nodes, indices[i]);
      }
    }
  }
  // BRIDGE LINKS
  {
    int size;
    int sizeOfLinkWONodes = sizeof(Link) - LINK_MAX_NODE * sizeof(Node*);
    level->links = newList(sizeof(Link));
    read(file, buffer, sizeof(int));
    size = *(int*)buffer;
    for (int i = 0; i < size; i++) {
      read(file, buffer, sizeOfLinkWONodes + LINK_MAX_NODE * sizeof(int));
      push(level->links, buffer);
    }
    for (List *l = level->links->next; l; l = l->next) {
      int   indices[LINK_MAX_NODE];
      Link *n = l->content;
      memcpy(indices, n->nodes, LINK_MAX_NODE * sizeof(int));
      for (int i = 0; i < LINK_MAX_NODE; i++) {
        n->nodes[i] = at(level->links, indices[i]);
      }
    }
  }
  close(file);
  return 0;
}

void freeLevel(Level *level) {
  free(level->name);
  free(level->designer);
  free(level->terrain);
  free(level->road);
  deleteList(&level->nodes);
  deleteList(&level->links);
  free(level);
}