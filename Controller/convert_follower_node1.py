import json
import socket
import traceback
import time

# Wait following seconds below sending the controller request
time.sleep(5)

# Read Message Template
msg = json.load(open("Message.json"))

# Initialize
sender = "Controller"
port = 5555

def changeToFollower(target):
    msg = json.load(open("Message.json"))
    msg['sender_name'] = sender
    msg['request'] = "CONVERT_FOLLOWER"
    print(f"Request Created : {msg}")

    skt = socket.socket(family=socket.AF_INET, type=socket.SOCK_DGRAM)
    skt.bind((sender, port))

    # Send Message
    try:
        # Encoding and sending the message
        skt.sendto(json.dumps(msg).encode('utf-8'), (target, port))
    except:
        #  socket.gaierror: [Errno -3] would be thrown if target IP container does not exist or exits, write your listener
        print(f"ERROR WHILE SENDING REQUEST ACROSS : {traceback.format_exc()}")

def timeout(target):
    msg = json.load(open("Message.json"))
    msg['sender_name'] = sender
    msg['request'] = "TIMEOUT"
    print(f"Request Created : {msg}")

    skt = socket.socket(family=socket.AF_INET, type=socket.SOCK_DGRAM)
    skt.bind((sender, port))

    # Send Message
    try:
        # Encoding and sending the message
        skt.sendto(json.dumps(msg).encode('utf-8'), (target, port))
    except:
        #  socket.gaierror: [Errno -3] would be thrown if target IP container does not exist or exits, write your listener
        print(f"ERROR WHILE SENDING REQUEST ACROSS : {traceback.format_exc()}")

def shutdown(target):
    msg = json.load(open("Message.json"))
    msg['sender_name'] = sender
    msg['request'] = "SHUTDOWN"
    print(f"Request Created : {msg}")

    skt = socket.socket(family=socket.AF_INET, type=socket.SOCK_DGRAM)
    skt.bind((sender, port))

    # Send Message
    try:
        # Encoding and sending the message
        skt.sendto(json.dumps(msg).encode('utf-8'), (target, port))
    except:
        #  socket.gaierror: [Errno -3] would be thrown if target IP container does not exist or exits, write your listener
        print(f"ERROR WHILE SENDING REQUEST ACROSS : {traceback.format_exc()}")

choice=input('Input choice :')
while choice != 'Q':
    destination=input('Input destination: ')
    if choice == 'CONVERT_FOLLOWER':
        changeToFollower(destination)
    elif choice == 'TIMEOUT':
        timeout(destination)
    elif choice == 'SHUTDOWN':
        shutdown(destination)
    elif choice == 'LEADER_INFO':
        print('In Leader info')
    else:
        print('Invalid choice. Re-enter ')
    choice=input('Re-enter choice: ')

print('Terminated')
