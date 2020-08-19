import NetworkWriteData from './write-data';

class NetworkWriter {
  public readonly data: NetworkWriteData;

  constructor(type: number) {
    this.data = new NetworkWriteData();

    // header
    this.data.ubyte(type);
    this.data.ushort(0); // content size placeholder
  }

  /**
   * Finalizes the header and returns a Buffer to write to the Socket
   */
  pack() {
    // header = 3 bytes
    const contentSize = this.data.length - 3;

    // edit content size placeholder at bytes 1 & 2    
    this.data.view.setUint16(1, contentSize, true);    

    return Buffer.from(this.data.close());
  }
}

export default NetworkWriter;