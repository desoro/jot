
const decoder = new TextDecoder();

class NetworkReadData {
  private buffer: ArrayBuffer;
  private view: DataView;
  private position: number;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.position = 0;
  }

  bool() {
    const value = this.view.getUint8(this.position);
    this.position += 1;
    return value === 1;
  }

  ubyte() {
    const value = this.view.getUint8(this.position);
    this.position += 1;
    return value;
  }

  byte() {
    const value = this.view.getInt8(this.position);
    this.position += 1;
    return value;
  }  

  ushort() {
    const value = this.view.getUint16(this.position, true);
    this.position += 2;
    return value;
  }

  short() {
    const value = this.view.getInt16(this.position, true);
    this.position += 2;
    return value;
  }

  uint() {
    const value = this.view.getUint32(this.position, true);
    this.position += 4;
    return value;
  }

  int() {
    const value = this.view.getInt32(this.position, true);
    this.position += 4;
    return value;
  }

  ulong() {
    const value = this.view.getBigUint64(this.position, true);
    this.position += 8;
    return Number(value);
  }

  long() {
    const value = this.view.getBigInt64(this.position, true);
    this.position += 8;
    return Number(value);
  }

  vector() {
    return {
      x: this.short() / 10,
      y: this.short() / 10
    }
  }

  string() {
    const length = this.ubyte();
    const view = new Uint8Array(this.buffer, this.position, length);
    const value = decoder.decode(view);
    this.position += length;
    return value;
  }

  data() {
    const length = this.ushort();
    const view = new Uint8Array(this.buffer, this.position, length);
    this.position += length;
    return new NetworkReadData(view.buffer);
  }
}

export default NetworkReadData;