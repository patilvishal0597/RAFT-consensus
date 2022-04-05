console.log("Node is starting");
var UDP_Socket = require('dgram');

var server = UDP_Socket.createSocket('udp4');

var s = UDP_Socket.createSocket('udp4');
// const NODE_1_PORT = process.env.NODE_1_PORT;
const PORT = 8000;
server.bind(PORT);
console.log("Listening on the port", + PORT);

const function_to_demonstrate_multithreading = () => {
    for (let i = 0; i < 5; i++) {
        console.log("Hi Executing Dummy function : " + i)
    }
    setTimeout(300)
}

const listener = (server) => {
   
    server.on('message',function(msg, rinfo) {
    console.log('I received this msg from the client: ' + msg)
    });
}
    
if(process.env.SERVER_NUMBER === '1'){
        console.log("This is node 1")
        listener(server)

   
}

if(process.env.SERVER_NUMBER === '2'){
    console.log("This is node 2")
    for (let i = 0; i < 5; i++) {
        s.send(Buffer.from('hello this is a msg from the client with counter' + i), PORT, 'Node1', function(err, bytes){
        if (err) throw err;
        console.log('UDP message' + i + 'sent to ' + 'Node1' +':'+ PORT);
        });    
      }
        console.log("closing client");
    
}


