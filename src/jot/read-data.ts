import Vector from "./vector";
import Pool, { PoolObject } from "./pool";

const decoder = new TextDecoder();

class NetworkReadData implements PoolObject {
  static readonly pool: Pool<NetworkReadData> = new Pool(NetworkReadData, 25);
  private buffer!: ArrayBuffer;
  private view!: DataView;
  private position!: number;

  enable(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.position = 0;
  }

  disable() {}

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

  /**
   * Js representation of long ints
   */
  ulong() {
    const value = this.view.getBigUint64(this.position, true);
    this.position += 8;
    return Number(value);
  }

  /**
   * Js representation of long ints
   */
  long() {
    const value = this.view.getBigInt64(this.position, true);
    this.position += 8;
    return Number(value);
  }

  /**
   * 2d int16 vectors rounded to the tenth
   */
  vector() {
    return new Vector(this.short() / 10, this.short() / 10);
  }

  string() {
    const length = this.ubyte();
    const view = new Uint8Array(this.buffer, this.position, length);
    const value = decoder.decode(view);
    this.position += length;
    return value;
  }

  /**
   * Attachs and return new reader for nested data.
   */
  nested(handler: (data: NetworkReadData) => void) {
    const length = this.ushort();
    const view = new Uint8Array(this.buffer, this.position, length);
    this.position += length;

    const nested = NetworkReadData.pool.retrieve(NetworkReadData, view.buffer);
    handler(nested);
    NetworkReadData.pool.release(nested);
  }
}

export default NetworkReadData;