const STATES = require('./config')
const msgJson = require('./Message.json')
const logJson = require('./Log.json')
const fs = require('fs');
const CurrentState = './CurrentState.json'
let UDP_Socket = require('dgram');
const jsonString = fs.readFileSync("./CurrentState.json");
const CurrState = JSON.parse(jsonString);

let socketServer = UDP_Socket.createSocket('udp4');

const PORT = 5555;
const SERVER_ARRAY=['Node1', 'Node2', 'Node3', 'Node4', 'Node5']

let nodeIsAlive = true

const timeInterval = 150
const minTimeInterval = timeInterval * 2
const maxTimeInterval = timeInterval * 3
const calculateTimeout = (Math.random() * (maxTimeInterval - minTimeInterval + 1)) + minTimeInterval

const node = {
  name: process.env.SERVER_NAME,
  state: STATES.FOLLOWER,
  term: 0, //stable storage variable
  votedFor: '', //stable storage variable
  logs: [], //stable storage variable
  timeout: calculateTimeout,
  currentLeader: '',
  heartbeatLength: timeInterval,
  commitIndex: -1, //stable storage variable
  nextIndex: {
    Node1: 0,
    Node2: 0,
    Node3: 0,
    Node4: 0,
    Node5: 0,
  },
  matchIndex: {
    Node1: -1,
    Node2: -1,
    Node3: -1,
    Node4: -1,
    Node5: -1,
  },
}

let voteTally = 0

const incrementTerm = (jump) => {
  node.term = node.term + jump
}

const changeState = (state) => {
  node.state = state
}

const changeVotedFor = (votedFor) => {
  node.votedFor = votedFor
}

const getLastLogIndex = () => {
  return node.logs.length - 1
}

const getLastLogTerm = () => {
  return getLastLogIndex() === -1 ? 0 : node.logs[getLastLogIndex()].term
}

const getLogLength = () => node.logs.length

const changeCurrentLeader = (currentLeader) => {
  node.currentLeader = currentLeader
}

const getCurrentLeader = () => {
  return node.currentLeader
}

const getLogs = () => node.logs

const getCommitIndex = () => node.commitIndex

const setNextIndex = (isJustElected) => {
  if (isJustElected) {
    for (var serverName of SERVER_ARRAY) {
      node.nextIndex[serverName] = node.logs.length
    }
  }
}

const setMatchIndex = (isJustElected) => {
  if (isJustElected) {
    for (var serverName of SERVER_ARRAY) {
      node.matchIndex[serverName] = -1
    }
  }
}

const appendLogEntry = (msg) => {
  const newLogEntry = createLogEntry(msg)
  node.logs.push(newLogEntry)
}

const getDestinationServerArr = () => {
  return SERVER_ARRAY.filter(server => node.name !== server)
}

const createLogEntry = (msg) => {
  const newLogEntry = { ...logJson }
  newLogEntry.term = node.term
  newLogEntry.key = msg.key
  newLogEntry.value = msg.value
  return newLogEntry
}

const createVoteRequest = () => {
  const msg = { ...msgJson }
  msg.sender_name = node.name
  msg.term = node.term
  msg.request = 'VOTE_REQUEST'
  msg.candidateId = node.name
  msg.lastLogIndex = getLastLogIndex()
  msg.lastLogTerm = getLastLogTerm()
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

const createAppendRPC = (destinationServer) => {
  const msg = { ...msgJson }
  msg.sender_name = node.name
  msg.request = 'APPEND_RPC'
  msg.currentLeader = getCurrentLeader()
  msg.term = node.term

  msg.prevLogIndex = getLastLogIndex()
  msg.prevLogTerm = getLastLogTerm()
  msg.leaderCommit = getCommitIndex()

  const destinationServerNextIndex = node.nextIndex[destinationServer]
  msg.entries = node.logs.slice(destinationServerNextIndex)
  msg.prevLogIndex = destinationServerNextIndex - 1

  if (destinationServerNextIndex > 0) {
    msg.prevLogTerm = node.logs[destinationServerNextIndex - 1].term
  }
  return JSON.stringify(msg)
}

const createAppendReply = (matchIndex, replyInd) => {
  const msg = { ...msgJson }
  msg.sender_name = node.name
  msg.request = 'APPEND_REPLY'
  msg.term = node.term
  msg.matchIndex = matchIndex
  msg.success =  replyInd
  return JSON.stringify(msg)
}

const modifyLeaderInfoMessage = (msg) => {
  msg.sender_name = node.name
  msg.request = 'LEADER_INFO'
  msg.term = node.term
  msg.key='LEADER'
  msg.value=getCurrentLeader()
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

  let myLastLogTerm = getLastLogTerm()

  let logOKInd = false
  if ((msg.lastLogTerm > myLastLogTerm) || ((msg.lastLogTerm === myLastLogTerm) && (msg.lastLogIndex >= getLastLogIndex()))) {
    logOKInd = true
  }
  if (msg.term === node.term && node.votedFor === '' && logOKInd) {
    changeVotedFor(msg.candidateId)
    return createVoteAcnowledgement(true, msg)
  }
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
          console.log(`UDP MESSAGE: ${JSON.parse(data).request} sent to ${destination} : ${performance.now()}`);
      });
}

