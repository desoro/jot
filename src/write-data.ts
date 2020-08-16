
const bufferPool = Array(100).fill(new ArrayBuffer(8192), 0, 100);
const encoder = new TextEncoder();

class NetworkWriteData {
  private buffer: any;
  public readonly view: DataView;
  private position: number;

  constructor() {
    this.buffer = bufferPool.shift() || new ArrayBuffer(8192);
    this.view = new DataView(this.buffer);
    this.position = 0;
  }

  get length() {
    return this.position;
  }

  bool(value: boolean) {
    this.view.setUint8(this.position, value ? 1 : 0);
    this.position += 1;
    return this;
  }

  ubyte(value: number) {
    this.view.setUint8(this.position, value);
    this.position += 1;
    return this;
  }

  byte(value: number) {
    this.view.setInt8(this.position, value);
    this.position += 1;
    return this;
  }  

  ushort(value: number) {
    this.view.setUint16(this.position, value, true);
    this.position += 2;
    return this;
  }

  short(value: number) {
    this.view.setInt16(this.position, value, true);
    this.position += 2;
    return this;
  }

  uint(value: number) {
    this.view.setUint32(this.position, value, true);
    this.position += 4;
    return this;
  }

  int(value: number) {
    this.view.setInt32(this.position, value, true);
    this.position += 4;
    return this;
  }

  ulong(value: number) {
    this.view.setBigUint64(this.position, BigInt(value), true);
    this.position += 8;
    return this;
  }

  long(value: number) {
    this.view.setBigInt64(this.position, BigInt(value), true);
    this.position += 8;
    return this;
  }

  vector(value: { x: number; y: number; }) {
    this.short(value.x * 10);
    this.short(value.y * 10);
    return this;
  }

  string(value: string, cleanControls?: boolean) {   
    if (cleanControls) {
      value = value.replace(/[\x00\x08]/u, '');
    }

    this.ubyte(value.length);
    const view = new Uint8Array(this.buffer, this.position, value.length);
    encoder.encodeInto(value, view);
    this.position += value.length;    
    return this;
  }

  nest(callback: (writer: NetworkWriteData) => void) {
    const nested = new NetworkWriteData();
    callback(nested);
    this.bytes(nested.close());
  }

  bytes(array: ArrayBuffer) {
    const view = new Uint8Array(this.buffer);
    view.set(new Uint8Array(array), this.position);
    this.position += array.byteLength;
    return this;
  }  

  close() {
    const array = this.buffer.slice(0, this.position);
    bufferPool.push(this.buffer);
    return array;
  }
}

export default NetworkWriteData;