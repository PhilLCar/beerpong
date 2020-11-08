class Light {
  constructor(preset = LIGHTS.DEFAULT, position = vec3.fromValues(0.0, 1.0, 0.0)) {
    this.position    = position ? position : vec3.fromValues(0.0, 1.0, 0.0);
    this.directional = preset.DIRECTIONAL;
    this.color       = preset.BASE_COLOR;
    this.yCoeff      = preset.Y_COEFF;
  }

  getPosition() {
    if (this.directional) {
      vec3.normalize(this.position, this.position);
    }
    return this.position;
  }

  getColor() {
    if (this.directional) {
      vec3.normalize(this.position, this.position);
      return vec3.fromValues(
        (1 - this.yCoeff[0]) + this.yCoeff[0] * this.position[1] * this.color[0],
        (1 - this.yCoeff[1]) + this.yCoeff[1] * this.position[1] * this.color[1],
        (1 - this.yCoeff[2]) + this.yCoeff[2] * this.position[1] * this.color[2],
      );
    }
    return this.color;
  }
}