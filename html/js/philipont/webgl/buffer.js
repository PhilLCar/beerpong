class Buffer {
  constructor(size, type, index = false) {
    this.size = size;
    this.type = type;
    this.buffer = this.new(size, type);
    this.offset     = 0;
    this.lineOffset = 0;
    this.pointers   = [];
    this.index      = index;
  }

  new(size, type) {
    var buffer = null;
    switch (type) {
      case Buffer.UNSIGNED_BYTE:
        buffer = new Uint8Array(size);
        break;
      case Buffer.BYTE:
        buffer = new Int8Array(size);
        break;
      case Buffer.UNSIGNED_SHORT:
        buffer = new Uint16Array(size);
        break;
      case Buffer.SHORT:
        buffer = new Int16Array(size);
        break;
      case Buffer.UNSIGNED_INT:
        buffer = new Uint32Array(size);
        break;
      case Buffer.INT:
        buffer = new Int32Array(size);
        break;
      case Buffer.UNSIGNED_LONG:
        console.log("Unimplemented...");
        break;
      case Buffer.LONG:
        console.log("Unimplemented...");
        break;
      case Buffer.FLOAT:
        buffer = new Float32Array(size);
        break;
      case Buffer.DOUBLE:
        buffer = new Float64Array(size);
        break;
    }
    return buffer;
  }

  elementOffset(offset = this.buffer.byteOffset) {
    switch (this.type) {
      case Buffer.BYTE:
      case Buffer.UNSIGNED_BYTE:
        return offset;
      case Buffer.SHORT:
      case Buffer.UNSIGNED_SHORT:
        return offset / 2;
      case Buffer.INT:
      case Buffer.UNSIGNED_INT:
      case Buffer.FLOAT:
        return offset / 4;
      case Buffer.LONG:
      case Buffer.UNSIGNED_LONG:
      case Buffer.DOUBLE:
        return offset / 8;
    }
  }

  malloc(size, line = true) {
    while (this.offset + size > this.size) {
      const buffer = this.new(this.size * 2, this.type);
      for (var i = 0; i < this.size; i++) {
        buffer[i] = this.buffer[i];
      }
      this.buffer = buffer;
      this.size   = 2 * size;
    }
    if (line) {
      const pointer = [ this.buffer.subarray(this.offset, this.offset += size) ];
      this.pointers.push(pointer);
      return pointer;
    } else {
      const buffer = this.buffer;
      const offset = this.offset;
      const index  = this.lineOffset;
      for (var i = offset - 1; i >= index; i--) {
        if (this.index) {
          buffer[i + size] = buffer[i] + size;
        } else {
          buffer[i + size] = buffer[i];
        }
      }
      for (var pointer of this.pointers) {
        const elem_offset = this.elementOffset(pointer[0].byteOffset);
        const length      = pointer[0].length;
        if (elem_offset >= index) {
          pointer[0] = this.buffer.subarray(elem_offset + size, elem_offset + size + length);
        }
      }
      this.offset += size;
      const pointer = [ this.buffer.subarray(index, index + size) ];
      this.pointers.push(pointer);
      return pointer;
    }
  }

  free(ptr) {
    const elem        = ptr[0];
    const elem_offset = this.elementOffset(elem.byteOffset);
    const length      = elem.length;
    const buffer      = this.buffer;
    const offset      = this.offset - length;
    for (var i = elem_offset; i < offset; i++) {
      if (this.index) {
        buffer[i] = buffer[i + length] - length;
      } else {
        buffer[i] = buffer[i + length];
      }
    }
    for (var i = 0; i < this.pointers.length; i++) {
      const ptr_elem_offset = this.elementOffset(this.pointers[i][0].byteOffset);
      const ptr_length      = this.pointers[i][0].length;
      if (ptr_elem_offset == elem_offset) { // the one being deleted right now
        this.pointers.splice(i, i);
        i--;
      } else if (ptr_elem_offset > elem_offset) {
        this.pointers[i][0] = this.buffer.subarray(ptr_elem_offset - length, ptr_elem_offset - length + ptr_length);
      }
    }
    this.offset = offset;
    return null;
  }
}

Buffer.UNSIGNED_BYTE  = 0;
Buffer.BYTE           = 1;
Buffer.UNSIGNED_SHORT = 2;
Buffer.SHORT          = 3;
Buffer.UNSIGNED_INT   = 4;
Buffer.INT            = 5;
Buffer.UNSIGNED_LONG  = 6;
Buffer.LONG           = 7;
Buffer.FLOAT          = 8;
Buffer.DOUBLE         = 9;