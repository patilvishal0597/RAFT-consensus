import json
import socket
import traceback
import time
import threading
# Wait following seconds below sending the controller request
time.sleep(5)

# Read Message Template
msg = json.load(open("Message.json"))

def listener(skt):
    while True:
        try:
            msg, addr = skt.recvfrom(1024)
        except:
            print(f"ERROR while fetching from socket : {traceback.print_exc()}")

        # Decoding the Message received from Node 1
        decoded_msg = json.loads(msg.decode('utf-8'))
        print(f"Message Received : {decoded_msg} From : {addr}")

# threading.Thread(target=listener, args=[skt]).start()

def changeToFollower(skt, target):
    msg = json.load(open("Message.json"))
    msg['sender_name'] = sender
    msg['request'] = "CONVERT_FOLLOWER"
    print(f"Request Created : {msg}")

    # Send Message
    try:
        # Encoding and sending the message
        skt.sendto(json.dumps(msg).encode('utf-8'), (target, port))
    except:
        #  socket.gaierror: [Errno -3] would be thrown if target IP container does not exist or exits, write your listener
        print(f"ERROR WHILE SENDING REQUEST ACROSS : {traceback.format_exc()}")

def timeout(skt, target):
    msg = json.load(open("Message.json"))
    msg['sender_name'] = sender
    msg['request'] = "TIMEOUT"
    print(f"Request Created : {msg}")

    # Send Message
    try:
        # Encoding and sending the message
        skt.sendto(json.dumps(msg).encode('utf-8'), (target, port))
    except:
        #  socket.gaierror: [Errno -3] would be thrown if target IP container does not exist or exits, write your listener
        print(f"ERROR WHILE SENDING REQUEST ACROSS : {traceback.format_exc()}")

def shutdown(skt, target):
    msg = json.load(open("Message.json"))
    msg['sender_name'] = sender
    msg['request'] = "SHUTDOWN"
    print(f"Request Created : {msg}")

    # Send Message
    try:
        # Encoding and sending the message
        skt.sendto(json.dumps(msg).encode('utf-8'), (target, port))
    except:
        #  socket.gaierror: [Errno -3] would be thrown if target IP container does not exist or exits, write your listener
        print(f"ERROR WHILE SENDING REQUEST ACROSS : {traceback.format_exc()}")

def leaderInfo(skt, target):
    msg = json.load(open("Message.json"))
    msg['sender_name'] = sender
    msg['request'] = "LEADER_INFO"
    print(f"Request Created : {msg}")

    # Send Message
    try:
        # Encoding and sending the message
        skt.sendto(json.dumps(msg).encode('utf-8'), (target, port))
    except:
        print(f"ERROR WHILE SENDING REQUEST ACROSS : {traceback.format_exc()}")


def store(skt, target):
    key = input('enter key: ')
    value = input('enter value: ')
    msg = json.load(open("Message.json"))
    msg['sender_name'] = sender
    msg['request'] = "STORE"
    msg['key'] = key
    msg['value'] = value
    print(f"Store request Created : {msg}")

    # Send Message
    try:
        # Encoding and sending the message
        skt.sendto(json.dumps(msg).encode('utf-8'), (target, port))
    except:
        print(f"ERROR WHILE SENDING REQUEST ACROSS : {traceback.format_exc()}")


def retrieve(skt, target):
    msg = json.load(open("Message.json"))
    msg['sender_name'] = sender
    msg['request'] = "RETRIEVE"
    print(f"Request Created : {msg}")

    # Send Message
    try:
        # Encoding and sending the message
        skt.sendto(json.dumps(msg).encode('utf-8'), (target, port))
    except:
        print(f"ERROR WHILE SENDING REQUEST ACROSS : {traceback.format_exc()}")

    print("retrieve request is called")



if __name__ == "__main__":
    # Initialize
    sender = "Controller"
    port = 5555

    skt = socket.socket(family=socket.AF_INET, type=socket.SOCK_DGRAM)
    skt.bind((sender, port))

    threading.Thread(target=listener, args=[skt]).start()

    choice=input('Input choice :')
    while choice != 'Q':
        destination=input('Input destination: ')
        if choice == 'CONVERT_FOLLOWER':
            changeToFollower(skt, destination)
        elif choice == 'TIMEOUT':
            timeout(skt, destination)
        elif choice == 'SHUTDOWN':
            shutdown(skt, destination)
        elif choice == 'LEADER_INFO':
            leaderInfo(skt, destination)
        elif choice == 'STORE':
            store(skt, destination)
        elif choice == 'RETRIEVE':
            retrieve(skt, destination)
        else:
            print('Invalid choice. Re-enter ')
        choice=input('Re-enter choice: ')

print('Terminated')
