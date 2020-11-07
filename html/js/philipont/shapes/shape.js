var _shape_unique_id = 0;

class Shape {
  constructor(scene, buffers, isLine) {
    this.ID     = _shape_unique_id++;
    this.isLine = isLine;
    this.scene  = scene;
    
    this.vertexBuffer = scene.vertexBuffer.malloc(buffers.vertexBuffer.length, isLine);
    const vertexBuffer = this.vertexBuffer[0];
    for (var i = 0; i < vertexBuffer.length; i++) {
      vertexBuffer[i] = buffers.vertexBuffer[i];
    }
    this.indexBuffer = scene.indexBuffer.malloc(buffers.indexBuffer.length, isLine);
    const indexBuffer = this.indexBuffer[0];
    for (var i = 0; i < indexBuffer.length; i++) {
      indexBuffer[i] = buffers.indexBuffer[i];
    }
    this.normalBuffer = scene.normalBuffer.malloc(buffers.normalBuffer.length, isLine);
    const normalBuffer = this.normalBuffer[0];
    for (var i = 0; i < normalBuffer.length; i++) {
      normalBuffer[i] = buffers.normalBuffer[i];
    }
    this.colorBuffer = scene.colorBuffer.malloc(buffers.colorBuffer.length, isLine);
    const colorBuffer = this.colorBuffer[0];
    for (var i = 0; i < colorBuffer.length; i++) {
      colorBuffer[i] = buffers.colorBuffer[i];
    }
    this.positionBuffer = scene.positionBuffer.malloc(buffers.positionBuffer.length, isLine);
    const positionBuffer = this.positionBuffer[0];
    for (var i = 0; i < positionBuffer.length; i++) {
      positionBuffer[i] = buffers.positionBuffer[i];
    }
    this.objTypeBuffer = scene.objTypeBuffer.malloc(buffers.objTypeBuffer.length, isLine);
    const objTypeBuffer = this.objTypeBuffer[0];
    for (var i = 0; i < objTypeBuffer.length; i++) {
      objTypeBuffer[i] = buffers.objTypeBuffer[i];
    }
  }

  destroy() {
    const scene = this.scene;
    this.vertexBuffer   = scene.vertexBuffer.free(this.vertexBuffer);
    this.indexBuffer    = scene.indexBuffer.free(this.indexBuffer);
    this.normalBuffer   = scene.normalBuffer.free(this.normalBuffer);
    this.colorBuffer    = scene.colorBuffer.free(this.colorBuffer);
    this.positionBuffer = scene.positionBuffer.free(this.positionBuffer);
    this.objTypeBuffer  = scene.objTypeBuffer.free(this.objTypeBuffer);
  }

  animate(scene, t) {
    // do nothing
  }
}