const voteRequest = () => {
  incrementTerm(1)
  changeState(STATES.CANDIDATE)
  vote()
  const data = createVoteRequest()
  const serversToBeCalled = SERVER_ARRAY.filter(server => node.name !== server)
  const promises = serversToBeCalled.map(server => sender(socketServer, server, data))
  Promise.allSettled(promises)
}

let timeoutTimer = null;
let heartbeatTimer = null;

async function setElectionTimeout() {
  await clearTimeout(timeoutTimer)
  timeoutTimer = setTimeout(function resetElectionTimer() {
    voteRequest()
    timeoutTimer = setTimeout(resetElectionTimer, node.timeout)
  }, node.timeout)
}

const sendHeartbeats = () => {
  for (var serverName of SERVER_ARRAY) {
    if (serverName !== node.name) {
      const heartbeat = createAppendRPC(serverName)
      sender(socketServer, serverName, heartbeat)
    }
  }
}

function setHeartbeatsTimeout() {
  heartbeatTimer = setTimeout(function resetHeartbeatTimer() {
    if (node.state === STATES.LEADER) {
      sendHeartbeats()
      heartbeatTimer = setTimeout(resetHeartbeatTimer, node.heartbeatLength)
    }
    else {
      clearTimeout(heartbeatTimer)
    }
  }, node.heartbeatLength)
}

const becomeLeader = () => {
  clearTimeout(timeoutTimer)
  console.log(`I am LEADER ${performance.now()}`);
  changeState(STATES.LEADER)
  changeCurrentLeader(node.name)
  setNextIndex(true)
  setMatchIndex(true)
  sendHeartbeats()
  setHeartbeatsTimeout()
  voteTally = 0
}

const appendEntriesInFollower = (msg) => {
  console.log("Node details: ", JSON.stringify(node));
  if (msg.entries.length > 0 && getLastLogIndex() > msg.prevLogIndex) {
    const index = Math.min(getLastLogIndex(), msg.prevLogIndex + msg.entries.length)
    if (node.logs[index].term !== msg.entries[index - msg.prevLogIndex].term) {
      node.logs = node.logs.slice(0, msg.prevLogIndex + 1)
    }
  }
  if (msg.prevLogIndex + msg.entries.length > getLastLogIndex()) {
    node.logs = node.logs.concat(msg.entries)
  }
  if (msg.leaderCommit > node.commitIndex) {
    node.commitIndex = msg.leaderCommit
  }
}

const handleAppendRPC = (msg) => {
  if (msg.term > node.term) {
    incrementTerm(msg.term - node.term)
    changeVotedFor('')
  }
  if (msg.term === node.term) {
    changeState(STATES.FOLLOWER)
    changeCurrentLeader(msg.currentLeader)
  }
  let logOKInd = false
  if (
    getLastLogIndex() >= msg.prevLogIndex
    && ((msg.prevLogIndex === -1) || (node.logs[msg.prevLogIndex].term === msg.prevLogTerm))
  ) {
    logOKInd = true
  }
  let appendReply = null
  if (msg.term === node.term && logOKInd) {
    appendEntriesInFollower(msg)
    const matchIndex = msg.entries.length + msg.prevLogIndex
    appendReply = createAppendReply(matchIndex, true)
  }
  else {
    appendReply = createAppendReply(0, false)
  }
  setElectionTimeout()
  return appendReply
}

