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

let voteTally = 0

const incrementTerm = (jump) => {
  node.term = node.term + jump
}

const changeState = (state) => {
  console.log(`${state} Line 27`);
  node.state = state
}

const changeVotedFor = (votedFor) => {
  node.votedFor = votedFor
}

const getLastLogIndex = () => {
  return node.logs.length - 1
}

const createVoteRequest = () => {
  const msg = { ...msgJson }
  msg.sender_name = node.name
  msg.term = node.term
  msg.request = 'VOTE_REQUEST'
  msg.candidateId = node.name
  msg.lastLogIndex = getLastLogIndex()
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

const createHeartbeats = () => {
  const msg = { ...msgJson }
  msg.sender_name = node.name
  msg.term = node.term
  msg.request = 'APPEND_RPC'
  msg.prevLogIndex = getLastLogIndex()
  msg.prevLogTerm = 0
  return JSON.stringify(msg)
}

const vote = (msg) => {
  if (!msg && node.state === STATES.CANDIDATE) {
    changeVotedFor(node.name)
    voteTally = 1
    return
  }
  if (msg.term > node.term) {
    incrementTerm(msg.term - node.term)
    changeVotedFor('')
    changeState(STATES.FOLLOWER)
  }
  let logOKInd = false
  if (msg.lastLogIndex >= getLastLogIndex()) {
    logOKInd = true
    // do something when logs[] implemented
  }
  if (msg.term === node.term && node.votedFor === '' && logOKInd)
    return createVoteAcnowledgement(true, msg)
  else
    return createVoteAcnowledgement(false, msg)
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
}

function broadcast(data) {
  const serversToBeCalled = SERVER_ARRAY.filter(server => node.name !== server)
  const promises = serversToBeCalled.map(server => sender(socketServer, server, data))
  Promise.allSettled(promises)
}

const voteRequest = () => {
  incrementTerm(1)
  changeState(STATES.CANDIDATE)
  vote()
  // check logs
  const data = createVoteRequest()
  broadcast(data)
}

let timeoutTimer = null;
let heartbeatTimer = null;

function setElectionTimeout() {
  timeoutTimer = setTimeout(function resetElectionTimer() {
    voteRequest()
    timeoutTimer = setTimeout(resetElectionTimer, node.timeout)
  }, node.timeout)
}

const sendHeartbeats = () => {
  const heartbeat = createHeartbeats()
  broadcast(heartbeat)
}

function setHeartbeatsTimeout() {
  heartbeatTimer = setTimeout(function resetHeartbeatTimer() {
    if (node.state === STATES.LEADER) {
      sendHeartbeats()
      heartbeatTimer = setTimeout(resetHeartbeatTimer, 150)
    }
    else {
      clearTimeout(heartbeatTimer)
    }
  }, 150)
}

const becomeLeader = () => {
  console.log("I am in becomeLeader");
  changeState(STATES.LEADER)
  clearTimeout(timeoutTimer)
  setHeartbeatsTimeout()
  voteTally = 0
  console.log(`Line numver : 116 ${JSON.stringify(node)}`);
}

const listener = async (socketServer) => {
  // await new Promise(resolve => setTimeout(resolve, 3000));
  setElectionTimeout()
  socketServer.on('message',function(msg, rinfo) {
    msg = JSON.parse(msg.toString())
    console.log(`Line 125: ${JSON.stringify(msg)}`);
    if (msg.request === 'VOTE_REQUEST') {
      const responseVoteMsg = vote(msg)
      if (JSON.parse(responseVoteMsg).granted)
        setElectionTimeout()
      sender(socketServer, msg.sender_name, responseVoteMsg)
    }
    else if (msg.request === 'VOTE_ACK') {
      console.log(`Line 167: ${node.state}`);
      if (msg.term > node.term) {
        clearTimeout(timeoutTimer)
        incrementTerm(msg.term - node.term)
        changeState(STATES.FOLLOWER)
        changeVotedFor('')
        setElectionTimeout()
      }
      else if (node.state === STATES.CANDIDATE && msg.granted) {
        voteTally++
        console.log(`${voteTally} votes received by ${node.name} for ${node.term}`);
        if (voteTally >= SERVER_ARRAY.length/2) {
          becomeLeader()
        }
      }
    }
    else if (msg.request === 'APPEND_RPC') {
      clearTimeout(timeoutTimer)
      setElectionTimeout()
    }
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
