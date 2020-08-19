import Jot from './jot';

class JotDebugger {
  constructor(server: Jot) {
    console.log('debugging enabled');

    server.on('error', (error) => {
      console.log(`SERVER ERROR: ${error}`);
    });
    
    server.on('listening', (port) => {
      console.log(`listening on port ${port}`);
    });

    server.on('connection', (socket) => {
      console.log('a user connected');

      socket.on('send_info', (type, size) => {
        if (type > 9) {
          console.log(`sent (${type}, ${size})`);
        }
      });

      socket.on('receive_info', (type, size) => {
        if (type > 9) {
          console.log(`received (${type}, ${size})`);
        }
      });
    
      socket.on('disconnect', (reason) => {
        console.log(`user disconnected, reason: ${reason}`);
      });  

      socket.on('error', (heading, error) => {
        console.log(heading, error);
      });  
    });    
  }
}

export default JotDebugger;