import { Socket } from 'net';
import { EventEmitter } from 'events';
import NetworkReader from './reader';
import NetworkReadData from './read-data';
import NetworkWriter from './writer';
import NetworkWriteData from './write-data';
import Messages from './messages';
import config from './config';

declare interface JotSocket {
  on(event: "send_info", listener: (type: number, size: number) => void): this;
  on(event: "receive_info", listener: (type: number, size: number) => void): this;
  on(event: "disconnect", listener: (reason: string) => void): this;
  on(event: "error", listener: (heading: string, error: Error) => void): this;
}

class JotSocket extends EventEmitter {
  public readonly id: number; 
  private socket: Socket;
  public latency: number = 0;
  private receivers: { [type: number]: (data: NetworkReadData) => void } = {};
  private disconnectReason: string = 'unknown';  

  constructor(id: number, socket: Socket) {
    super(); 

    this.id = id;
    this.socket = socket;
    this.socket.setNoDelay(true);
    this.socket.setTimeout(0);

    this.socket.on('data', this.receive);

    this.socket.on('end', () => {
      this.disconnectReason = 'user ended';
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
      const reader = new NetworkReader(data.buffer);

      const receiver = this.receivers[reader.type];
      receiver && receiver(reader.data);

      this.emit('receive_info', reader.type, data.buffer.byteLength);  
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
      const writer = new NetworkWriter(type);
      handler && handler(writer.data);

      const buffer = writer.pack();
      this.socket.write(buffer);

      this.emit('send_info', type, buffer.byteLength);  
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