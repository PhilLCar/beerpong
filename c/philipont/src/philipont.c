#include <philipont.h>
#include <vec3D.h>
#include <material.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>
#include <level.h>
#include <math.h>
#include <list.h>

#define PHILIPONT_MAX_SIMS 2
#define PHILIPONT_MAGIC_ID 2

#define CMD_IDENT        0x0F
#define CMD_NEW_LEVEL    0x00
#define CMD_LOAD_LEVEL   0x01
#define CMD_SAVE_LEVEL   0x02
#define CMD_UPDATE_LEVEL 0x03
#define CMD_SIMULATE     0x10
#define CMD_PLAY         0x11
#define CMD_PAUSE        0x12
#define CMD_SPEED        0x13

#define ACK_IDENT        0xFF
#define ACK_NEW_LEVEL    0xF0

#define TERRAIN_MAX_V 65536

void writeout(Interface *interface, Level *level, int client, int *start_ptr, short *bytes) {
  *(short*)&interface->out[*start_ptr] = -*bytes;
  pthread_mutex_unlock(&interface->out_lock);
  usleep(WS_CHECK_PERIOD_US << 2); // Give the time to the interface to publish
  pthread_mutex_lock(&interface->out_lock);
  *bytes = 0;
  *start_ptr = interface->out_ptr;
  interface->out_ptr = interface->out_ptr + sizeof(short) % COM_BUFFERS_SIZE;
  mempush(interface, &client,     sizeof(int));
  *bytes += sizeof(short) + sizeof(int);
}

void sendLevelToInterface(Interface *interface, Level *level, int client, char ack) {
  short writtenBytes = 0;
  pthread_mutex_lock(&interface->out_lock);
  {
    int           start_ptr = interface->out_ptr;
    unsigned char length;
    int           nX, nZ;
    interface->out_ptr = interface->out_ptr + sizeof(short) % COM_BUFFERS_SIZE;
    mempush(interface, &client,     sizeof(int));
    mempush(interface, &ack,        sizeof(char));
    writtenBytes += sizeof(short) + sizeof(int) + sizeof(char);
    // Metadata
    mempush(interface, &level->lid, sizeof(int));
    mempush(interface, &level->uid, sizeof(int));
    writtenBytes += 2 * sizeof(int);
    length = sizeof(Node) - NODE_MAX_LINK * sizeof(Link*);
    mempush(interface, &length, 1);
    length = sizeof(Link) - LINK_MAX_NODE * sizeof(Node*);
    mempush(interface, &length, 1);
    writtenBytes += 2;
    length = strlen(level->name);
    mempush(interface, &length, sizeof(unsigned char));
    mempush(interface, level->name, length);
    writtenBytes += length + sizeof(unsigned char);
    length = strlen(level->designer);
    mempush(interface, &length, sizeof(unsigned char));
    mempush(interface, level->designer, length);
    writtenBytes += length + sizeof(unsigned char);
    mempush(interface, level->auth, 32);
    writtenBytes += 32;
    // Terrain
    mempush(interface, &level->waterLevel,   sizeof(double));
    mempush(interface, &level->terrainSizeX, sizeof(double));
    mempush(interface, &level->terrainSizeZ, sizeof(double));
    mempush(interface, &level->terrainRes,   sizeof(double));
    writtenBytes += 4 * sizeof(double);
    nX = floor(level->terrainSizeX / level->terrainRes) + 1;
    nZ = floor(level->terrainSizeZ / level->terrainRes) + 1;
    for (int i = 0; i < nX * nZ; i++) {
      if (writtenBytes + sizeof(Vec3D) > COM_BUFFERS_SIZE >> 3) {
        writeout(interface, level, client, &start_ptr, &writtenBytes);
      }
      mempush(interface, &level->terrain[i], sizeof(Vec3D));
      writtenBytes += sizeof(Vec3D);
    }
    // Road
    mempush(interface, &level->roadSegments, sizeof(int));
    writtenBytes += sizeof(int);
    for (int i = 0; i < 4 * level->roadSegments; i++) {
      if (writtenBytes + sizeof(Vec3D) > COM_BUFFERS_SIZE >> 3) {
        writeout(interface, level, client, &start_ptr, &writtenBytes);
      }
      mempush(interface, &level->road[i], sizeof(Vec3D));
      writtenBytes += sizeof(Vec3D);
    }
    // Environement
    mempush(interface, &level->skin,        sizeof(int));
    mempush(interface, &level->atmoDensity, sizeof(double));
    mempush(interface, &level->humidity,    sizeof(double));
    mempush(interface, &level->windSpeed,   sizeof(Vec3D));
    mempush(interface, &level->gravity,     sizeof(Vec3D));
    writtenBytes += sizeof(int) + 2 * sizeof(double) + 2 * sizeof(Vec3D);
    // Bridge nodes
    {
      short size              = sizeOf(level->nodes);
      int   sizeOfNodeWOLinks = sizeof(Node) - NODE_MAX_LINK * sizeof(Link*);
      mempush(interface, &size, sizeof(short));
      writtenBytes += sizeof(short);
      for (List *l = level->nodes->next; l; l = l->next) {
        Node *n = l->content;
        int bytes = sizeOfNodeWOLinks + n->nlinks * sizeof(short);
        if (writtenBytes + bytes > COM_BUFFERS_SIZE >> 3) {
          writeout(interface, level, client, &start_ptr, &writtenBytes);
        }
        mempush(interface, &n, sizeOfNodeWOLinks);
        for (int i = 0; i < n->nlinks; i++) {
          short index = indexOf(level->links, n->links[i]);
          mempush(interface, &index, sizeof(short));
        }
        writtenBytes += bytes;
      }
    }
    // Bridge links
    {
      short size               = sizeOf(level->links);
      int   sizeOfLinksWONodes = sizeof(Link) - LINK_MAX_NODE * sizeof(Node*);
      mempush(interface, &size, sizeof(short));
      writtenBytes += sizeof(short);
      for (List *l = level->nodes->next; l; l = l->next) {
        Link *n = l->content;
        int bytes = sizeof(Link) + LINK_MAX_NODE * sizeof(short);
        if (writtenBytes + bytes > COM_BUFFERS_SIZE >> 3) {
          writeout(interface, level, client, &start_ptr, &writtenBytes);
        }
        mempush(interface, &n, sizeOfLinksWONodes);
        for (int i = 0; i < LINK_MAX_NODE; i++) {
          short index = indexOf(level->nodes, n->nodes[i]);
          mempush(interface, &index, sizeof(short));
        }
        writtenBytes += bytes;
      }
    }
    *(short*)&interface->out[start_ptr] = writtenBytes;
  }
  pthread_mutex_unlock(&interface->out_lock);
}

