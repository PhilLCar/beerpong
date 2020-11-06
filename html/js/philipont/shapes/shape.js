var _shape_unique_id = 0;

class Shape {
  constructor(buffers) {
    this.ID      = _shape_unique_id++;
    this.scene   = scene;
    this.ignored = true;
    /// BUFFERS ///
    this.vertexBuffer   = buffers.vertexBuffer;
    this.indexBuffer    = buffers.indexBuffer;
    this.normalBuffer   = buffers.normalBuffer;
    this.colorBuffer    = buffers.colorBuffer;
    this.positionBuffer = buffers.positionBuffer;
    this.objTypeBuffer  = buffers.objTypeBuffer;
  }

  animate(scene, t) {
    // do nothing
  }
}