#include <tron.h>
#include <pthread.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>

#define SLEEP_PERIOD_MS 300000

void *play(void *vargp) {
  Interface    *interface = ((Interface**)vargp)[0];
  unsigned int *id        = ((int**)vargp)[1];
  Grid         *grid      = malloc(sizeof(Grid));
  int  prev_ptr;
  int  newgame     = 1;
  int  last_update = 0;
  char heads[8];
  char cells[5];
  int  game_state = GAME_WAIT;
  char utypes[WS_MAX_CONN];
  char vals[WS_MAX_CONN];
  int  uids[WS_MAX_CONN];
  int  nuid = 0;

  memset(grid, 0, sizeof(Grid));
  printf("######## Created new game #########\n");
  printf("Game ID: ");
  for (int i = 0; i < 4; i++) printf("%c", ((char*)id)[i]);
  printf("\n");
  free(vargp);

  pthread_mutex_lock(&interface->in_lock);
  prev_ptr = interface->in_ptr;
  pthread_mutex_unlock(&interface->in_lock);

  while (1) {
    memset(uids,   0, WS_MAX_CONN * sizeof(int));
    memset(utypes, 0, WS_MAX_CONN * sizeof(char));
    memset(vals,   0, WS_MAX_CONN * sizeof(char));
    nuid = 0;
    if (prev_ptr != interface->in_ptr) {
      pthread_mutex_lock(&interface->in_lock);
      int size = interface->in_ptr - prev_ptr;
      if (size < 0) size += COM_BUFFERS_SIZE;
      do {
        char *in = interface->in;
        unsigned char c;
        unsigned int  gid;
        int           uid;
        short         s;
        for (int i = 0; i < sizeof(short); i++) {
          ((char*)&s)[i] = in[prev_ptr];
          prev_ptr = (prev_ptr + 1) % COM_BUFFERS_SIZE;
        }
        size -= s;
        for (int i = 0; i < sizeof(int); i++) {
          ((char*)&uid)[i] = in[prev_ptr];
          prev_ptr = (prev_ptr + 1) % COM_BUFFERS_SIZE;
        }
        for (int i = 0; i < 4; i++) {
          ((char*)&gid)[i] = in[prev_ptr];
          prev_ptr = (prev_ptr + 1) % COM_BUFFERS_SIZE;
        }
        if (s != (sizeof(short) + sizeof(int) + 6) || *id != gid) {
          prev_ptr = (prev_ptr + s - sizeof(short) - sizeof(int) - 4) % COM_BUFFERS_SIZE;
          continue;
        }
        c = in[prev_ptr];
        if (c == 0xFF) {
          for (int i = 0; i < 4; i++) {
            if (!grid->status[i].value) {
              grid->status[i].online = 1;
              c = (unsigned char)i;
              break;
            }
          }
          uids[nuid]    = uid;
          utypes[nuid] |= UPDATE_ASSIGN;
          vals[nuid] = c;
          if (game_state != GAME_WAIT) utypes[nuid] |= UPDATE_FULL;
          nuid++;
        } else if (c < 4) {
          grid->status[c].value = in[(prev_ptr + 1) % COM_BUFFERS_SIZE];
        }
        prev_ptr = (prev_ptr + 2) % COM_BUFFERS_SIZE;
        last_update = 0;
      } while (size > 0);
      if (prev_ptr != interface->in_ptr) {
        fprintf(stderr, "Fatal synchronization error! (input buffer: tron)\n");
        exit(EXIT_FAILURE);
      }
      pthread_mutex_unlock(&interface->in_lock);
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
      if (reset == nplayers || newgame == 1) {
        for (int i = 0; i < 4; i++) grid->status[i].approve = 0;
        newgame = 0;
        memset(grid->cell, 0, GRID_SIZE * GRID_SIZE * sizeof(char));
        memset(heads, 0, 8 * sizeof(char));
        memset(cells, 0, 5 * sizeof(char));
        game_state = GAME_WAIT;
      } else if (ready == nplayers && ready > 1) {
        for (int i = 0; i < 4; i++) {
          grid->status[i].ready   = 0;
          grid->status[i].playing = 1;
        }
        game_state = GAME_START;
      }
      if (game_state == GAME_WAIT) {
        if (grid->status[0].online) { grid->cell[8  +  8 * GRID_SIZE].value = 17; heads[0] =  8; heads[1] =  8; }
        if (grid->status[1].online) { grid->cell[23 + 23 * GRID_SIZE].value = 18; heads[2] = 23; heads[3] = 23; }
        if (grid->status[2].online) { grid->cell[8  + 23 * GRID_SIZE].value = 20; heads[4] =  8; heads[5] = 23; }
        if (grid->status[2].online) { grid->cell[23 +  8 * GRID_SIZE].value = 24; heads[6] = 23; heads[7] =  8; }
      } else if (game_state == GAME_START) {
        int nalive = 0;
        for (int i = 0; i < 4; i++) {
          if (!grid->status[i].dead && grid->status[i].playing) {
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
          cells[i] = cell.value;
          if (grid->status[i].playing && ! grid->status[i].dead) nalive++;
        }
        if (nalive < 2) game_state = GAME_DONE;
      }
    }
    pthread_mutex_lock(&interface->out_lock);
    int ptr        = interface->out_ptr;
    int u          = TRON_MULTICAST;
    int chunk_size = sizeof(short) + 2 * sizeof(int) + 13;
    for (int i = 0; i < sizeof(short); i++) {
      interface->out[ptr] = ((char*)&chunk_size)[i];
      ptr = (ptr + 1) % COM_BUFFERS_SIZE;
    }
    for (int i = 0; i < sizeof(int); i++) {
      interface->out[ptr] = ((char*)id)[i];
      ptr = (ptr + 1) % COM_BUFFERS_SIZE;
    }
    for (int i = 0; i < sizeof(int); i++) {
      interface->out[ptr] = ((char*)&u)[i];
      ptr = (ptr + 1) % COM_BUFFERS_SIZE;
    }
    interface->out[ptr] = 0xFF;
    ptr = (ptr + 1) % COM_BUFFERS_SIZE;
    for (int i = 0; i < 8; i++) {
      interface->out[ptr] = heads[i];
      ptr = (ptr + 1) % COM_BUFFERS_SIZE;
    }
    for (int i = 0; i < 4; i++) {
      interface->out[ptr] = cells[i];
      ptr = (ptr + 1) % COM_BUFFERS_SIZE;
    }
    for (int i = 0; i < WS_MAX_CONN; i++) {
      if (uids[i]) {
        if (utypes[i] & UPDATE_ASSIGN) {
          chunk_size = sizeof(short) + 2 * sizeof(int) + 2;
          for (int j = 0; j < sizeof(short); j++) {
            interface->out[ptr] = ((char*)&chunk_size)[j];
            ptr = (ptr + 1) % COM_BUFFERS_SIZE;
          }
          for (int j = 0; j < sizeof(int); j++) {
            interface->out[ptr] = ((char*)id)[j];
            ptr = (ptr + 1) % COM_BUFFERS_SIZE;
          }
          for (int j = 0; j < sizeof(int); j++) {
            interface->out[ptr] = ((char*)&uids[i])[j];
            ptr = (ptr + 1) % COM_BUFFERS_SIZE;
          }
          interface->out[ptr] = 0xFF;
          ptr = (ptr + 1) % COM_BUFFERS_SIZE;
          interface->out[ptr] = vals[i];
          ptr = (ptr + 1) % COM_BUFFERS_SIZE;
        }
        if (utypes[i] & UPDATE_FULL) {
          chunk_size = sizeof(short) + 2 * sizeof(int) + sizeof(Grid);
          for (int j = 0; j < sizeof(short); j++) {
            interface->out[ptr] = ((char*)&chunk_size)[j];
            ptr = (ptr + 1) % COM_BUFFERS_SIZE;
          }
          for (int j = 0; j < sizeof(int); j++) {
            interface->out[ptr] = ((char*)id)[j];
            ptr = (ptr + 1) % COM_BUFFERS_SIZE;
          }
          for (int j = 0; j < sizeof(int); j++) {
            interface->out[ptr] = ((char*)&uids[i])[j];
            ptr = (ptr + 1) % COM_BUFFERS_SIZE;
          }
          for (int j = 0; j < sizeof(Grid); j++) {
            interface->out[ptr] = ((char*)grid)[j];
            ptr = (ptr + 1) % COM_BUFFERS_SIZE;
          }
        }
      }
    }
    interface->out_ptr = ptr;
    pthread_mutex_unlock(&interface->out_lock);
    if (last_update++ > NOUPDATE_MAX_CYCLE) {
      break;
    }
    usleep(SLEEP_PERIOD_MS);
  }
  *id = 0;
  printf("######## Game ended #########\n");
}

void tron(Interface *interface) {
  int ngames  = 0;
  int playing = 1;
  int prev_ptr;
  pthread_t    games[TRON_MAX_GAMES];
  unsigned int ids[TRON_MAX_GAMES];
  memset(&games, 0, TRON_MAX_GAMES * sizeof(pthread_t));
  memset(&ids,   0, TRON_MAX_GAMES * sizeof(int));

  pthread_mutex_lock(&interface->in_lock);
  prev_ptr = interface->in_ptr;
  pthread_mutex_unlock(&interface->in_lock);
  
  while (playing) {
    if (prev_ptr != interface->in_ptr) {
      pthread_mutex_lock(&interface->in_lock);
      int size = interface->in_ptr - prev_ptr;
      if (size < 0) size += COM_BUFFERS_SIZE;
      do {
        unsigned int id;
        char  *in = interface->in;
        int    p  = -1;
        short  s;
        for (int i = 0; i < sizeof(short); i++) {
          ((char*)&s)[i] = in[prev_ptr];
          prev_ptr = (prev_ptr + 1) % COM_BUFFERS_SIZE;
        }
        // skip uid
        prev_ptr = (prev_ptr + sizeof(int)) % COM_BUFFERS_SIZE;
        size    -= s;
        if (s != 4 + sizeof(short) + sizeof(int)) {
          prev_ptr = (prev_ptr + s - sizeof(short) - sizeof(int)) % COM_BUFFERS_SIZE;
          continue;
        }
        for (int i = 0; i < 4; i++) {
          ((char*)&id)[i] = in[prev_ptr];
          prev_ptr = (prev_ptr + 1) % COM_BUFFERS_SIZE;
        }
        for (int i = 0; i < TRON_MAX_GAMES; i++) {
          if (!ids[i] && !games[i]) p = i;
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
    for (int i = 0; i < TRON_MAX_GAMES; i++) {
      if (ids[i] && !games[i]) {
        void *vargp = malloc(2 * sizeof(void*));
        ((Interface**)vargp)[0] = interface;
        ((int**)vargp)[1]       = &ids[i];
        pthread_create(&games[i], NULL, play, vargp);
        ngames++;
      } else if (!ids[i] && games[i]) {
        pthread_join(games[i], NULL);
        ngames--;
        playing = ngames;
      }
    }
    usleep(WS_CHECK_PREIOD_MS);
  }
}