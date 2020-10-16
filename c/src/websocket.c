#include <websocket.h>
#include <http.h>

#include <openssl/sha.h>
#include <openssl/evp.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <time.h>

#define PORT              8000
#define MAX_CONNECTIONS     32
#define SLEEP_PERIOD_S       1

const char *SOCKET_MAGIC_STR = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

Interface      _interface;
pthread_t      _serverthread = 0;
pthread_t      _clientthread[MAX_CONNECTIONS];
int            _clientstop[MAX_CONNECTIONS];
int            _started = 0;
struct timeval _timeout;

// https://stackoverflow.com/questions/342409/how-do-i-base64-encode-decode-in-c
char *encode64(const unsigned char *input, int length) {
  const int pl = 4 * ((length + 2) / 3);
  char *output = malloc((pl + 1) * sizeof(char));
  EVP_EncodeBlock(output, input, length);
  return output;
}
// https://stackoverflow.com/questions/342409/how-do-i-base64-encode-decode-in-c
unsigned char *decode64(const char *input, int length) {
  const int pl = 3 * length / 4;
  unsigned char *output = malloc((pl + 1) * sizeof(char));
  EVP_DecodeBlock(output, input, length);
  return output;
}

int handshake(int fd) {
  const int bufsize = 4096;
  char buffer[bufsize];
  char key[64];
  int  version;
  long bytes;
  HttpRequest  request;
  HttpResponse response;
  bytes = read(fd, buffer, bufsize);
  httpreqfromstr(&request, buffer);
  buffer[0] = 0;
  getfield(request.header, "Connection", buffer);
  if (!strstr(buffer, "Upgrade")) {
    free(request.body);
    return 1;
  }
  buffer[0] = 0;
  getfield(request.header, "Upgrade", buffer);
  if (!strstr(buffer, "websocket")) {
    free(request.body);
    return 1;
  }
  getfield(request.header, "Sec-WebSocket-Key", key);
  getfield(request.header, "Sec-WebSocket-Version", buffer);
  version = atoi(buffer);
  printf("Connecting to socket with key: %s\n", key);
  printf("WebSocket version:             %d\n", version);

  // Response
  char *resp = malloc((strlen(key) + strlen(SOCKET_MAGIC_STR) + 1) * sizeof(char));
  char *ans;
  int   i;
  unsigned char digest[SHA_DIGEST_LENGTH];

  for (i = 0; key[i]; i++) resp[i] = key[i];
  for (int p = 0; SOCKET_MAGIC_STR[p]; i++, p++) resp[i] = SOCKET_MAGIC_STR[p];
  resp[i] = 0;
  SHA1(resp, i, digest);
  ans = encode64(digest, SHA_DIGEST_LENGTH);
  sprintf(response.version, "%s", request.version);
  response.status = HTTP_SWITCH;
  sprintf(response.message, HTTP_SWITCH_M);
  buildhttpresp(&response, "Upgrade", "websocket");
  buildhttpresp(&response, "Connection", "Upgrade");
  buildhttpresp(&response, "Sec-WebSocket-Accept", ans);
  response.body = "";
  httprespstr(&response, buffer);
  write(fd, buffer, strlen(buffer));

  free(resp);
  free(ans);
  free(request.body);
  return 0;
}

