#include <tron.h>
#include <pthread.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>

#define SLEEP_PERIOD_MS 150000

typedef struct dir {
  int dir;
  int n;
} Dir;

Dir paint(Grid *grid, int *lht, int x, int y, int def, int max) {
  int nu = 0, nd = 0, nl = 0, nr = 0, n = 0, c = 0;
  Dir ndir;
  ndir.dir = def;
  ndir.n   = 0;
  if ((!max && grid->cell[x + y * GRID_SIZE].value) ||
      x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return ndir;
  if (lht[x + y * GRID_SIZE]) { ndir.n = -1; return ndir; }
  lht[x + y * GRID_SIZE] = 1;
  if (def != DIR_DOWN)  nu = paint(grid, lht, x, y - 1, DIR_UP,    0).n;
  if (def != DIR_UP)    nd = paint(grid, lht, x, y + 1, DIR_DOWN,  0).n;
  if (def != DIR_RIGHT) nl = paint(grid, lht, x - 1, y, DIR_LEFT,  0).n;
  if (def != DIR_LEFT)  nr = paint(grid, lht, x + 1, y, DIR_RIGHT, 0).n;
  ndir.n = (nu < 0 ? 0 : nu) + (nd < 0 ? 0 : nd) + (nl < 0 ? 0 : nl) + (nr < 0 ? 0 : nr) + 1;
  if (max) {
    if (nu > n) { n = nu; ndir.dir = DIR_UP;    }
    if (nd > n) { n = nd; ndir.dir = DIR_DOWN;  }
    if (nl > n) { n = nl; ndir.dir = DIR_LEFT;  }
    if (nr > n) { n = nr; ndir.dir = DIR_RIGHT; }
    if (nu == n || nu == -1) c++;
    if (nd == n || nd == -1) c++;
    if (nl == n || nl == -1) c++;
    if (nr == n || nr == -1) c++;
    if (c == 3) {
      c = rand() % c;
      if (!nu || (!nd && c > 0) || (!nl && c > 1)) c++;
      ndir.dir = c;
    }
    memset(lht, 0, GRID_SIZE * GRID_SIZE * sizeof(int));
  }
  return ndir;
}

Dir pcalc(Grid *grid, int *lht, int x, int y, int def, int max) {
  Dir ndir;
  int nu, nd, nl, nr, n = 0, c = 0;
  ndir.dir = def;
  ndir.n   = 1;
  if (lht[x + y * GRID_SIZE] || (def < 0 && grid->cell[x + y * GRID_SIZE].value) ||
      x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return ndir;
  if (!max) { ndir.n = 2; return ndir; }
  lht[x + y * GRID_SIZE] = 1;
  nu = pcalc(grid, lht, x, y - 1, -1, max - 1).n;
  nd = pcalc(grid, lht, x, y + 1, -1, max - 1).n;
  nl = pcalc(grid, lht, x - 1, y, -1, max - 1).n;
  nr = pcalc(grid, lht, x + 1, y, -1, max - 1).n;
  lht[x + y * GRID_SIZE] = 0;
  ndir.n = nu + nd + nl + nr;
  if (def >= 0) {
    if (nu > n) { n = nu; ndir.dir = DIR_UP;    }
    if (nd > n) { n = nd; ndir.dir = DIR_DOWN;  }
    if (nl > n) { n = nl; ndir.dir = DIR_LEFT;  }
    if (nr > n) { n = nr; ndir.dir = DIR_RIGHT; }
    if (nu == n) c++;
    if (nd == n) c++;
    if (nl == n) c++;
    if (nr == n) c++;
    c = rand() % c;
    for (int i = 0; i <= c; i++) {
      if (nu-- == n) { if (i == c) ndir.dir = DIR_UP;    continue; }
      if (nd-- == n) { if (i == c) ndir.dir = DIR_DOWN;  continue; }
      if (nl-- == n) { if (i == c) ndir.dir = DIR_LEFT;  continue; }
      if (nr-- == n) { if (i == c) ndir.dir = DIR_RIGHT; continue; }
    }
  }
  return ndir;
}

void program(Grid *grid, int *lht, char *heads, int n, int max) {
  if ((grid->status[n].value & ~0x30) == grid->status[n].online) {
    grid->status[n].ready = 1;
  } else if (grid->status[n].done) {
    grid->status[n].approve = 1;
  } else if (grid->status[n].playing && !grid->status[n].dead) {
    if (max < 10) grid->status[n].direction = pcalc(grid, lht, heads[2 * n], heads[2 * n + 1], grid->status[n].direction, max).dir;
    else          grid->status[n].direction = paint(grid, lht, heads[2 * n], heads[2 * n + 1], grid->status[n].direction, 1).dir;
  }
}

void *play(void *vargp) {
  Interface    *interface = ((Interface**)vargp)[0];
  unsigned int *id        = ((unsigned int**)vargp)[1];
  Grid         *grid      = malloc(sizeof(Grid));
  int   prev_ptr;
  int   newgame     = 1;
  int   last_update = 0;
  char  heads[8];
  char  cells[4];
  char  prev[4];
  int   programs[4] = { 0, 0, 0, 0 };
  int  *lht = malloc(GRID_SIZE * GRID_SIZE * sizeof(int));
  int   game_state = GAME_WAIT;
  char  utypes[WS_MAX_CONN];
  char  vals[WS_MAX_CONN];
  int   uids[WS_MAX_CONN];
  int   nuid = 0;

  memset(grid, 0, sizeof(Grid));
  memset(lht,  0, GRID_SIZE * GRID_SIZE * sizeof(int));
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
        unsigned char *in = interface->in;
        unsigned char  c, p;
        unsigned int   gid;
        int            uid;
        short          s;
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
        p = in[(prev_ptr + 1) % COM_BUFFERS_SIZE];
        if (c == 0xFF) {
          for (int i = 0; i < 4; i++) {
            if (!grid->status[i].online) {
              grid->status[i].online = 1;
              c = (unsigned char)i;
              break;
            }
          }
          if (p == 0xFF) {
            uids[nuid]    = uid;
            utypes[nuid] |= UPDATE_ASSIGN;
            vals[nuid]    = c;
            if (game_state != GAME_WAIT) utypes[nuid] |= UPDATE_FULL;
            nuid++;
          } else if (c < 4) {
            programs[c] = p;
          }
        } else if (c < 4) {
          grid->status[c].value = p;
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
      if (programs[i]) program(grid, lht, heads, i, programs[i]);
      if (grid->status[i].value) {
        if (grid->status[i].online)  nplayers++;
        if (grid->status[i].approve) reset++;
        if (grid->status[i].ready)   ready++;
      }
    }
    if (nplayers) {
      if (reset == nplayers || newgame == 1) {
        for (int i = 0; i < 4; i++) grid->status[i].value = grid->status[i].online;
        newgame = 0;
        memset(grid->cell,  0, GRID_SIZE * GRID_SIZE * sizeof(char));
        memset(heads, 0xFF, 8 * sizeof(char));
        memset(cells, 0,    4 * sizeof(char));
        game_state = GAME_WAIT;
        grid->status[0].direction = DIR_RIGHT;
        grid->status[1].direction = DIR_LEFT;
        grid->status[2].direction = DIR_UP;
        grid->status[3].direction = DIR_DOWN;
      } else if (ready == nplayers && ready > 1) {
        for (int i = 0; i < 4; i++) {
          if (!grid->status[i].online) continue;
          grid->status[i].ready   = 0;
          grid->status[i].playing = 1;
        }
        game_state = GAME_START;
      }
      if (game_state == GAME_WAIT) {
        if (grid->status[0].online) { grid->cell[8  +  8 * GRID_SIZE].value = 17 | (programs[0] ? 0x20 : 0); heads[0] =  8; heads[1] =  8; }
        if (grid->status[1].online) { grid->cell[23 + 23 * GRID_SIZE].value = 18 | (programs[1] ? 0x20 : 0); heads[2] = 23; heads[3] = 23; }
        if (grid->status[2].online) { grid->cell[8  + 23 * GRID_SIZE].value = 20 | (programs[2] ? 0x20 : 0); heads[4] =  8; heads[5] = 23; }
        if (grid->status[3].online) { grid->cell[23 +  8 * GRID_SIZE].value = 24 | (programs[3] ? 0x20 : 0); heads[6] = 23; heads[7] =  8; }
        for (int i = 0; i < 4; i++) cells[i] = grid->cell[heads[2 * i] + heads[2 * i + 1] * GRID_SIZE].value;
      } else if (game_state == GAME_START) {
        int nalive = 0;
        for (int i = 0; i < 4; i++) {
          if (!grid->status[i].dead && grid->status[i].playing) {
            grid->cell[(int)heads[2 * i] + (int)heads[2 * i + 1] * GRID_SIZE].value &= ~16;
            switch (grid->status[i].direction)
            {
            case DIR_UP:
              if (heads[2 * i + 1] > 0 && prev[i] != DIR_DOWN) heads[2 * i + 1]--;
              else grid->status[i].dead = 1;
              break;
            case DIR_DOWN:
              if (heads[2 * i + 1] < GRID_SIZE - 1 && prev[i] != DIR_UP) heads[2 * i + 1]++;
              else grid->status[i].dead = 1;
              break;
            case DIR_LEFT:
              if (heads[2 * i] > 0 && prev[i] != DIR_RIGHT) heads[2 * i]--;
              else grid->status[i].dead = 1;
              break;
            case DIR_RIGHT:
              if (heads[2 * i] < GRID_SIZE - 1 && prev[i] != DIR_LEFT) heads[2 * i]++;
              else grid->status[i].dead = 1;
              break;
            }
            Cell *c = &grid->cell[(int)heads[2 * i] + (int)heads[2 * i + 1] * GRID_SIZE];
            if (c->value) grid->status[i].dead = 1;
            c->value |= 16 | (1 << i);
            c->program = programs[i] != 0;
          }
        }
        for (int i = 0; i < 4; i++) {
          if (!grid->status[i].dead && grid->status[i].playing) {
            Cell cell = grid->cell[heads[2 * i] + heads[2 * i + 1] * GRID_SIZE];
            int  n    = 0;
            for (int j = 0; j < 4; j++) if (cell.value & (1 << j)) n++;
            if (n > 1) grid->status[i].dead = 1;
            cells[i] = cell.value;
            nalive++;
          }
        }
        if (nalive < 2) game_state = GAME_DONE;
      }
      if (game_state == GAME_DONE) {
        for (int i = 0; i < 4; i++) {
          if (grid->status[i].online) {
            grid->status[i].done = 1;
          }
        }
      }
    }
    for (int i = 0; i < 4; i++) {
      prev[i] = grid->status[i].direction;
    }
    pthread_mutex_lock(&interface->out_lock);
    int ptr        = interface->out_ptr;
    int u          = TRON_MULTICAST;
    int chunk_size = sizeof(short) + 2 * sizeof(int) + 17;
    for (int i = 0; i < sizeof(short); i++) {
      interface->out[ptr] = ((char*)&chunk_size)[i];
      ptr = (ptr + 1) % COM_BUFFERS_SIZE;
    }
    for (int i = 0; i < sizeof(int); i++) {
      interface->out[ptr] = ((char*)&u)[i];
      ptr = (ptr + 1) % COM_BUFFERS_SIZE;
    }
    interface->out[ptr] = UPDATE_STANDARD;
    ptr = (ptr + 1) % COM_BUFFERS_SIZE;
    for (int i = 0; i < 4; i++) {
      interface->out[ptr] = grid->status[i].value;
      ptr = (ptr + 1) % COM_BUFFERS_SIZE;
    }
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
            interface->out[ptr] = ((char*)&uids[i])[j];
            ptr = (ptr + 1) % COM_BUFFERS_SIZE;
          }
          interface->out[ptr] = UPDATE_ASSIGN;
          ptr = (ptr + 1) % COM_BUFFERS_SIZE;
          interface->out[ptr] = vals[i];
          ptr = (ptr + 1) % COM_BUFFERS_SIZE;
        }
        if (utypes[i] & UPDATE_FULL) {
          chunk_size = sizeof(short) + 2 * sizeof(int) + sizeof(Grid) + 1;
          for (int j = 0; j < sizeof(short); j++) {
            interface->out[ptr] = ((char*)&chunk_size)[j];
            ptr = (ptr + 1) % COM_BUFFERS_SIZE;
          }
          for (int j = 0; j < sizeof(int); j++) {
            interface->out[ptr] = ((char*)&uids[i])[j];
            ptr = (ptr + 1) % COM_BUFFERS_SIZE;
          }
          interface->out[ptr] = UPDATE_FULL;
          ptr = (ptr + 1) % COM_BUFFERS_SIZE;
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
  free(lht);
  free(grid);
  printf("######## Game ended #########\n");
  return NULL;
}

void tron(Interface *interface) {
  int ngames  = 0;
  int playing = 1;
  int prev_ptr;
  pthread_t    games[TRON_MAX_GAMES];
  unsigned int ids[TRON_MAX_GAMES];
  memset(&games, 0, TRON_MAX_GAMES * sizeof(pthread_t));
  memset(&ids,   0, TRON_MAX_GAMES * sizeof(unsigned int));

  pthread_mutex_lock(&interface->in_lock);
  prev_ptr = interface->in_ptr;
  pthread_mutex_unlock(&interface->in_lock);
  
  while (playing) {
    if (prev_ptr != interface->in_ptr) {
      pthread_mutex_lock(&interface->in_lock);
      int size = interface->in_ptr - prev_ptr;
      if (size < 0) size += COM_BUFFERS_SIZE;
      do {
        unsigned int   id;
        unsigned char *in = interface->in;
        int   p  = -1;
        short s;
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
        fprintf(stderr, "Fatal synchronization error! (input buffer: tron dispatcher)\n");
        exit(EXIT_FAILURE);
      }
      pthread_mutex_unlock(&interface->in_lock);
    }
    for (int i = 0; i < TRON_MAX_GAMES; i++) {
      if (ids[i] && !games[i]) {
        void *vargp = malloc(2 * sizeof(void*));
        ((Interface**)vargp)[0]    = interface;
        ((unsigned int**)vargp)[1] = &ids[i];
        pthread_create(&games[i], NULL, play, vargp);
        ngames++;
      } else if (!ids[i] && games[i]) {
        pthread_join(games[i], NULL);
        games[i] = 0;
        playing = --ngames;
      }
    }
    usleep(WS_CHECK_PERIOD_US);
  }
}