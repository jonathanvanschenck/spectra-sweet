from app import socketio
from flask import copy_current_request_context
from flask_socketio import disconnect
from flask_socketio import Namespace as _Namespace
from seabreeze_server import SeaBreezeServerError
from seabreeze.cseabreeze import SeaBreezeError

from app.webspectrometer import WebSpectrometerManager

sm = WebSpectrometerManager()

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


# TODO: ConnectionRefusedError is broken, since LITERALLY EVERYTHING requires
#  The server to be up. Maybe add a whole wrapper error check?

class GUINamespace(Namespace):
    def on_select_spectrometer(self,msg):
        index = int(msg['index'])
        success = True
        try:
            sm.select_spectrometer(index)
        except (SeaBreezeServerError,ConnectionRefusedError):
            self.emit('detach_spectrometer',{'dev_list':sm.list_devices()})
        self.emit('attach_spectrometer',{'serial_number':sm.serial_number})

    def on_deselect_spectrometer(self):
        sm.deselect_spectrometer()
        self.emit('detach_spectrometer',{'dev_list':sm.list_devices()})

    def on_get_device_list(self):
        self.emit('update_device_list',{'dev_list':sm.list_devices()})

    def on_setup_spectrometer(self,msg):
        try:
            sm.parse_measure_type(**msg)
            i = sm.intensities()
        except (SeaBreezeServerError,SeaBreezeError,ConnectionRefusedError):
            # either not selected, or not opened, or docker dead
            self.emit('detach_spectrometer',{'dev_list':sm.list_devices()})
        else:
            self.emit('set_up_plot', {'x': list(sm.wavelengths()),
                                      'y': list(i),
                                      'it': str(sm.it),
                                      'ave': str(sm.ave)})

    def on_get_xy(self):
        try:
            i = sm.intensities()
        except (SeaBreezeServerError,SeaBreezeError,ConnectionRefusedError):
            # either not selected, or not opened, or docker dead
            self.emit('detach_spectrometer',{'dev_list':sm.list_devices()})
        else:
            self.emit('update_xy', {'x': list(sm.wavelengths()),
                                    'y': list(i)})

socketio.on_namespace(GUINamespace('/plot'))
