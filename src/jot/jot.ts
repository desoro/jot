import { EventEmitter } from 'events';
import { createServer } from 'net';
import JotDebugger from './debugger';
import JotSocket from './socket';
import config, { JotConfigLike } from './config';
import socketManager from './socket-manager';

declare interface Jot {
  on(event: "connection", listener: (socket: JotSocket) => void): this;
  on(event: "error", listener: (error: string) => void): this;
  on(event: "listening", listener: (port: number) => void): this;
}

class Jot extends EventEmitter {  
  constructor() {
    super();
  }

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

    server.on('connection', (nodeSocket) => {    
      const jotSocket = socketManager.getSocket(nodeSocket);
      this.emit('connection', jotSocket);
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