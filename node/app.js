console.log(performance.now());
console.log("Node is starting");
// setTimeout(function() {}, 10000);
var UDP_Socket = require('dgram');

var socketServer = UDP_Socket.createSocket('udp4');

const PORT = 8000;
const SERVER_DETAIL = process.env.SERVER_NAME
const SERVER_ARRAY=['Node1', 'Node2', 'Node3']

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
    socketServer.on('message',function(msg, rinfo) {
      console.log(`I received this msg: ${msg}`)
    });
}
listener(socketServer)
const sender = (socketServer, destination, increment) => {
  const data = `Sending message from ${SERVER_DETAIL}: ITER ${increment}`
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
  setTimeout(function() {}, 2000);
}

for (var i = 0; i < SERVER_ARRAY.length; i++) {
  if (SERVER_ARRAY[i] !== SERVER_DETAIL) {
    for (var j = 0; j < 10; j++) {
      sender(socketServer, SERVER_ARRAY[i], j)
    }
  }
}


// const serversToBeCalled = SERVER_ARRAY.filter(server => SERVER_DETAIL !== server)
// const promises = serversToBeCalled.map(s => sender(socketServer, s))
// const x = Promise.allSettled(promises)



// Promise.allSettled()
// if(process.env.SERVER_NUMBER === '1'){
//     console.log("This is node 1")
//     listener(server)
// }
//
// if(process.env.SERVER_NUMBER === '2'){
//     console.log("This is node 2")
//     for (let i = 0; i < 5; i++) {
//         s.send(Buffer.from('hello this is a msg from the client with counter' + i), PORT, 'Node1', function(err, bytes){
//         if (err) throw err;
//         console.log('UDP message' + i + 'sent to ' + 'Node1' +':'+ PORT);
//         });
//       }
//         console.log("closing client");
// }
