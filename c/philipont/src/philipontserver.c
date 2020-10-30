#include <websocket.h>
#include <philipont.h>

int main() {
  Interface *i = startservice();
  philipont(i);
  stopservice();
  return 0;
}