import { Socket } from 'net';
import { EventEmitter } from 'events';
import SocketTimer from './socket-timer';
import NetworkReader from './reader';
import NetworkWriter from './writer';
import NetworkWriteData from './write-data';
import NetworkReadData from './read-data';

declare interface JotSocket {
  on(event: "message", listener: (type: number, size: number) => void): this;
  on(event: "disconnect", listener: (reason: string) => void): this;
  on(event: "error", listener: (error: string) => void): this;
}

class JotSocket extends EventEmitter {
  private readonly _id: number; 
  private socket: Socket;
  private timer: SocketTimer;
  private receivers: { [type: number]: (data: NetworkReadData) => void };
  private disconnectReason: string | undefined;  

  constructor(id: number, socket: Socket) {
    super(); 

    this._id = id;
    this.socket = socket;
    this.timer = new SocketTimer(this); 
    this.receivers = {};

    this.socket.on('data', (data) => {
      const reader = new NetworkReader(data.buffer);

      this.emit('message', reader.type, reader.size);  

      const receiver = this.receivers[reader.type];
      receiver && receiver(reader.data);
    });

    this.socket.on('end', () => {
      this.disconnectReason = 'user ended';
    });
    
    this.socket.on('error', (error) => {
      this.disconnectReason = 'socket error';
      this.emit('error', error);
    });
  
    this.socket.on("close", () => {
      this.timer.stop();
      this.emit('disconnect', this.disconnectReason || 'unknown');
    });
  }

  /**
   * The sockets unique session id.
   */
  get id() {
    return this._id;
  }

  /**
   * The sockets ping/pong latency in milliseconds.
   */
  get latency() {
    return this.timer.latency;
  }  

  /**
   * Add a receiver for an incoming binary event message.
   * @param type - Number between 10-255.
   * @param receiver - This will overwrite an existing receiver.
   */
  receive(type: number, receiver: (data: NetworkReadData) => void) {
    this.receivers[type] = receiver;
  }

  /**
   * Send a binary event message.
   * @param type - Number between 10-255.
   * @param handler - Handles writing to the binary buffer.
   */
  send(type: number, handler: (data: NetworkWriteData) => void) {
    const writer = new NetworkWriter(type);
    handler(writer.data);
    this.socket.write(writer.pack());
  }

  /**
   * Manually disconnects the socket.
   */
  kick(reason: string) {
    this.disconnectReason = reason;
    this.socket.end();
  }
}

export default JotSocket;