void receiveLevelFromInterface(Interface *interface, Level *level) {

}

void *run(void *vargp) {
  Interface    *interface = ((Interface**)vargp)[0];
  int          *cid       = ((int**)vargp)[1];
  unsigned int  uid;
  char          auth[32];
  int           prev_ptr;
  int           running  = 1;
  List         *commands = newList(sizeof(char));
  Level        *level;
  free(vargp);

  pthread_mutex_lock(&interface->in_lock);
  prev_ptr = interface->in_ptr;
  pthread_mutex_unlock(&interface->in_lock);

  printf("######## User connected #########\n");

  while (running) {
    if (prev_ptr != interface->in_ptr) {
      pthread_mutex_lock(&interface->in_lock);
      int size = interface->in_ptr - prev_ptr;
      if (size < 0) size += COM_BUFFERS_SIZE;
      do {
        int           tcid;
        short         s;
        unsigned char cmd;
        mempull(&s,   interface,  &prev_ptr, sizeof(short));
        mempull(&tcid, interface, &prev_ptr, sizeof(int));
        size    -= s;
        if (*cid != tcid) {
          prev_ptr = (prev_ptr + s - sizeof(short) - sizeof(int)) % COM_BUFFERS_SIZE;
          continue;
        }
        mempull(&cmd,  interface, &prev_ptr, sizeof(char));
        switch (cmd) {
          case CMD_IDENT:
            mempull(&uid,  interface, &prev_ptr, sizeof(unsigned int));
            mempull(&auth, interface, &prev_ptr, 32);
            break;
          case CMD_NEW_LEVEL:
            {
              unsigned int lid;
              char         length;
              char         name[256]     = { 0 };
              char         designer[256] = { 0 };
              double       terrainX;
              double       terrainZ;
              double       terrainRes;
              mempull(&lid,        interface, &prev_ptr, sizeof(unsigned int));
              mempull(&length,     interface, &prev_ptr, sizeof(char));
              mempull(name,        interface, &prev_ptr, length);
              mempull(&length,     interface, &prev_ptr, sizeof(char));
              mempull(designer,    interface, &prev_ptr, length);
              mempull(&terrainX,   interface, &prev_ptr, sizeof(double));
              mempull(&terrainZ,   interface, &prev_ptr, sizeof(double));
              mempull(&terrainRes, interface, &prev_ptr, sizeof(double));
              if ((floor(terrainX / terrainRes) + 1) * (floor(terrainZ / terrainZ) + 1) <= TERRAIN_MAX_V) {
                level = newLevel(lid, uid, name, designer);
                initTerrain(level, -1.0, terrainX, terrainZ, terrainRes);
                initRoad(level, 0);
                initEnvironment(level, SKIN_EARTH);
                initBridge(level);
              }
            }
            break;
          default:
            break;
        }
        push(commands, &cmd);
      } while (size > 0);
      if (prev_ptr != interface->in_ptr) {
        fprintf(stderr, "Fatal synchronization error! (input buffer: philipont)\n");
        exit(EXIT_FAILURE);
      }
      pthread_mutex_unlock(&interface->in_lock);
    }
    while (commands->next) {
      char *t = removeAt(commands, 0);
      char cmd = *t; free(t);
      switch (cmd) {
        case CMD_IDENT:
          pthread_mutex_lock(&interface->out_lock);
          short size = sizeof(short) + sizeof(int) + sizeof(char);
          char  ack  = ACK_IDENT;
          mempush(interface, &size, sizeof(short));
          mempush(interface,  cid,  sizeof(int));
          mempush(interface, &ack,  sizeof(char));
          pthread_mutex_unlock(&interface->out_lock);
          break;
        case CMD_NEW_LEVEL:
          sendLevelToInterface(interface, level, *cid, ACK_NEW_LEVEL);
          break;
        default:
          break;
      }
    }
    usleep(WS_CHECK_PERIOD_US);
  }

  deleteList(&commands);
  *cid = -1;
  printf("######## User disconnected #########\n");
  return NULL;
}

