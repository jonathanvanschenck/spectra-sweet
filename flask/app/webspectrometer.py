#%%
import numpy as np
import time
import os

import seabreeze_server as sbs

host = os.environ.get("SERVER_HOST") or "localhost"
port = os.environ.get("SERVER_PORT") or 8002

class WebSpectrometer:
    def __init__(self, HOST = host, PORT = int(port)):
        self.specObj = sbs.client.SeaBreezeClient(HOST, PORT)
        self.specObj.select_spectrometer()
        self.set_it(100)
        self.set_ave(1)

        self.x = self.wavelengths
        def y():
            return self.intensities()
        self.y = y

    def set_it(self,it):
        self.__it = int(it)
        self.specObj.set_integration_time_micros(self.__it*1000)

    def set_ave(self,ave):
        self.__ave = int(np.clip(ave,1,1000))

    def get_state(self):
        return self.__it,self.__ave

    def wavelengths(self):
        return self.specObj.get_wavelengths()

    def intensities(self,zeroed=False):
        res = 0*self.specObj.get_wavelengths()
        for _ in range(self.__ave):
            res = res + self.specObj.get_intensities()
        if zeroed:
            return res/self.__ave-self.__dark
        else:
            return res/self.__ave

    def intensities_stamp(self,zeroed=False):
        res = self.intensities(zeroed=zeroed)
        t = time.time()
        return t,res


    def parse_measure_type(self,**kwargs):
        it = kwargs.pop('it',None)
        if it:
            try:
                _it = int(it)
            except ValueError:
                pass
            else:
                self.set_it(_it)
        ave = kwargs.pop('ave',None)
        if ave:
            try:
                _ave = int(ave)
            except ValueError:
                pass
            else:
                self.set_ave(_ave)

class WebSpectrometerManager:
    def __init__(self, HOST = host, PORT = int(port)):
        self.specObj = sbs.client.SeaBreezeClient(HOST, PORT)
        self.it = 100
        self.ave = 1
        self._wavelengths = np.array([0])

    @property
    def it(self):
        return self.__it
    @it.setter
    def it(self,IT):
        self.__it = int(IT)
        try:
            self.specObj.set_integration_time_micros(self.it*1000)
        except sbs.SeaBreezeServerError:
            pass
    @property
    def ave(self):
        return self.__ave
    @ave.setter
    def ave(self,AVE):
        self.__ave = int(AVE)

    def device_list(self):
        return self.specObj.device_list()

    def select_spectrometer(self,index):
        self.specObj.select_spectrometer(index)
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