void *_client(void *vargp) {
  int me = (long)vargp >> 32;
  int fd = (long)vargp & 0xFFFFFFFF;
  int cc = 0;
  Frame        frame;
  ControlFrame cframe;
  int          lastpos;

  // init the last position pointer
  pthread_mutex_lock(&_interface.lock);
  lastpos = _interface.out_ptr;
  pthread_mutex_unlock(&_interface.lock);

  _clientstop[me] = handshake(fd);

  while (!_clientstop[me]) {
    fd_set input;
    FD_ZERO(&input);
    FD_SET(fd, &input);
    int n = select(fd + 1, &input, NULL, NULL, &_timeout);
    if (n < 0) {
      _clientstop[me] = 1; break;
    } else if (n == 0) continue;
    read(fd, &frame.header, sizeof(FrameHeader));
    if (frame.header.length < 126) {
      frame.length = frame.header.length;
    } else if (frame.header.length == 126) {
      unsigned char l[2];
      read(fd, l, 2);
      frame.length = (l[0] << 8) | l[1];
    } else if (frame.header.length == 127) {
      unsigned char l[4];
      read(fd, l, 4);
      frame.length = (l[0] << 24) | (l[1] << 16) | (l[2] << 8) | l[3];
    }
    if (frame.header.mask) {
      read(fd, frame.mask, 4);
    }
    read(fd, frame.payload, frame.length);
    switch (frame.header.opcode) {
      case FRAME_TEXT:
        printf("Message received: %s\n", frame.payload);
        break;
      case FRAME_BINARY:
        // Update the inputs
        pthread_mutex_lock(&_interface.lock);
        for (int i = 0; i < frame.length; i++)
        pthread_mutex_unlock(&_interface.lock);
        break;
      case FRAME_CLOSE:
        _clientstop[me] = 1;
        memset(&cframe, 0, sizeof(ControlFrame));
        cframe.header.opcode = FRAME_CLOSE;
        cframe.header.end    = 1;
        cframe.header.mask   = frame.header.mask;
        cframe.header.length = frame.header.length;
        if (frame.header.mask) {
          for (int i = 0; i < 4; i++) cframe.mask[i] = frame.mask[i];
          for (int i = 0; i < frame.header.length; i++) {
            cframe.payload[i] = frame.payload[i];
          }
        } else {
          for (int i = 0; i < frame.header.length; i++) {
            cframe.mask[i] = frame.payload[i];
          }
        }
        write(fd, &cframe, sizeof(FrameHeader) + (cframe.header.mask ? 2 : 6));
        break;
      case FRAME_PING:
        memset(&cframe, 0, sizeof(ControlFrame));
        cframe.header.opcode = FRAME_PONG;
        cframe.header.end    = 1;
        cframe.header.mask   = frame.header.mask;
        cframe.header.length = frame.header.length;
        if (frame.header.mask) {
          for (int i = 0; i < 4; i++) cframe.mask[i] = frame.mask[i];
          for (int i = 0; i < frame.header.length; i++) {
            cframe.payload[i] = frame.payload[i];
          }
        } else {
          for (int i = 0; i < frame.header.length; i++) {
            cframe.mask[i] = frame.payload[i];
          }
        }
        write(fd, &cframe, sizeof(FrameHeader) + (cframe.header.mask ? 2 : 6));
        break;
      case FRAME_PONG:
        // we don't really care...
        break;
      default:
        fprintf(stderr, "Unimplemented!\n")
        break;
    }
    if (lastpos != _interface.out_ptr) {
      pthread_mutex_lock(&_interface.lock);
      //printf("%s\n", buffer); // tmp
      //write(fd, buffer, strlen(buffer));
      pthread_mutex_unlock(&_interface.lock);
    }
  }
  close(fd);
}

void *_server(void *vargp) {
  int  server_fd;
  int  client_fd;
  struct sockaddr_in address;
  socklen_t          addrlen = sizeof(struct sockaddr_in);

  if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
    fprintf(stderr, "cannot create socket\n");
    return NULL;
  }
  if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &(int){1}, sizeof(int)) < 0) {
    fprintf(stderr, "cannot reuse socket");
    return NULL;
  }

  memset(&address, 0, sizeof(struct sockaddr_in));
  memset(address.sin_zero, 0, sizeof(unsigned char));
  address.sin_family      = AF_INET;
  address.sin_addr.s_addr = htonl(INADDR_ANY);
  address.sin_port        = htons(PORT);

  if (bind(server_fd, (struct sockaddr *restrict)&address, sizeof(struct sockaddr_in)) < 0) {
    fprintf(stderr, "bind failed\n");
    return NULL;
  }

  if (listen(server_fd, MAX_CONNECTIONS) < 0) {
    fprintf(stderr, "cannot listen\n");
    return NULL;
  }

  while(1) {
    printf("\n+++++++ Waiting for new connection ++++++++\n\n");
    if ((client_fd = accept(server_fd, (struct sockaddr *restrict)&address, &addrlen)) < 0) {
      fprintf(stderr, "cannot accept\n");
      return NULL;
    }

    int success = 0;
    for (int i = 0; i < MAX_CONNECTIONS; i++) {
      if (_clientthread[i] && _clientstop[i]) { // reclaim a dead thread
        pthread_join(_clientthread[i], NULL);
        _clientthread[i] = 0;
        _clientstop[i]   = 0;

      }
      if (!_clientthread[i]) {
        long arg = ((long)i << 32) | client_fd;
        printf("Connecting client #%d...\n", i);
        pthread_create(&_clientthread[i], NULL, _client, (void*)arg);
        success = 1;
        break;
      }
    }
    if (success) printf("-------- Connection success --------\n");
    else         printf("-------- Max connections reached --------\n");
  }
}

Interface *startservice() {
  if (!_started) {
    _timeout.tv_sec  = SLEEP_PERIOD_S;
    _timeout.tv_usec = 0;
    for (int i = 0; i < MAX_CONNECTIONS; i++) _clientstop[i]   = 0;
    for (int i = 0; i < MAX_CONNECTIONS; i++) _clientthread[i] = 0;
    memset(&_interface, 0, sizeof(Interface));
    pthread_create(&_serverthread, NULL, _server, NULL);
    _started = 1;
  }
  return &_interface;
}

void stopservice() {
  if (_started) {
    pthread_cancel(_serverthread);
    pthread_join(_serverthread, NULL);
    for (int i = 0; i < MAX_CONNECTIONS; i++) {
      if (_clientthread[i]) {
        _clientstop[i] = 1;
        pthread_join(_clientthread[i], NULL);
        _clientthread[i] = 0;
      }
    }
    _started = 0;
  }
}