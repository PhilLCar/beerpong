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

Level *newLevel(int lid, int uid, char *name, char *designer) {
  Level *level = malloc(sizeof(Level));

}

void initTerrain(Level *level, double waterLevel, double terrainSizeX, double terrainSizeZ, double terrainRes) {
  int nX = floor(terrainSizeX / terrainRes);
  int nZ = floor(terrainSizeZ / terrainRes);

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

void initBridge() {

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
  write(file, buffer, sizeof(int));
  *(int*)buffer = level->uid;
  write(file, buffer, sizeof(int));
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
    int nX     = floor(level->terrainSizeX / level->terrainRes);
    int nZ     = floor(level->terrainSizeZ / level->terrainRes);
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
  *(int*)buffer = level->nodes_size;
  write(file, buffer, sizeof(int));
  for (int i = 0; i < level->nodes_size; i++) {
    size_t size = sizeof(Node) - (NODE_MAX_LINK - level->nodes[i].nlinks) * sizeof(Link*);
    *(Node*)buffer = level->nodes[i];
    write(file, buffer, size);
  }
  // BRIDGE LINKS
  *(int*)buffer = level->links_size;
  write(file, buffer, sizeof(int));
  for (int i = 0; i < level->links_size; i++) {
    ((Link*)buffer)[i] = level->links[i];
  }
  write(file, buffer, level->links_size * sizeof(Link));
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
  read(file, buffer, sizeof(int));
  level->lid = *(int*)buffer;
  read(file, buffer, sizeof(int));
  level->uid = *(int*)buffer;
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
    int nX     = floor(level->terrainSizeX / level->terrainRes);
    int nZ     = floor(level->terrainSizeZ / level->terrainRes);
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
  read(file, buffer, sizeof(int));
  level->nodes_size = *(int*)buffer;
  for (level->nodes_cap = 256; level->nodes_cap < level->nodes_size; level->nodes_cap <<= 1);
  level->nodes = malloc(level->nodes_cap * sizeof(Node));
  for (int i = 0; i < level->nodes_size; i++) {
    size_t size;
    read(file, buffer, sizeof(int));
    level->nodes[i].nlinks = *(int*)buffer;
    size = sizeof(Node) - (NODE_MAX_LINK - level->nodes[i].nlinks) * sizeof(Link*) - sizeof(int);
    read(file, buffer, size);
    memset((char*)&level->nodes[i].links, 0, NODE_MAX_LINK * sizeof(Link*));
    memcpy((char*)&level->nodes[i] + sizeof(int), buffer, size);
  }
  // BRIDGE LINKS
  read(file, buffer, sizeof(int));
  level->links_size = *(int*)buffer;
  for (level->links_cap = 256; level->links_cap < level->links_size; level->links_cap <<= 1);
  level->links = malloc(level->links_cap * sizeof(Link));
  read(file, buffer, level->links_size * sizeof(Link));
  for (int i = 0; i < level->links_size; i++) {
    level->links[i] = ((Link*)buffer)[i];
  }
  close(file);
  return 0;
}

void freeLevel(Level *level) {
  free(level->name);
  free(level->designer);
  free(level->terrain);
  free(level->road);
  free(level->nodes);
  free(level->links);
  free(level);
}