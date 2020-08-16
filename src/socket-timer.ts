import config from './config';
import JotSocket from './socket';

class SocketTimer {
  private socket: JotSocket;
  private timeout: NodeJS.Timeout | undefined;
  private interval: NodeJS.Timeout;
  public latency: number;

  constructor(socket: JotSocket) {
    this.socket = socket;
    this.latency = 0;

    const onTimeout = () => {
      this.socket.kick('timed out');
    }

    const onInterval = () => {
      this.timeout = setTimeout(onTimeout, config.timeout);
      this.socket.send(1, (data) => data.ulong(Date.now()));
    }

    this.interval = setInterval(onInterval, config.pingInterval);

    /*

    this.socket.on(2, (data) => {
      this.timeout && clearTimeout(this.timeout);
      this.latency = 0;
    });

    */
  }

  stop() {
    this.timeout && clearTimeout(this.timeout);
    clearInterval(this.interval)
  }
}

export default SocketTimer;