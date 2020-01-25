#%%
from socketIO_client import SocketIO, BaseNamespace
import time
import numpy as np

class Namespace(BaseNamespace):
    def on_connect(self):
        print("connect")
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

socketIO = SocketIO('localhost', 5000)
raw_namespace = socketIO.define(Namespace, "/raw")


N = 3
start = np.zeros(N)
stop = np.zeros(N)
def ping(i):
    start[i] = time.time()
    raw_namespace.emit('ping',{'i': i})
def pong(i):
    stop[i] = time.time()
    print("Delay = {}".format(stop[i]-start[i]))

print("starting . . .")
for i in range(N):
    ping(i)
    socketIO.wait(seconds=0.1)
#for i in range(10):
#    socketIO.wait(seconds=1)
#    print("Waited {} seconds".format(i+1))
#%%
