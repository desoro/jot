import { Socket } from 'net';
import JotSocket from './socket';

class SocketManager {
  private lastSocketId: number;
  private readonly activeSockets: { [id: number]: JotSocket };
  
  constructor() {
    this.lastSocketId = 0;
    this.activeSockets = {};
  }

  /**
   * Retrieves a new managed socket.
   * @param nodeSocket - The node net socket.
   */
  getSocket(nodeSocket: Socket) {
    const socketId = ++this.lastSocketId;
    const jotSocket = new JotSocket(socketId, nodeSocket);

    this.activeSockets[socketId] = jotSocket;

    jotSocket.on('disconnect', () => {
      delete this.activeSockets[socketId];
    });

    return jotSocket;
  }
}

export default new SocketManager();