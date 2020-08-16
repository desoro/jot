import { Jot } from './jot';

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

      socket.on('message', (type, size) => {
        console.log(`user sent message (${type}, ${size})`);
      });
    
      socket.on('disconnect', (reason) => {
        console.log(`user disconnected, reason: ${reason}`);
      });  

      socket.on('error', (error) => {
        console.log(`SOCKET ERROR: ${error}`);
      });  
    });    
  }
}

export default JotDebugger;