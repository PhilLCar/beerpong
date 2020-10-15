#include <websocket.h>

int main() {
  int  server_fd;
  int  client_fd;
  long valread;
  struct sockaddr_in address;
  socklen_t          addrlen = sizeof(struct sockaddr_in);
  char *message;

  if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
    fprintf(stderr, "cannot create socket\n");
    return -1;
  }

  memset(&address, 0, sizeof(struct sockaddr_in));
  memset(address.sin_zero, 0, sizeof(unsigned char));
  address.sin_family      = AF_INET;
  address.sin_addr.s_addr = htonl(INADDR_ANY);
  address.sin_port        = htons(PORT);

  if (bind(server_fd, &address, sizeof(struct sockaddr_in)) < 0) {
    fprintf(stderr, "bind failed\n");
    return -2;
  }

  if (listen(server_fd, MAX_CONNECTIONS) < 0) {
    fprintf(stderr, "cannot listen\n");
    return -4;
  }

  if (client_fd = accept(server_fd, &address, &addrlen) < 0) {
    fprintf("cannot accept\n");
    return -8;
  }

  while(1) {
    printf("\n+++++++ Waiting for new connection ++++++++\n\n");
    if ((client_fd = accept(server_fd, &address, &addrlen)) < 0) {
      fprintf("cannot accept\n");
      return -8;
    }
    
    const int bufsize = 1 << 15;
    char buffer[bufsize];
    memset(buffer, 0, (bufsize) * sizeof(char));
    valread = read( new_socket , buffer, bufsize);
    printf("%s\n", buffer);
    write(client_fd , message , strlen(message));
    printf("------------------Hello message sent-------------------\n");
    close(client_fd);
  }
  return 0;
}