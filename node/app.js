import { STATES } from './config'

console.log(performance.now());
console.log("Node is starting");
var UDP_Socket = require('dgram');

var socketServer = UDP_Socket.createSocket('udp4');

const PORT = 8000;
const SERVER_DETAIL = process.env.SERVER_NAME
const SERVER_ARRAY=['Node1', 'Node2', 'Node3', 'Node4', 'Node5']
const TIMEOUT = process.env.TIMEOUT

socketServer.bind(PORT, () => {
  socketServer.setRecvBufferSize(9999999);
});

// const function_to_demonstrate_multithreading = () => {
//     for (let i = 0; i < 5; i++) {
//         console.log("Hi Executing Dummy function : " + i)
//     }
//     setTimeout(300)
// }

const listener = (socketServer) => {
  setTimeout(function() {}, 2000); 
  socketServer.on('message',function(msg, rinfo) {
    console.log(`I received this msg: ${msg}`)
  });
}

const sender = (socketServer, destination) => {
  const data = `Sending message from ${SERVER_DETAIL}`
  var msg = new Buffer.from(data)
  socketServer
      .send(
      msg,
      0,
      msg.length,
      PORT,
      destination,
      function(err, bytes){
          if (err) throw err;
          console.log(`UDP message sent to ${destination}`);
      });
  // setTimeout(function() {}, 2000);
}

var timeoutTimer = setTimeout(function electionCheck() {

}, TIMEOUT)

const electionCheck = () => {
  setTimeout(function() {}, 2000); 
  socketServer.on('message',function(msg, rinfo) {
    console.log(`I received this msg: ${msg}`)
  });
}
async function main() {
    listener(socketServer)

    await new Promise(resolve => setTimeout(resolve, 3000));

    // const serversToBeCalled = SERVER_ARRAY.filter(server => SERVER_DETAIL !== server)
    // const promises = serversToBeCalled.map(s => sender(socketServer, s))
    // await Promise.allSettled(promises)
}

main()
