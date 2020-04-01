#%%
import numpy as np
import time

import seabreeze_server as sbs
    
class WebSpectrometer:
    def __init__(self, HOST = "localhost", PORT = 8002):
        self.specObj = sbs.client.SeaBreezeClient(HOST, PORT)
        self.specObj.select_spectrometer()
        self.set_it(100)
        self.set_ave(1)
        self.__wave = self.specObj.get_wavelengths()
        self.__dark = 0*self.__wave
        self.__white = np.ones_like(self.__wave)
        
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
    
    def set_dark(self):
        self.__dark = self.intensities(zeroed=False)
        
    def get_dark(self):
        return self.__dark.copy()
    
    def set_white(self):
        self.__white = self.intensities(zeroed=False)
        
    def get_white(self):
        return self.__white.copy()
    
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
        y_type = kwargs.pop("y_type",None)
        if y_type:
            y = self.y
            if y_type == "i":
                def y():
                    return self.intensities()
            elif y_type == "z":
                def y():
                    return self.intensities(zeroed=True)
            elif y_type == "r":
                def y():
                    return 1-(self.intensities(zeroed=True)/(self.__white-self.__dark))
            elif y_type == "t":
                def y():
                    return (self.intensities(zeroed=True)/(self.__white-self.__dark))
            elif y_type == "a":
                def y():
                    return -np.log10(self.intensities(zeroed=True)/(self.__white-self.__dark))
            self.y = y
        x_type = kwargs.pop("x_type",None)
        if x_type:
            x = self.x
            if x_type == "nm":
                def x():
                    return self.wavelengths()
            elif x_type == "ev":
                def x():
                    return 1238/self.wavelengths()
            elif x_type == "wn":
                def x():
                    return 1e7/self.wavelengths()
            self.x = x
                