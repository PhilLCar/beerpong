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

Interface      _interface;
pthread_t      _serverthread = 0;
pthread_t      _clientthread[MAX_CONNECTIONS];
int            _clientstop[MAX_CONNECTIONS];
int            _started = 0;
struct timeval _timeout;

int handshake(int fd) {

}

void *_client(void *vargp) {
  const int bufsize = 1 << 15;
  int me = (long)vargp >> 32;
  int fd = (long)vargp & 0xFFFFFFFF;
  char buffer[bufsize];
  long bytes;
  int  lastpos;

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
    memset(buffer, 0, bufsize * sizeof(char));
    bytes = read(fd, buffer, bufsize);
    if (bytes) { // write to interface
      pthread_mutex_lock(&_interface.lock);
      printf("%s\n", buffer); // tmp
      for (int i = 0; i < bytes; i++) {
        _interface.in[(_interface.in_ptr + i) % COM_BUFFERS_SIZE] = buffer[i];
      }
      pthread_mutex_unlock(&_interface.lock);
    }
    if (lastpos != _interface.out_ptr) {
      pthread_mutex_lock(&_interface.lock);
      printf("%s\n", buffer); // tmp
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