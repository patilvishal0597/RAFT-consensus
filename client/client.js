var dgram = require('dgram');

var s = dgram.createSocket('udp4');


console.log("starting client");
const PORT = 8081;

s.send(Buffer.from('hello this is a msg from the client'), PORT, 'localhost', function(err, bytes){
    if (err) throw err;
    console.log('UDP message sent to ' + 'localhost' +':'+ PORT);
    console.log("closing client");

});