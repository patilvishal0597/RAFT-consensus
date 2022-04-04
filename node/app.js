var UDP_Socket = require('dgram');

var server = UDP_Socket.createSocket('udp4');
server.on('message',function(msg, rinfo) {
    console.log('I received this msg from the client: ' + msg)
});

const PORT = 8081;
server.bind(PORT);
console.log("Listening on the port", + PORT);
