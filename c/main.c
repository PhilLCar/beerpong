#include <websocket.h>
#include <stdio.h>

int main() {
  Interface *i = startservice();

  char c;
  scanf("%c", &c);

  stopservice();
  return 0;
}