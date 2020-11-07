var _shape_unique_id = 0;

class Shape {
  constructor(scene, buffers, isLine = true) {
    this.ID      = _shape_unique_id++;
    this.isLine  = isLine;
    this.scene   = scene;
    this.buffers = buffers;
    this.ignored = true;
    this.ignore(false);
  }

  ignore(ignored) {
    if (this.ignored == ignored) return;
    this.ignored = ignored;
    if (ignored) {
      const scene = this.scene;
      {
        const vertexBuffer  = this.vertexBuffer[0];
        const rVertexBuffer = this.buffers.vertexBuffer;
        for (var i = 0; i < vertexBuffer.length; i++) rVertexBuffer[i] = vertexBuffer[i];
        this.vertexBuffer   = scene.vertexBuffer.free(this.vertexBuffer);
      }
      {
        this.indexBuffer    = scene.indexBuffer.free(this.indexBuffer);
      }
      {
        const normalBuffer  = this.normalBuffer[0];
        const rNormalBuffer = this.buffers.normalBuffer;
        for (var i = 0; i < normalBuffer.length; i++) rNormalBuffer[i] = normalBuffer[i];
        this.normalBuffer   = scene.normalBuffer.free(this.normalBuffer);
      }
      {
        const colorBuffer  = this.colorBuffer[0];
        const rColorBuffer = this.buffers.colorBuffer;
        for (var i = 0; i < colorBuffer.length; i++) rColorBuffer[i] = colorBuffer[i];
        this.colorBuffer    = scene.colorBuffer.free(this.colorBuffer);
      }
      {
        const positionBuffer  = this.positionBuffer[0];
        const rPositionBuffer = this.buffers.positionBuffer;
        for (var i = 0; i < positionBuffer.length; i++) rPositionBuffer[i] = positionBuffer[i];
        this.positionBuffer = scene.positionBuffer.free(this.positionBuffer);
      }
      {
        const objTypeBuffer  = this.objTypeBuffer[0];
        const rObjTypeBuffer = this.buffers.objTypeBuffer;
        for (var i = 0; i < objTypeBuffer.length; i++) rObjTypeBuffer[i] = objTypeBuffer[i];
        this.objTypeBuffer  = scene.objTypeBuffer.free(this.objTypeBuffer);
      }
    } else {
      const buffers = this.buffers;
      const isLine  = this.isLine;
      const scene   = this.scene;
      const offset  = isLine ? scene.vertexBuffer.offset / 3 : scene.vertexBuffer.lineOffset / 3;
      {
        this.vertexBuffer = scene.vertexBuffer.malloc(buffers.vertexBuffer.length, isLine);
        const vertexBuffer = this.vertexBuffer[0];
        for (var i = 0; i < vertexBuffer.length; i++) {
          vertexBuffer[i] = buffers.vertexBuffer[i];
        }
      }
      {
        this.indexBuffer = scene.indexBuffer.malloc(buffers.indexBuffer.length, isLine, buffers.vertexBuffer.length / 3);
        const indexBuffer = this.indexBuffer[0];
        for (var i = 0; i < indexBuffer.length; i++) {
          indexBuffer[i] = buffers.indexBuffer[i] + offset;
        }
      }
      {
        this.normalBuffer = scene.normalBuffer.malloc(buffers.normalBuffer.length, isLine);
        const normalBuffer = this.normalBuffer[0];
        for (var i = 0; i < normalBuffer.length; i++) {
          normalBuffer[i] = buffers.normalBuffer[i];
        }
      }
      {
        this.colorBuffer = scene.colorBuffer.malloc(buffers.colorBuffer.length, isLine);
        const colorBuffer = this.colorBuffer[0];
        for (var i = 0; i < colorBuffer.length; i++) {
          colorBuffer[i] = buffers.colorBuffer[i];
        }
      }
      {
        this.positionBuffer = scene.positionBuffer.malloc(buffers.positionBuffer.length, isLine);
        const positionBuffer = this.positionBuffer[0];
        for (var i = 0; i < positionBuffer.length; i++) {
          positionBuffer[i] = buffers.positionBuffer[i];
        }
      }
      {
        this.objTypeBuffer = scene.objTypeBuffer.malloc(buffers.objTypeBuffer.length, isLine);
        const objTypeBuffer = this.objTypeBuffer[0];
        for (var i = 0; i < objTypeBuffer.length; i++) {
          objTypeBuffer[i] = buffers.objTypeBuffer[i];
        }
      }
    }
  }

  destroy() {
    this.ignore(true);
    this.buffers = null;
  }

  animate(scene, t) {
    // do nothing
  }
}