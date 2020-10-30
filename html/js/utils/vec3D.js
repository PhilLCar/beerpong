function V3D(X, Y, Z) {
  this.X = X;
  this.Y = Y;
  this.Z = Z;
}

function V3DR(v) {
  return v.X*v.X + v.Y*v.Y + v.Z*v.Z*v.Z;
}

function V3Ddot(v1, v2) {
  return v1.X*v2.X + v1.Y*v2.Y + v1.Z*v2.Z;
}

function V3Dcrs(v1, v2) {
  var x = v1.Y*v2.Z - v1.Z*v2.Y;
  var y = v1.Z*v2.X - v1.X*v2.Z;
  var z = v1.X*v2.Y - v1.Y*v2.X;
  return new V3D(x, y, z);
}

function V3Dadd(v1, v2) {
  return new V3D(v1.X + v2.X, v1.Y + v2.Y, v1.Z + v2.Z);
}

function V3Dsub(v1, v2) {
  return new V3D(v1.X - v2.X, v1.Y - v2.Y, v1.Z - v2.Z);
}

function V3Dmul(v, k) {
  return new V3D(v.X * k, v.Y * k, v.Z * k);
}

function V3Ddiv(v, k) {
  return new V3D(v.X / k, v.Y / k, v.Z / k);
}