#ifndef WEBSOCKET_H
#define WEBSOCKET_H

#include <pthread.h>

#define COM_BUFFERS_SIZE  2048
#define FRAME_MAX_SIZE   32768
#define FRAME_CONTINUE     0x0
#define FRAME_TEXT         0x1
#define FRAME_BINARY       0x2
#define FRAME_CLOSE        0x8
#define FRAME_PING         0x9
#define FRAME_PONG         0xA

typedef struct interface {
  int out_ptr;
  int in_ptr;
  unsigned char out[COM_BUFFERS_SIZE];
  unsigned char in[COM_BUFFERS_SIZE];
  pthread_mutex_t lock;
} Interface;

// This struct is a little bit weird
// It doesn't fit the doc for hton reasons
#pragma pack(push, 1)
typedef struct frame_header {
  unsigned int  opcode : 4;
  unsigned int  rsv3   : 1;
  unsigned int  rsv2   : 1;
  unsigned int  rsv1   : 1;
  unsigned int  end    : 1;
  unsigned int  length : 7;
  unsigned int  mask   : 1;
} FrameHeader;
#pragma pack(pop)

#pragma pack(push, 1)
typedef struct control_frame {
  FrameHeader header;
  unsigned char mask[4];
  unsigned char payload[125];
} ControlFrame;
#pragma pack(pop)

#pragma pack(push, 1)
typedef struct long_frame {
  FrameHeader header;
  unsigned int  length;
  unsigned char mask[4];
  unsigned char payload[(1 << 16) - 8];
} LongFrame;
#pragma pack(pop)

typedef struct frame {
  FrameHeader   header;
  unsigned char mask[4];
  unsigned long length;
  unsigned char payload[FRAME_MAX_SIZE];
} Frame;

Interface *startservice();
void       stopservice();

#endif