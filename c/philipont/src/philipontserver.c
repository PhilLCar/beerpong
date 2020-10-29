#include <websocket.h>
#include <philipont.h>

int main() {
  Interface *i = startservice();
  connect(i);
  stopservice();
  return 0;
}