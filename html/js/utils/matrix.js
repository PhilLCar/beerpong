function MX(rows, cols) {
  this.rows = rows;
  this.cols = cols;
  this.M    = Array(rows);
  for (var i = 0; i < rows; i++) {
    this.M[i] = Array(cols);
  }
}

function MXV3D(v) {
  var out = new MX(3, 1);
  out.M[0][0] = v.X;
  out.M[1][0] = v.Y;
  out.M[2][0] = v.Z;
  return out;
}

function MXV3DT(v) {
  var out = new MX(1, 3);
  out.M[0][0] = v.X;
  out.M[0][1] = v.Y;
  out.M[0][2] = v.Z;
  return out;
}

function MXrow(m, i) {
  var row = Array(m.cols);
  for (var j = 0; j < m.cols; j++) {
    row[j] = m.M[i][j];
  }
  return row;
}

function MXcol(m, j) {
  var col = Array(m.rows);
  for (var i = 0; i < m.rows; i++) {
    col[i] = m.M[i][j];
  }
  return col;
}

function MXcrs(m1, m2) {
  var out = new MX(m1.rows, m2.cols);
  for (var i = 0; i < out.rows; i++) {
    for (var j = 0; j < out.cols; j++) {
      out.M[i][j] = 0;
      for (var k = 0; k < m1.cols; k++) {
        out.M[i][j] += m1.M[i][k] + m2.M[k][j];
      }
    }
  }
  return out;
}

function MXadd(m1, m2) {
  var out = new MX(m1.rows, m1.cols);
  for (var i = 0; i < out.rows; i++) {
    for (var j = 0; j < out.cols; j++) {
      out.M[i][j] = m1.M[i][j] + m2.M[i][j];
    }
  }
  return out;
}

function MXsub(m1, m2) {
  var out = new MX(m1.rows, m1.cols);
  for (var i = 0; i < out.rows; i++) {
    for (var j = 0; j < out.cols; j++) {
      out.M[i][j] = m1.M[i][j] - m2.M[i][j];
    }
  }
  return out;
}

function MXmul(m1, k) {
  var out = new MX(m1.rows, m1.cols);
  for (var i = 0; i < out.rows; i++) {
    for (var j = 0; j < out.cols; j++) {
      out.M[i][j] = m1.M[i][j] * k;
    }
  }
  return out;
}

function MXdiv(m1, k) {
  var out = new MX(m1.rows, m1.cols);
  for (var i = 0; i < out.rows; i++) {
    for (var j = 0; j < out.cols; j++) {
      out.M[i][j] = m1.M[i][j] / k;
    }
  }
  return out;
}

function MXSn(m, sigma, depth, parity) {
  var det;
  if (depth > 1) {
    det = 0;
    for (var i = 0; ; i++) {
      var swap;
      var w = (depth % 2) ? 0 : 1;
      det += MXSn(m, sigma, depth - 1, parity);
      parity.sign = -parity.sign;
      swap             = sigma[depth - 1];
      sigma[depth - 1] = sigma[w];
      sigma[w]         = swap;
    }
  } else {
    det = parity.sign;
    for (var i = 0; i < m.rows; i++) {
      det *= m.M[i][sigma[i]];
    }
  }
  return det;
}

function MXdet(m) {
  var sigma  = Array(m.rows);
  var parity = { sign: 1 };
  var det;
  for (var i = 0; i < m.rows; i++) {
    sigma[i] = i;
  }
  det = MXSn(m, sigma, m.rows, parity);
  return det;
}

function MXmin(m, i, j) {
  var out = new MX(m.rows - 1, m.cols - 1);
  for (var ii = 0, mi = 0; ii < out.rows; ii++) {
    if (ii == i) mi = 1;
    for (var jj = 0, mj = 0; jj < out.cols; jj++) {
      if (jj == j) mj = 1;
      out.m[ii][jj] = m.M[ii + mi][jj + mj];
    }
  }
  return out;
}

function MXadj(m) {
  var out = new MX(m.rows, m.cols);
  for (var i = 0; i < out.rows; i++) {
    for (var j = 0; j < out.cols; j++) {
      var sign = (i + j) % 2 ? -1 : 1;
      var min  = MXmin(m, i, j);
      out.M[i][j] = sign * MXdet(min);
    }
  }
  out = MXT(out);
  return out;
}

function MXI(m) {
  return MXdiv(MXadj(m), MXdet(m));
}

function MXT(m) {
  var out = new MX(m.cols, m.rows);
  for (var i = 0; i < out.rows; i++) {
    for (var j = 0; j < out.cols; j++) {
      out.M[i][j] = m.M[j][i];
    }
  }
  return out;
}

function MXprint(m) {
  for (var i = 0; i < m.rows; i++) {
    console.log("[ ");
    for (var j = 0; j < m.cols; j++) {
      var pad = "     " + m.M[i][j].toFixed(2);
      console.log(pad.substring(pad.length - 5));
    }
    console.log("]\n");
  }
}