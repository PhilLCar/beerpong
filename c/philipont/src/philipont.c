#include <philipont.h>
#include <matrix.h>
#include <material.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>
#include <level.h>
#include <math.h>

size_t sizeOfLevel(Level *level) {
  // Metadata
  size_t size = sizeof(int);
  size += strlen(level->name) + 1;
  size += sizeof(level->lid);
  size += sizeof(int);
  size += strlen(level->designer) + 1;
  size += sizeof(level->uid);
  size += 32 * sizeof(char);
  // Terrain
  size += sizeof(level->waterLevel);
  size += sizeof(level->terrainSizeX);
  size += sizeof(level->terrainSizeZ);
  size += sizeof(level->terrainRes);
  size += floor(level->terrainSizeX / level->terrainRes) *
          floor(level->terrainSizeZ / level->terrainRes) *
          sizeof(Vec3D);
  // Road
  size += sizeof(level->roadSegments);
  size += 4 * level->roadSegments * sizeof(Vec3D);
  // Environment
  size += sizeof(level->skin);
  size += sizeof(level->atmoDensity);
  size += sizeof(level->windSpeed);
  size += sizeof(level->gravity);
  // Bridge
  //size += sizeof(level->nodes_size);
}

void sendLevelToInterface(Interface *interface, Level *level) {
  size_t bytes = sizeOfLevel(level);
}

void receiveLevelFromInterface(Interface *interface, Level *level) {

}

void *run(void *vargp) {

  return NULL;
}

void connect(Interface *interface) {
  int nsims   = 0;
  int running = 1;
  int prev_ptr;
  pthread_t    sims[PHILIPONT_MAX_SIMS];
  unsigned int ids[PHILIPONT_MAX_SIMS];
  memset(&sims, 0, PHILIPONT_MAX_SIMS * sizeof(pthread_t));
  memset(&ids,  0, PHILIPONT_MAX_SIMS * sizeof(unsigned int));

  pthread_mutex_lock(&interface->in_lock);
  prev_ptr = interface->in_ptr;
  pthread_mutex_unlock(&interface->in_lock);
  
  while (running) {
    if (prev_ptr != interface->in_ptr) {
      pthread_mutex_lock(&interface->in_lock);
      int size = interface->in_ptr - prev_ptr;
      if (size < 0) size += COM_BUFFERS_SIZE;
      do {
        unsigned int   id;
        unsigned char *in = interface->in;
        int   p  = -1;
        short s;
        mempull(&s, interface, &prev_ptr, sizeof(short));
        // skip uid
        prev_ptr = (prev_ptr + sizeof(int)) % COM_BUFFERS_SIZE;
        size    -= s;
        if (s != 4 + sizeof(short) + sizeof(int)) {
          prev_ptr = (prev_ptr + s - sizeof(short) - sizeof(int)) % COM_BUFFERS_SIZE;
          continue;
        }
        mempull(&id, interface, &prev_ptr, 4);
        for (int i = 0; i < PHILIPONT_MAX_SIMS; i++) {
          if (!ids[i] && !sims[i]) p = i;
          if (ids[i] == id) {
            p = -1;
            break;
          }
        }
        if (p >= 0) ids[p] = id;
      } while (size > 0);
      if (prev_ptr != interface->in_ptr) {
        fprintf(stderr, "Fatal synchronization error! (input buffer: dispatcher)\n");
        exit(EXIT_FAILURE);
      }
      pthread_mutex_unlock(&interface->in_lock);
    }
    for (int i = 0; i < PHILIPONT_MAX_SIMS; i++) {
      if (ids[i] && !sims[i]) {
        void *vargp = malloc(2 * sizeof(void*));
        ((Interface**)vargp)[0]    = interface;
        ((unsigned int**)vargp)[1] = &ids[i];
        pthread_create(&sims[i], NULL, run, vargp);
        nsims++;
      } else if (!ids[i] && sims[i]) {
        pthread_join(sims[i], NULL);
        sims[i] = 0;
        running = --nsims;
      }
    }
    usleep(WS_CHECK_PREIOD_MS);
  }
}