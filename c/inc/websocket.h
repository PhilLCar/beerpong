#ifndef WEBSOCKET_H
#define WEBSOCKET_H

#include <pthread.h>

#define COM_BUFFERS_SIZE 2048

typedef struct interface {
  int out_ptr;
  int in_ptr;
  unsigned char out[COM_BUFFERS_SIZE];
  unsigned char in[COM_BUFFERS_SIZE];
  pthread_mutex_t lock;
} Interface;

Interface *startservice();
void       stopservice();

#endif