import NetworkReadData from './read-data';

class NetworkReader {
  public data: NetworkReadData;
  public type: number;
  public size: number;

  constructor(buffer: ArrayBuffer) {
    this.data = new NetworkReadData(buffer);
    this.type = this.data.ubyte();
    this.size = this.data.ushort();
  }
}

export default NetworkReader;