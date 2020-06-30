#%%
import numpy as np
import time
import os

import seabreeze_server as sbs
# from seabreeze.cseabreeze import SeaBreezeError

host = os.environ.get("SERVER_HOST") or "localhost"
port = os.environ.get("SERVER_PORT") or 8002

class WebSpectrometerManager:
    def __init__(self, HOST = host, PORT = int(port)):
        self.specObj = sbs.client.SeaBreezeClient(HOST, PORT)
        self._itrangeus = 1000,10000000
        self.__it = 100
        self.__ave = 1
        self._wavelengths = np.array([0])
        try:
            self.select_spectrometer(0)
        except:
            pass

    @property
    def it(self):
        return self.__it
    @it.setter
    def it(self,IT):
        self.__it = int(np.clip(IT,self._itrangeus[0]/1e3,self._itrangeus[1]/1e3))
        try:
            self.specObj.set_integration_time_micros(self.__it*1000)
        except sbs.SeaBreezeServerError:
            pass

    @property
    def ave(self):
        return self.__ave
    @ave.setter
    def ave(self,AVE):
        self.__ave = int(np.clip(AVE,1,1000))

    @property
    def serial_number(self):
        try:
            return self.specObj.serial_number()
        except sbs.SeaBreezeServerError:
            return None

    def list_devices(self):
        return self.specObj.list_devices()

    def select_spectrometer(self,index):
        self.specObj.select_spectrometer(index)
        self._itrangeus = self.specObj.features_call("spectrometer","get_integration_time_micros_limits")
        self.specObj.set_integration_time_micros(self.it*1000)
        self._wavelengths = self.specObj.get_wavelengths()

    def deselect_spectrometer(self):
        self.specObj.deselect_spectrometer()

    def wavelengths(self):
        return self._wavelengths

    def intensities(self):
        res = 0*self.wavelengths()
        for _ in range(self.ave):
            res = res + self.specObj.get_intensities()
        else:
            return res/self.ave

    def parse_measure_type(self,**kwargs):
        it = kwargs.pop('it',None)
        if it:
            try:
                _it = int(it)
            except ValueError:
                pass
            else:
                self.it = _it
        ave = kwargs.pop('ave',None)
        if ave:
            try:
                _ave = int(ave)
            except ValueError:
                pass
            else:
                self.ave = _ave

if __name__ == "__main__":
    wsm = WebSpectrometerManager()