const commitLogEntriesInLeader = (msg) => {
  while (getCommitIndex() < getLastLogIndex()) {
    let matchIndex = 0
    for (var serverName of SERVER_ARRAY) {
      if (serverName !== node.name) {
        if (node.matchIndex[serverName] > getCommitIndex()) {
          matchIndex += 1
        }
      }
    }
    if (matchIndex >= 3) {
      node.commitIndex += 1
    }
    else
      break;
  }
}

const handleAppendReply = (msg) => {
  if(msg.term === node.term) {
    if(msg.success && msg.matchIndex >= node.matchIndex[msg.sender_name]){
      node.nextIndex[msg.sender_name] = msg.matchIndex + 1
      node.matchIndex[msg.sender_name] = msg.matchIndex
      commitLogEntriesInLeader(msg)
    }
    else if (node.nextIndex[msg.sender_name] > 0) {
      node.nextIndex[msg.sender_name] -= 1
      // check if clearTimeout & sendHeartbeat is required
    }
  }
  else if (msg.term > node.term) {
    incrementTerm(msg.term - node.term)
    changeState(STATES.FOLLOWER)
    changeVotedFor('')
  }
}


const listener = async (socketServer) => {
  setElectionTimeout()
  socketServer.on('message',function(msg, rinfo) {
    msg = JSON.parse(msg.toString())
    console.log(`MESSAGE RECEIVED: ${JSON.stringify(msg)} ${performance.now()}`);
    var destination;
    if (msg.request === 'CONVERT_FOLLOWER') {
      changeState(STATES.FOLLOWER)
      nodeIsAlive=true
    }
    else if (msg.request === 'TIMEOUT') {
      if (nodeIsAlive) {
        setElectionTimeout()
        voteRequest()
      }
    }
    else if (msg.request === 'SHUTDOWN') {
      clearTimeout(timeoutTimer)
      changeState(STATES.FOLLOWER)
      CurrState.Heartbeat = 150
      CurrState.Timeout = node.timeout
      CurrState.votedFor = node.votedFor
      CurrState.currentTerm = node.term
      fs.writeFileSync(CurrentState, JSON.stringify(CurrState));
      nodeIsAlive=false
    }
    else if (msg.request === 'LEADER_INFO') {
      if (nodeIsAlive) {
        destination = msg.sender_name
        msg = modifyLeaderInfoMessage(msg)
        sender(socketServer, destination, msg)
      }
    }
    if (nodeIsAlive) {
      if (msg.request === 'VOTE_REQUEST') {
        const responseVoteMsg = vote(msg)
        if (JSON.parse(responseVoteMsg).granted)
          setElectionTimeout()
        sender(socketServer, msg.sender_name, responseVoteMsg)
      }
      else if (msg.request === 'VOTE_ACK') {
        if (msg.term > node.term) {
          clearTimeout(timeoutTimer)
          incrementTerm(msg.term - node.term)
          changeState(STATES.FOLLOWER)
          changeVotedFor('')
          setElectionTimeout()
        }
        else if (node.state === STATES.CANDIDATE && msg.term===node.term && msg.granted) {
          voteTally++
          if (voteTally >= SERVER_ARRAY.length/2) {
            becomeLeader()
          }
        }
      }
      else if (msg.request === 'APPEND_RPC') {
        const appendReply = handleAppendRPC(msg)
        sender(socketServer, msg.sender_name, appendReply)
      }
      else if(msg.request === 'STORE'){
        if(node.state === STATES.LEADER){
          // Implement Store log request logic here
          appendLogEntry(msg)
          console.log("these are the logs at the leader: ", getLogs())
        }
        else{
          destination = msg.sender_name
          msg = modifyLeaderInfoMessage(msg)
          sender(socketServer, destination, msg)
        }
      }
      else if(msg.request === 'RETRIEVE'){
        if(node.state === STATES.LEADER){
          destination = msg.sender_name
          msg.key = 'COMMITTED_LOGS'
          if(node.commitIndex>=0){
            msg.value = node.logs.slice(0, node.commitIndex+1)
          }
          else if(node.commitIndex === -1){
            msg.value = 'No logs committed yet'
          }
          msg = JSON.stringify(msg)
          sender(socketServer, destination, msg)
        }
        else{
          destination = msg.sender_name
          msg = modifyLeaderInfoMessage(msg)
          sender(socketServer, destination, msg)
        }
      }
      else if(msg.request = 'APPEND_REPLY'){
        if(node.state === STATES.LEADER){
          handleAppendReply(msg)
        }
      }
    }
  });
}

async function main() {
    listener(socketServer)
}

main()
