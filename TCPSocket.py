import socket

class MessageSocket:
    def __init__(self,VanillaSocket):
        self.s = VanillaSocket
        
    def msend(self,msg):
        mL = len(msg)
        msg = ("{:0>5}".format(mL)).encode()+msg.encode()
        totsent = 0
        while totsent<=mL:
            sent = self.s.send(msg[totsent:])
            if sent==0:
                raise RuntimeError("Socket connection is broken")
            totsent += sent
        return totsent
        
    def mrecv(self):
        chunks = []
        bytes_recv = 0
        while bytes_recv<5:
            chunk = self.s.recv(5-bytes_recv)
            if chunk == b'':
                raise RuntimeError("Socket connection is broken")
            chunks.append(chunk)
            bytes_recv += len(chunk)
        mL = int(b''.join(chunks))
        bytes_recv = 0
        while bytes_recv<mL:
            chunk = self.s.recv(min(mL-bytes_recv,2048))
            if chunk == b'':
                raise RuntimeError("Socket connection is broken")
            chunks.append(chunk)
            bytes_recv += len(chunk)
        return (b''.join(chunks))[5:].decode()
    
