#%%
import socket
import threading
import socketserver
import numpy as np

#np.frombuffer(np.array([0.0,1.0]).tobytes())

#% server

bufsize = 16384+1

class ThreadedTCPRequestHandler(socketserver.StreamRequestHandler):
    # i = 0.0
    
    # def handle(self):
    #     self.i += 1
    #     data = np.array([self.i]).tobytes()
    #     self.request.sendall(data)
    def handle(self):
        msg = self.rfile.readline().strip()
        t = np.arange(2048,dtype=float)
        self.wfile.write(t.tobytes()+b'\n'+t.tobytes()+b'\n')
        
class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    pass

def client(ip, port, msg):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect((ip, port))
        sock.sendall(bytes(msg, 'ascii'))
        # buff = [b'']
        # while True:
        #     msg = sock.recv(1024)
        #     msgpacket = msg.split(b'\n')
        #     print(msg)
        #     if msgpacket == [b'']:
        #         break
        #     buff[-1] = buff[-1] + msgpacket[0]
        #     buff = buff + msgpacket[1:]
        # buff = [b.decode() for b in buff]
        # buff = sock.recv(1024).strip().decode()
        # res = np.frombuffer()
        buff = b''
        while True:
            msg2 = sock.recv(bufsize)
            # print(msg2)
            if msg2 == b'':
                break
            buff = buff + msg2
        # print(buff.strip(b'\n'))
        buff = [np.frombuffer(b) for b in buff.strip().split(b'\n')]
        print("Got: {}".format(buff))
        
        
        
if __name__ == "__main__":
    HOST, PORT = "localhost", 0
    
    server = ThreadedTCPServer((HOST,PORT), ThreadedTCPRequestHandler)
    with server:
        ip, port = server.server_address
        
        server_thread = threading.Thread(target=server.serve_forever)
        
        server_thread.daemon = True
        server_thread.start()
        print("Server Running at: ", server.server_address)
        
        client(ip,port, "Bobby\n")
        client(ip,port, "He is my friend\n")
        
        server.shutdown()



#%% client




