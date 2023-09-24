# RAFT-consensus
Distributed Systems - RAFT Consensus Algorithm

## 1.  Introduction
The objective of the project is to implement a basic version of RAFT. We incorporated Heartbeats,
Timeouts, remote-procedure-calls (RPCs) on each node. Node.js was used to implement the RAFT algorithm. We leveraged the setTimeout function, non-blocking IO operation, and event-driven nature of
Node.js to achieve our results.
All the above functionalities are implemented in one single file. Docker uses this single image
to up multiple nodes. These nodes are connected over a docker network to function.

## 2.  Design Overview
+ For this phase, 5 server nodes, that are connected to each other using socket connections are
implemented.
+ These 5 nodes interact with each other by:
  * Sending/Receiving vote requests
  * Sending/receiving vote acknowledgments
  * Sending(by leader)/receiving(by followers) heartbeats (Append Entry)
  * Sending heartbeat acknowledgment (from followers to leader) (Append Reply)
+ A controller node is also used to interact with the nodes in our system
+ The controller also connects to the nodes using socket connections and sends commands to
the specified nodes at a time

## 3. Implementation
The project is built using the docker-compose.yaml file. As shown in the fig below, running the
the command does the following things:

+ It builds the image for the node using the Dockerfile specified in the yaml file
+ 5 nodes containers are created from the above image and a controller container
+ The nodes have same logic

### 3.1  Leader Election
Each node has can have 3 states:

+ Follower
+ Candidate
+ Leader

There are 2 important remote procedure calls used:

+ RequestForVoteRPC: This call is used by the follower node that times out first and becomes
a candidate. A node times out when it doesn’t receive an AppendRPC
+ AppendRPC: This call is sent out by the Leader node to other nodes as heartbeat packets
when there are additional log updates so that the other nodes don’t time out and start
another election. If there is a log update, the append RPC call is used to send the logs to all
the followers

Each node starts as a follower upon booting. Each node waits for the leader’s communication before
its timeout. Once the node times out, it becomes a candidate and sends a vote request to
all other nodes in the network. When other nodes receive these vote requests, they will send vote
acknowledgments back to the candidate. The acknowledgments might be positive (vote is granted)
or negative. If the candidate receives majority votes, the node becomes the leader. Upon becoming leader,
the node will send AppendRPCs to follower nodes. These nodes will continue being followers until
they time out and start the election again. In nodejs, timeouts have been implemented by setTimeout
functions

### 3.2 Log Replication
(Important concepts for safe log replication: prevLogIndex, prevLogTerm, nextIndex, and leader’s
commitIndex)
The AppendEntry RPC is used to replicate the logs on the follower nodes

Steps:
+ The client’s request gets appended to the leaders’s log
+ Based on nextIndex[], the leader will send this request to the followers by passing the request in the AppendEntry RPC with the prevLogIndex, prevLogTerm, and leader’s
commitIndex
+ Each follower will check to see if it needs to accept/reject the AppendEntry RPC by doing a
log consistency check
+ If the follower accepts the AppendRPC, then it appends the entry to its own log and sends an
APPEND REPLY with success value as ”true”. The Leader on receiving a True, will update
the nextIndex and matchIndex values.
+ If the follower rejects, the follower sends an APPEND REPLY with a success value as ”False”. a. Once
the leader receives a rejection from the follower, the leader will decrement the nextIndex[] for
that particular follower by 1 and will send the previous log entry at that position back to
the follower. b. The leader will retry the AppendEntry RPC again and again by following
(a) till it eventually reaches a point where the leader and follower’s log match

## Log replication: Phase2 and Phase4 difference
In phase2, we implemented a very basic log replication technique, where we just forwarded the requests
from clients to store values from a static leader to all the other nodes. 3 nodes were used, which
just accept the forwarded store requests from the leader. There was no guarantee that the values
stored on the 3 different data-based are consistent as there is no saying that one of the nodes
goes down for some reason and is not able to store incoming data or the same results due to some
network reasons. Since the leader is static, the entire node cluster will be useless if the leader goes
down.
In phase3 and phase4, we follow the RAFT consensus algorithm that guarantees that the values
that are ”committed” are consistent throughout all the nodes and there would be no conflict on
the data that is present at a certain index on all of the nodes. RAFT ensures that even if the leader
of the cluster goes down, there will be a new leader election in which, a candidate with the highest
term and proper log consistency dictated by the RAFT algorithm, will be elected as the new leader.
The functioning of the cluster will be resumed as per the algorithm again.

## Validation

4 operations have been performed for validation purposes. The controller container is used for sending
these requests to a certain node:
+ **CONVERT FOLLOWER**: This request forces a node to change its state to a follower. So If
a leader receives this, It will convert to a follower and an election will start.
+ TIMEOUT: This request times the target node out. So it becomes a candidate with an
increased term. It becomes the leader if it receives the majority votes.
+ **SHUTDOWN**: This request will simply make the target node to not process any packets.
This node then becomes as good as a dead node. NOTE: We have implemented this in a way that
we can start this node again by sending a _**CONVERT FOLLOWER**_ request, which basically
acts as a restart request similar to the ones in the RAFT.io simulation.
+ **LEADER INFO**: This request sent to any node, will return the key: _**LEADER**_ value: _Node?_
where _Node?_ would be the leader at the time of this request received. This msg is sent to the
controller and is printed in the controller’s container console as shown in Figure 7 below.
+ **STORE**: This request sends a store data request to a node from the cluster. If the node that
receives the msg is not a leader, then the node returns a leader info packet to the controller.
If the node is indeed the leader, it stores the packet on the leader’s local log.
+ **RETRIEVE**: This request returns back the committed logs to the controller if received by
the leader. if the node that receives is not the leader, it returns back the leader info packet
to the controller.
The below images show the output of the operations mentioned above.
 
