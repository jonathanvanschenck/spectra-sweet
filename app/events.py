from app import socketio, spec_manager
from flask import copy_current_request_context
from flask_socketio import emit, disconnect
from flask_socketio import Namespace as _Namespace
import random as rd

def rw_gen(N):
    s = 0
    for _ in range(N):
        s += rd.randint(0,1)*2-1
        yield s
        
def rw(N):
    return list(rw_gen(N))


spec = spec_manager.get_spectrometer("")

class Namespace(_Namespace):
    def on_connect(self):
        self.emit('log_on_client', {'data': 'connected from python'})
    
    def on_disconnect(self):
        @copy_current_request_context
        def can_disconnect():
            disconnect()
        self.emit('log_on_client', {'data': 'disconnected from python'},
             callback = can_disconnect)
        
    def on_send_message(self, msg):
        print("sending message at python")
        self.emit('log_on_client', msg)



class GUINamespace(Namespace):
    def on_setup_spectrometer(self,msg):
        spec.parse_measure_type(**msg)
        self.emit('set_up_plot', {'x': list(spec.x()),
                                  'y': list(0*spec.y()),
                                  'it': str(spec.get_state()[0]),
                                  'ave': str(spec.get_state()[1])})
    
    def on_get_xy(self):
        self.emit('update_xy', {'x': list(spec.x()),
                                'y':list(spec.y())})
        
        
class RawNamespace(Namespace):
    def _cast_array(self,array):
        return ",".join(["%.3f" % val for val in array])
    
    def on_set_it(self,msg):
        it = int(msg['it'])
        spec.set_it(it)
        self.on_get_state()
        
    def on_set_ave(self,msg):
        ave = int(msg['ave'])
        spec.set_it(ave)
        self.on_get_state()
        
    def on_get_state(self):
        self.emit('log_on_client', {'data': 'State: IT={0}ms, AVE={1}'.format(*spec.get_state())})
        
    def on_get_wavelengths(self):
        self.emit('log_on_client', {'data': self._cast_array(spec.wavelengths())})
    
    def on_intensities(self,msg={'zeroed': False}):
        zeroed = msg.pop('zeroed', False)
        self.emit('log_on_client', {'data': self._cast_array(spec.intensities(zeroed=zeroed))})
    
    def on_intensities_stamp(self,msg):
        zeroed = msg.pop('zeroed', False)
        t,res = spec.intensities_stamp(zeroed=zeroed)
        self.emit('log_on_client', {'data': str(t)+","+self._cast_array(res)})
    
    def on_set_dark(self):
        spec.set_dark()
        self.emit('log_on_client', {'data': 'Dark Set'})
        
    def on_get_dark(self):
        self.emit('log_on_client', {'data': self._cast_array(spec.get_dark())})
    
    def on_ping(self,msg):
#        self.emit('log_on_client', {'data': self._cast_array(spec.get_dark()),
#                                    'invisible': False})
        self.emit('pong',msg)
        
    def on_ping2(self,msg):
#        self.emit('log_on_client', {'data': self._cast_array(spec.get_dark()),
#                                    'invisible': False})
        print("here")
        return int(msg['i'])
        #self.emit('pong',msg)

        

socketio.on_namespace(GUINamespace('/plot'))
socketio.on_namespace(RawNamespace('/raw'))
