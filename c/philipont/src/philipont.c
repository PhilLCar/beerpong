#include <matrix.h>
#include <stdio.h>

int main() {
  Matrix m = MX(4, 4);
  m.M[0][0] = 2;
  m.M[0][1] = 3;
  m.M[0][2] = 1;
  m.M[0][3] = 2;
  m.M[1][0] = 4;
  m.M[1][1] = 1;
  m.M[1][2] = 2;
  m.M[1][3] = 3;
  m.M[2][0] = 3;
  m.M[2][1] = 0;
  m.M[2][2] = 1;
  m.M[2][3] = 5;
  m.M[3][0] = 2;
  m.M[3][1] = 5;
  m.M[3][2] = 3;
  m.M[3][3] = 4;

  Matrix mI = MXI(&m);
  MXprint(&mI);
  return 0;
}