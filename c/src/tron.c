#include <tron.h>
#include <websocket.h>
#include <pthread.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>

#define SLEEP_PERIOD_MS 300000

void *play(void *vargp) {
  Interface *interface = ((Interface**)vargp)[0];
  char      *id        = ((char**)vargp)[1];
  Grid      *grid      = malloc(sizeof(Grid));
  int prev_ptr;
  int newgame     = 1;
  int last_update = 0;
  int heads[8]    = { 0, 0, 0, 0, 0, 0, 0, 0 };
  int game_state;

  memset(grid, 0, sizeof(Grid));
  for (int i = 0; i < 4; i++) grid->id[i] = id[i];
  free(id);
  free(vargp);

  pthread_mutex_lock(&interface->lock);
  prev_ptr = interface->in_ptr;
  pthread_mutex_unlock(&interface->lock);

  while (1) {
    if (prev_ptr != interface->in_ptr) {
      pthread_mutex_lock(&interface->lock);
      int size = interface->in_ptr - prev_ptr;
      if (size < 0) size += COM_BUFFERS_SIZE;
      do {
        char  *in    = interface->in;
        short  s     = *(short*)&in[prev_ptr];
        if (s != 6) {
          size     -= s;
          prev_ptr += s;
          continue;
        }
        int   match = 1;
        for (int i = 0; i < 4; i++) {
          if (grid->id[i] != in[(prev_ptr + i) % COM_BUFFERS_SIZE]) {
            match = 0;
            break;
          }
        }
        prev_ptr += 4;
        grid->status[in[prev_ptr]].value = in[prev_ptr + 1];
        prev_ptr += 2;
        size -= 6;
        last_update = 0;
      } while (size > 0);
      if (prev_ptr != interface->in_ptr) {
        fprintf(stderr, "Fatal synchronization error! (input buffer)\n");
        exit(EXIT_FAILURE);
      }
      pthread_mutex_unlock(&interface->lock);
    }
    int ready    = 0;
    int reset    = 0;
    int nplayers = 0;
    for (int i = 0; i < 4; i++) {
      if (grid->status[i].value) {
        nplayers++;
        if (grid->status[i].approve) reset++;
        if (grid->status[i].ready)   ready++;
      }
    }
    if (nplayers) {
      if (reset || newgame == 1) {
        for (int i = 0; i < 4; i++) grid->status[i].approve = 0;
        newgame = 0;
        memset(grid->cell, 0, GRID_SIZE * GRID_SIZE * sizeof(char));
        game_state = GAME_WAIT;
      } else if (ready == nplayers && ready > 1) {
        for (int i = 0; i < 4; i++) grid->status[i].ready = 0;
        game_state = GAME_START;
      }
      if (game_state == GAME_WAIT) {
        if (grid->status[0].online) { grid->cell[8  +  8 * GRID_SIZE].value = 17; heads[0] =  8; heads[1] =  8; }
        if (grid->status[1].online) { grid->cell[23 + 23 * GRID_SIZE].value = 18; heads[2] = 23; heads[3] = 23; }
        if (grid->status[2].online) { grid->cell[8  + 23 * GRID_SIZE].value = 20; heads[4] =  8; heads[5] = 23; }
        if (grid->status[2].online) { grid->cell[23 +  8 * GRID_SIZE].value = 24; heads[6] = 23; heads[7] =  8; }
      } else if (game_state == GAME_START) {
        for (int i = 0; i < 4; i++) {
          if (!grid->status[i].dead) {
            grid->cell[heads[2 * i] + heads[2 * i + 1] * GRID_SIZE].value &= ~16;
            switch (grid->status[i].direction)
            {
            case DIR_UP:
              if (heads[2 * i + 1] > 0) heads[2 * i + 1]--;
              else grid->status[i].dead = 1;
              break;
            case DIR_DOWN:
              if (heads[2 * i + 1] < GRID_SIZE - 1) heads[2 * i + 1]++;
              else grid->status[i].dead = 1;
              break;
            case DIR_LEFT:
              if (heads[2 * i] > 0) heads[2 * i]--;
              else grid->status[i].dead = 1;
              break;
            case DIR_RIGHT:
              if (heads[2 * i] < GRID_SIZE - 1) heads[2 * i]++;
              else grid->status[i].dead = 1;
              break;
            }
            grid->cell[heads[2 * i] + heads[2 * i + 1] * GRID_SIZE].value |= 16 | (1 << i);
          }
        }
        for (int i = 0; i < 4; i++) {
          Cell cell = grid->cell[heads[2 * i] + heads[2 * i + 1] * GRID_SIZE];
          int  n    = 0;
          for (int j = 0; j < 4; j++) if (cell.value & (1 << j)) n++;
          if (n) grid->status[i].dead = 1;
        }
      }
    }
    pthread_mutex_lock(&interface->lock);
    int ptr = interface->out_ptr;
    *(short*)&interface->out[ptr] = (short)sizeof(Grid);
    ptr += sizeof(short);
    for (int i = 0; i < sizeof(Grid); i++) {
      interface->out[ptr] = ((char*)grid)[i];
      ptr = (ptr + 1) % COM_BUFFERS_SIZE;
    }
    interface->out_ptr = ptr;
    pthread_mutex_unlock(&interface->lock);
    if (last_update++ > NOUPDATE_MAX_CYCLE) {
      break;
    }
    usleep(SLEEP_PERIOD_MS);
  }
}