void philipont(Interface *interface) {
  int nsims   = 0;
  int running = 1;
  int prev_ptr;
  pthread_t sims[PHILIPONT_MAX_SIMS];
  int       cids[PHILIPONT_MAX_SIMS];
  memset(&sims,  0, PHILIPONT_MAX_SIMS * sizeof(pthread_t));
  memset(&cids, -1, PHILIPONT_MAX_SIMS * sizeof(int));

  pthread_mutex_lock(&interface->in_lock);
  prev_ptr = interface->in_ptr;
  pthread_mutex_unlock(&interface->in_lock);
  
  while (running) {
    if (prev_ptr != interface->in_ptr) {
      pthread_mutex_lock(&interface->in_lock);
      int size = interface->in_ptr - prev_ptr;
      if (size < 0) size += COM_BUFFERS_SIZE;
      do {
        int   cid;
        int   p  = -1;
        short s;
        char  b;
        mempull(&s,   interface, &prev_ptr, sizeof(short));
        mempull(&cid, interface, &prev_ptr, sizeof(int));
        size    -= s;
        if (s != sizeof(short) + sizeof(int) + sizeof(char)) {
          prev_ptr = (prev_ptr + s - sizeof(short) - sizeof(int)) % COM_BUFFERS_SIZE;
          continue;
        }
        mempull(&b, interface, &prev_ptr, sizeof(char));
        if (b != PHILIPONT_MAGIC_ID) continue;
        for (int i = 0; i < PHILIPONT_MAX_SIMS; i++) {
          if (cids[i] < 0 && !sims[i]) p = i;
          if (cids[i] == cid) {
            p = -1;
            break;
          }
        }
        if (p >= 0) {
          cids[p] = cid;
        }
      } while (size > 0);
      if (prev_ptr != interface->in_ptr) {
        fprintf(stderr, "Fatal synchronization error! (input buffer: philipont dispatcher)\n");
        exit(EXIT_FAILURE);
      }
      pthread_mutex_unlock(&interface->in_lock);
    }
    for (int i = 0; i < PHILIPONT_MAX_SIMS; i++) {
      if (cids[i] >= 0 && !sims[i]) {
        void **vargp = malloc(2 * sizeof(void*));
        vargp[0] = interface;
        vargp[1] = &cids[i];
        pthread_create(&sims[i], NULL, run, vargp);
        nsims++;
      } else if (cids[i] < 0 && sims[i]) {
        pthread_join(sims[i], NULL);
        sims[i] = 0;
        running = --nsims;
      }
    }
    usleep(WS_CHECK_PERIOD_US);
  }
}