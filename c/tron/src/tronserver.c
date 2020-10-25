#include <websocket.h>
#include <stdio.h>
#include <tron.h>

int main() {
  Interface *i = startservice();
  tron(i);
  stopservice();
  return 0;
}