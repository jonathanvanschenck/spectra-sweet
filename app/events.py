from app import socketio
from flask import copy_current_request_context
from flask_socketio import disconnect
from flask_socketio import Namespace as _Namespace

from app.webspectrometer import WebSpectrometer

spec = WebSpectrometer('localhost',8002)

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

socketio.on_namespace(GUINamespace('/plot'))
