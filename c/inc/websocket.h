#ifndef WEBSOCKET_H
#define WEBSOCKET_H

#include <openssl/sha.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>

const int PORT            = 8080;
const int MAX_CONNECTIONS = 32;

#endif