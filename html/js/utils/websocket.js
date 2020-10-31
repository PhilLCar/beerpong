function WebSocketRequest(socket) {
  this.socket  = socket;
  this.content = new Uint8Array(0);
}

WebSocketRequest.prototype.append = function(element, bits = 8, integer = true) {
  var u8 = null;
  switch (typeof element) {
    case "number":
      if (integer) {
        switch (bits) {
          case 8:
            u8 = Uint8Array.from([ element ]);
            break;
          case 16:
            var u16 = new Uint16Array(1);
            u16[0] = element;
            u8 = new Uint8Array(u16).buffer;
            break;
          case 32:
            var u32 = new Uint32Array(1);
            u32[0] = element;
            u8 = new Uint8Array(u32.buffer);
            break;
          case 64:
            var u64 = new Uint32Array(1);
            u64[0] = element;
            u8 = new Uint8Array(u64.buffer);
            break;
        }
      } else {
        if (bits != 32) {
          var f64 = new Float64Array(1);
          f64[0] = element;
          u8 = new Uint8Array(f64.buffer);
        } else {
          var f32 = new Float32Array(1);
          f32[0] = element;
          u8 = new Uint8Array(f32.buffer);
        }
      }
      break;
    case "string":
      var enc = new TextEncoder();
      var u8  = enc.encode(element);
      break;
    case "object":
      if (element.BYTES_PER_ELEMENT != undefined) {
        if (element.BYTES_PER_ELEMENT == 1) u8 = element;
        else                                u8 = new Uint8Array(element.buffer);
      } else if (element.length) {
        u8 = Uint8Array.from(element);
      }
      break;
  }
  if (u8 !== null) {
    var array = new Uint8Array(this.content.length + u8.length);
    array.set(this.content);
    array.set(u8, this.content.length);
    this.content = array;
  }
}

WebSocketRequest.prototype.send = function() {
  this.socket.send(this.content);
}

function WebSocketResponse(data) {
  this.data  = data;
  this.index = 0;
}

WebSocketResponse.UBYTE  = 0;
WebSocketResponse.BYTE   = 1;
WebSocketResponse.USHORT = 2;
WebSocketResponse.SHORT  = 3;
WebSocketResponse.UINT   = 4;
WebSocketResponse.INT    = 5;
WebSocketResponse.ULONG  = 6;
WebSocketResponse.LONG   = 7;
WebSocketResponse.FLOAT  = 8;
WebSocketResponse.DOUBLE = 9;
WebSocketResponse.STRING = 10;
WebSocketResponse.CUSTOM = 16;

WebSocketResponse.prototype.get = function(type, arrayLength = null, converter = null) {
  switch (type) {
    case WebSocketResponse.UBYTE:
      if (arrayLength === null) {
        return this.data[this.index++];
      } else {
        return new Uint8Array(this.data.subarray(this.index, this.index += arrayLength).buffer);
      }
      break;
    case WebSocketResponse.BYTE:
      if (arrayLength == null) {
        var tmp = new Int8Array(this.data.subarray(this.index, this.index++).buffer);
        return tmp[0];
      } else {
        var tmp = new Int8Array(this.data.subarray(this.index, this.index += arrayLength).buffer);
        return tmp;
      }
      break;
    case WebSocketResponse.USHORT:
      if (arrayLength === null) {
        var tmp = new Uint16Array(new Uint8Array(this.data.subarray(this.index, this.index += 2)).buffer);
        return tmp[0];
      } else {
        return new Uint16Array(new Uint8Array(this.data.subarray(this.index, this.index += (2 * arrayLength))).buffer);
      }
      break;
    case WebSocketResponse.SHORT:
      if (arrayLength == null) {
        var tmp = new Int16Array(new Uint8Array(this.data.subarray(this.index, this.index += 2)).buffer);
        return tmp[0];
      } else {
        return new Int16Array(new Uint8Array(this.data.subarray(this.index, this.index += (2 * arrayLength))).buffer);
      }
      break;
    case WebSocketResponse.UINT:
      if (arrayLength === null) {
        var tmp = new Uint32Array(new Uint8Array(this.data.subarray(this.index, this.index += 4)).buffer);
        return tmp[0];
      } else {
        return new Uint32Array(new Uint8Array(this.data.subarray(this.index, this.index += (4 * arrayLength))).buffer);
      }
      break;
    case WebSocketResponse.INT:
      if (arrayLength == null) {
        var tmp = new Int32Array(new Uint8Array(this.data.subarray(this.index, this.index += 4)).buffer);
        return tmp[0];
      } else {
        return new Int32Array(new Uint8Array(this.data.subarray(this.index, this.index += (4 * arrayLength))).buffer);
      }
      break;
    case WebSocketResponse.ULONG:
      if (arrayLength === null) {
        var tmp = new Uint32Array(new Uint8Array(this.data.subarray(this.index, this.index += 8)).buffer);
        return tmp[0] + (tmp[1] << 32);
      } else {
        var tmp = new Uint32Array(new Uint8Array(this.data.subarray(this.index, this.index += (8 * arrayLength))).buffer);
        var ret = [];
        for (var i = 0; i < arrayLength; i++) {
          var t = tmp[2 * i] + (tmp[2 * i + 1] << 32);
          ret.push(t);
        }
        return ret;
      }
      break;
    case WebSocketResponse.LONG:
      if (arrayLength === null) {
        var tmp = new Int32Array(new Uint8Array(this.data.subarray(this.index, this.index += 8)).buffer);
        var t0 = tmp[0];
        if (t0 < 0) t0 = ~t0 + 1;
        return t0 + (tmp[1] << 32);
      } else {
        var tmp = new Int32Array(new Uint8Array(this.data.subarray(this.index, this.index += (8 * arrayLength))).buffer);
        var ret = [];
        for (var i = 0; i < arrayLength; i++) {
          var t0 = tmp[2 * i];
          if (t0 < 0) t0 = ~t0 + 1;
          var t = t + (tmp[2 * i + 1] << 32);
          ret.push(t);
        }
        return ret;
      }
      break;
    case WebSocketResponse.FLOAT:
      if (arrayLength === null) {
        var tmp = new Float32Array(new Uint8Array(this.data.subarray(this.index, this.index += 4)).buffer);
        return tmp[0];
      } else {
        return new Float32Array(new Uint8Array(this.data.subarray(this.index, this.index += (4 * arrayLength))).buffer);
      }
      break;
    case WebSocketResponse.DOUBLE:
      if (arrayLength == null) {
        var tmp = new Float64Array(new Uint8Array(this.data.subarray(this.index, this.index += 8)).buffer);
        return tmp[0];
      } else {
        return new Float64Array(new Uint8Array(this.data.subarray(this.index, this.index += (8 * arrayLength))).buffer);
      }
      break;
    case WebSocketResponse.STRING:
      var dec = new TextDecoder("utf-8");
      return dec.decode(this.data.subarray(this.index, this.index += arrayLength));
      break;
    case WebSocketResponse.CUSTOM:
      if (arrayLength === null) {
        return converter.convert(new Uint8Array(this.data.subarray(this.index, this.index += converter.typeSize)));
      } else {
        var tmp = [];
        for (var i = 0; i < arrayLength; i++) {
          tmp.push(converter.convert(new Uint8Array(this.data.subarray(this.index, this.index += converter.typeSize))));
        }
        return tmp;
      }
      break;
  }
}