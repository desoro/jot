
declare interface JotConfigLike {
  port?: number, 
  maxConnections?: number,
  debug?: boolean,
  pingInterval?: number,
  timeout?: number
}

class JotConfig {
  private options: JotConfigLike;

  constructor() {
    this.options = {};
  }
  
  init(options: JotConfigLike) {
    this.options = options;
  }

  get port() {
    return this.options.port || 1337;
  }

  get maxConnections() {
    return this.options.maxConnections || 100;
  }

  get debug() {
    return this.options.debug || false;
  }

  get pingInterval() {
    return this.options.pingInterval || 5000;
  }

  get timeout() {
    return this.options.timeout || 3000;
  }
}

export { JotConfigLike };
export default new JotConfig();