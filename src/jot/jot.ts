import { EventEmitter } from 'events';
import { createServer } from 'net';
import JotDebugger from './debugger';
import Pool from './pool';
import JotSocket from './socket';
import config, { JotConfigLike } from './config';

declare interface Jot {
  on(event: "connection", listener: (socket: JotSocket) => void): this;
  on(event: "error", listener: (error: string) => void): this;
  on(event: "listening", listener: (port: number) => void): this;
}

class Jot extends EventEmitter {
  private lastSocketId: number = 0;
  private readonly activeSockets: { [id: number]: JotSocket } = {};  
  private socketPool!: Pool<JotSocket>;

  /**
   * Starts the Jot server listening.
   * @param options - Jot config options.
   * @param callback - Called when Jot is listening.
   */
  listen(options: JotConfigLike, callback?: () => any) {
    config.init(options);

    if (options.debug) {
      new JotDebugger(this);
    }

    const server = createServer();

    server.maxConnections = config.maxConnections; 
    
    this.socketPool = new Pool(JotSocket, config.maxConnections);

    server.on('connection', (nodeSocket) => {    
      const socketId = ++this.lastSocketId;
      const jotSocket = this.socketPool.retrieve(socketId, nodeSocket);
      this.activeSockets[socketId] = jotSocket;

      this.emit('connection', jotSocket);

      jotSocket.on('disconnect', () => {
        delete this.activeSockets[socketId];
        this.socketPool.release(jotSocket);
      });
    });

    server.on('error', (error) => {
      this.emit('error', error);
    });

    server.listen(config.port, () => {
      callback && callback();
      this.emit('listening', config.port);
    });
  }
}

export default Jot;