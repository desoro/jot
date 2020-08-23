import Vector from "./vector";
import Pool, { PoolObject } from "./pool";

const encoder = new TextEncoder();

class NetworkWriteData implements PoolObject {
  static readonly pool: Pool<NetworkWriteData> = new Pool(NetworkWriteData, 25);
  private buffer: any;
  public readonly view: DataView;
  private position!: number;

  constructor() {
    this.buffer = new ArrayBuffer(8192);
    this.view = new DataView(this.buffer);    
  }

  enable() {
    this.position = 0;
  }

  disable() { }

  /**
   * Current position of the writer.
   */
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

  /**
   * Js representation of ulong ints
   */
  ulong(value: number) {
    this.view.setBigUint64(this.position, BigInt(value), true);
    this.position += 8;
    return this;
  }

  /**
   * Js representation of long ints
   */
  long(value: number) {
    this.view.setBigInt64(this.position, BigInt(value), true);
    this.position += 8;
    return this;
  }

  /**
   * 2d int16 vectors rounded to the tenth
   * @param x - Range(-3276.7, 3276.7)
   * @param y - Range(-3276.7, 3276.7)
   */
  vector(value: Vector) {
    this.short(value.x * 10);
    this.short(value.y * 10);
    return this;
  }

  string(value: string) {   
    this.ubyte(value.length);
    const stringView = new Uint8Array(this.buffer, this.position, value.length);
    encoder.encodeInto(value, stringView);
    this.position += value.length;    
    return this;
  }

  /**
   * Nests and returns an additional writer.
   */
  nest(handler: (data: NetworkWriteData) => void) {
    const nested = NetworkWriteData.pool.retrieve(NetworkWriteData);
    handler(nested);
    this.bytes(nested.close());
    NetworkWriteData.pool.release(nested);
  }

  /**
   * Offsets the given ArrayBuffer into the writer.
   */
  bytes(array: ArrayBuffer) {
    const view = new Uint8Array(this.buffer);
    view.set(new Uint8Array(array), this.position);
    this.position += array.byteLength;
    return this;
  }  

  /**
   * Closes editing and returns a new ArrayBuffer sliced from the current position.
   */
  close() {
    const array = this.buffer.slice(0, this.position);
    return array;
  }
}

export default NetworkWriteData;