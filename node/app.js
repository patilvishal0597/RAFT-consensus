const STATES = require('./config')
const msgJson = require('./Message.json')
let UDP_Socket = require('dgram');
console.log(`Node is starting at time: ${performance.now()}`);

let socketServer = UDP_Socket.createSocket('udp4');

const PORT = 8000;
const SERVER_ARRAY=['Node1', 'Node2', 'Node3', 'Node4', 'Node5']

const node = {
  name: process.env.SERVER_NAME,
  state: STATES.FOLLOWER,
  term: 0,
  votedFor: '',
  logs: [],
  timeout: process.env.TIMEOUT
}

const incrementTerm = () => {
  node.term = node.term + 1
}

const changeState = (state) => {
  node.state = state
}

socketServer.bind(PORT, () => {
  socketServer.setRecvBufferSize(9999999);
});

const createVoteRequest = () => {
  const msg = { ...msgJson }
  msg.sender_name = node.name
  msg.term = node.term
  msg.request = 'VOTE_REQUEST'
  return JSON.stringify(msg)
}

const sender = (socketServer, destination) => {
  const data = createVoteRequest()
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
  const serversToBeCalled = SERVER_ARRAY.filter(server => node.name !== server)
  const promises = serversToBeCalled.map(server => sender(socketServer, server))
  Promise.allSettled(promises)
}

let timeoutTimer = null;

function setElectionTimeout() {
  timeoutTimer = setTimeout(function reset() {
    console.log("I am called");
    changeState(STATES.CANDIDATE)
    incrementTerm()
    sendMessage()
    // send vote request
    // call timer
    timeoutTimer = setTimeout(reset, node.timeout)
  }, node.timeout)
}

const listener = async (socketServer) => {
  // await new Promise(resolve => setTimeout(resolve, 3000));
  setElectionTimeout()
  socketServer.on('message',function(msg, rinfo) {
    clearTimeout(timeoutTimer)
    // send votes to candidate
    console.log(`I received this msg: ${msg}`)

    setElectionTimeout()
  });
}

async function main() {
    // await new Promise(resolve => setTimeout(resolve, 3000));
    // if (SERVER_DETAIL === 'Node5') {
    //   const serversToBeCalled = SERVER_ARRAY.filter(server => SERVER_DETAIL !== server)
    //   const promises = serversToBeCalled.map(s => sendMessageFromNode5(socketServer, s))
    //   await Promise.allSettled(promises)
    // }
    listener(socketServer)


    // const serversToBeCalled = SERVER_ARRAY.filter(server => SERVER_DETAIL !== server)
    // const promises = serversToBeCalled.map(s => sender(socketServer, s))
    // await Promise.allSettled(promises)
}

main()

const sendMessageFromNode5 = () => {
  const data = `I am up`
  var msg = new Buffer.from(data)
  socketServer.send(msg,
      0,msg.length,
      PORT,destination,
      function(err, bytes){
          if (err) throw err;
          console.log(`UDP message sent to ${destination}`);
      });
}
