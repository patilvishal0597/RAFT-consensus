const STATES = require('./config')

console.log(performance.now());
console.log("Node is starting");
let UDP_Socket = require('dgram');

let socketServer = UDP_Socket.createSocket('udp4');

const PORT = 8000;
const SERVER_DETAIL = process.env.SERVER_NAME
const SERVER_ARRAY=['Node1', 'Node2', 'Node3', 'Node4', 'Node5']
const TIMEOUT = process.env.TIMEOUT
let timeoutTimer = null;
let nodeState = STATES.FOLLOWER

socketServer.bind(PORT, () => {
  socketServer.setRecvBufferSize(9999999);
});



// const function_to_demonstrate_multithreading = () => {
//     for (let i = 0; i < 5; i++) {
//         console.log("Hi Executing Dummy function : " + i)
//     }
//     setTimeout(300)
// }
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

function sendMessage() {
  const serversToBeCalled = SERVER_ARRAY.filter(server => SERVER_DETAIL !== server)
  const promises = serversToBeCalled.map(s => sender(socketServer, s))
  Promise.allSettled(promises)
}

function setElectionTimeout() {
  timeoutTimer = setTimeout(function() {
    // change to CANDIDATE
    nodeState=STATES.CANDIDATE
    sendMessage()
    // send vote request
    // call timer
  }, 300)
}

const listener = (socketServer) => {
  setElectionTimeout()
  socketServer.on('message',function(msg, rinfo) {
    clearTimeout(timeoutTimer)
    // send votes to candidate
    console.log(`I received this msg: ${msg}`)

    setElectionTimeout()
  });
}

async function main() {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    listener(socketServer)


    // const serversToBeCalled = SERVER_ARRAY.filter(server => SERVER_DETAIL !== server)
    // const promises = serversToBeCalled.map(s => sender(socketServer, s))
    // await Promise.allSettled(promises)
}

main()
