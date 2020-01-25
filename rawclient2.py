import socketio
import numpy as np
import time

class Namespace(socketio.ClientNamespace):
    def on_connect(self):
        print("connected locally")
    def on_disconnect(self):
        print("disconnect")
    def on_reconnect(self):
        print("disconnect")
        
    def on_log_on_client(self,msg):
        invisible = msg.pop('invisible',False)
        if not invisible:
            print("Revcieved: ",msg['data'])
        
    def on_pong(self,msg):
        pong(int(msg['i']))


sio = socketio.Client()
sio.register_namespace(Namespace('/raw'))
sio.connect('http://localhost:5000')
sio.disconnect()
#print("Here")
#sio.emit('send_message', data = {'data': 'Does this work?'})
#sio.emit('send_message', data = {'data': 'Or Does this work?'})

#N = 3
#start = np.zeros(N)
#stop = np.zeros(N)
#def ping(i):
#    start[i] = time.time()
#    sio.emit('ping',{'i': i})
#def pong(i):
#    stop[i] = time.time()
#    print("Delay = {}".format(stop[i]-start[i]))
#
#
#print("starting . . .")
#for i in range(N):
#    ping(i)
    
#sio.wait(5)
#sio.disconnect()