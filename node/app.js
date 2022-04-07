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

const createVoteRequest = () => {
  const msg = { ...msgJson }
  msg.sender_name = node.name
  msg.term = node.term
  msg.request = 'VOTE_REQUEST'
  msg.candidateId = node.name
  msg.lastLogIndex = -1
  msg.lastLogTerm = 0
  return JSON.stringify(msg)
}

const createVoteAcnowledgement = (responseInd, voteRequestMsg) => {
  const msg = { ...msgJson }
  msg.sender_name = node.name
  msg.term = node.term
  msg.request = 'VOTE_ACK'
  msg.granted = responseInd
  msg.candidateId = voteRequestMsg.candidateId
  return JSON.stringify(msg)
}

let voteTally = 0

const incrementTerm = (jump) => {
  node.term = node.term + jump
}

const changeState = (state) => {
  node.state = state
}

const vote = (msg) => {
  if (node.state === STATES.CANDIDATE) {
    node.votedFor = node.name
    voteTally = 1
  }
  else if (msg.term > node.term) {
    if (node.votedFor === '') {
      incrementTerm(msg.term - node.term)
      node.votedFor = msg.candidateId
      return createVoteAcnowledgement(true, msg)
    }
    else
      return createVoteAcnowledgement(false, msg)
  }
  // logic to check log entries
}

socketServer.bind(PORT, () => {
  socketServer.setRecvBufferSize(9999999);
});

const sender = (socketServer, destination, data) => {
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

function sendMessage(data) {
  const serversToBeCalled = SERVER_ARRAY.filter(server => node.name !== server)
  const promises = serversToBeCalled.map(server => sender(socketServer, server, data))
  Promise.allSettled(promises)
}

const voteRequest = () => {
  incrementTerm(1)
  changeState(STATES.CANDIDATE)
  vote()
  const data = createVoteRequest()
  sendMessage(data)
}

let timeoutTimer = null;

function setElectionTimeout() {
  timeoutTimer = setTimeout(function reset() {
    voteRequest()
    timeoutTimer = setTimeout(reset, node.timeout)
  }, node.timeout)
}

const becomeLeader = () => {
  console.log("I am in becomeLeader");
  changeState(STATES.LEADER)
  clearTimeout(timeoutTimer)
  voteTally = 0
  console.log(node);
}

const listener = async (socketServer) => {
  // await new Promise(resolve => setTimeout(resolve, 3000));
  setElectionTimeout()
  socketServer.on('message',function(msg, rinfo) {
    clearTimeout(timeoutTimer)
    msg = JSON.parse(msg.toString())
    console.log(msg);
    if (msg.request === 'VOTE_REQUEST') {
      const responseVoteMsg = vote(msg)
      console.log(responseVoteMsg);
      sender(socketServer, msg.sender_name, responseVoteMsg)
    }
    else if (msg.request === 'VOTE_ACK' && msg.granted) {
      voteTally++
      if (voteTally >= SERVER_ARRAY.length/2) {
        becomeLeader()
      }
    }
    else if (msg.request === 'APPEND_RPC') {
      // do something here
    }
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
