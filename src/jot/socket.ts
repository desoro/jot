import { Socket } from 'net';
import { EventEmitter } from 'events';
import { PoolObject } from './pool';
import NetworkReadData from './read-data';
import NetworkWriteData from './write-data';
import Messages from './messages';
import config from './config';

declare interface JotSocket {
  on(event: "send_info", listener: (type: number, size: number) => void): this;
  on(event: "receive_info", listener: (type: number, size: number) => void): this;
  on(event: "error", listener: (heading: string, error: Error) => void): this;  
  on(event: "disconnect", listener: (reason: string) => void): this;  
}

class JotSocket extends EventEmitter implements PoolObject {  
  private _id!: number; 
  private socket!: Socket;
  public latency: number = 0;
  private receivers: { [type: number]: (data: NetworkReadData) => void } = {};
  private disconnectReason!: string;

  enable(id: number, socket: Socket) {
    this._id = id;
    this.socket = socket;
    this.latency = 0;
    this.disconnectReason = 'unknown';

    this.socket.setNoDelay(true);
    this.socket.setTimeout(0);

    this.socket.on('data', this.receive);

    this.socket.on('end', () => {
      if (this.disconnectReason === 'unknown') {
        this.disconnectReason = 'user ended';
      }
    });   

    this.socket.on('error', (error) => {
      this.disconnectReason = 'socket error';
      this.emit('error', error);
    });  

    this.socket.on("close", () => {
      this.emit('disconnect', this.disconnectReason);
    });

    this.handleTimeout();
  }

  disable() {  
    this.socket.removeAllListeners();  
    this.removeAllListeners();
    this.receivers = {};
  }

  get id() {
    return this._id;
  }

  /**
   * Add a receiver for an incoming binary event messages of the given type.
   * @param type - Number between 10-255. (0-9 are reserved)
   * @param receiver - This will overwrite an existing receiver.
   */
  register(type: number, receiver: (data: NetworkReadData) => void) {
    this.receivers[type] = receiver;
  }

  private receive = (data: Buffer) => {
    try {
      const reader = NetworkReadData.pool.retrieve(data.buffer);

      const type = reader.ubyte();
      const size = reader.ushort();

      const receiver = this.receivers[type];
      receiver && receiver(reader);

      this.emit('receive_info', type, data.buffer.byteLength);  

      NetworkReadData.pool.release(reader);
    } 
    catch (error) {
      this.error('Receive error', error);
    }
  }

  /**
   * Send a binary event message.
   * @param type - Number between 10-255.
   * @param handler - Handles writing to the binary buffer.
   */
  send(type: number, handler?: (data: NetworkWriteData) => void) {
    try {
      const writer = NetworkWriteData.pool.retrieve();

      // header
      writer.ubyte(type);
      writer.ushort(0); // content size placeholder

      handler && handler(writer);

      // header = 3 bytes
      const contentSize = writer.length - 3;

      // edit content size placeholder at bytes 1 & 2    
      writer.view.setUint16(1, contentSize, true); 

      const buffer = Buffer.from(writer.close())
      this.socket.write(buffer);

      this.emit('send_info', type, buffer.byteLength);

      NetworkWriteData.pool.release(writer);
    } 
    catch (error) {
      this.error('Send error', error);
    }
  }

  /**
   * Raise an error with the socket.
   */
  error(heading: string, error: Error) {
    this.send(Messages.Error, (data) => data.string(`${heading}: ${error.message}`));
    this.emit('error', heading, error);
  }

  /**
   * Manually disconnects the socket.
   */
  kick(reason: string) {
    this.disconnectReason = reason;
    this.socket.end();
  }

  private handleTimeout() {
    let timeSent = 0;
    let timeout: NodeJS.Timeout;

    const onTimeout = () => {
      this.kick('timed out');
    }

    const onInterval = () => {
      timeSent = Date.now();
      timeout = setTimeout(onTimeout, config.timeout);
      this.send(Messages.Ping, (data) => data.ulong(timeSent));
    }

    const interval = setInterval(onInterval, config.pingInterval);

    this.on('disconnect', () => {
      timeout && clearTimeout(timeout);
      clearInterval(interval)
    });

    this.register(Messages.Pong, (data) => {
      const timeReceived = data.ulong();
      timeout && clearTimeout(timeout);
      this.latency = timeReceived - timeSent;
    });
  }
}

export default JotSocket;