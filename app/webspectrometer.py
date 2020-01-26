#%%
import numpy as np
import time
#%%
class SpectrometerManager:
    def __init__(self,emulate=False):
        if emulate:
            sb = FakeSeaBreeze()
        else:
            import seabreeze.spectrometers as sb
        self.sb = sb
        
    def device_list(self):
        return self.sb.device_list()
    
    def get_spectrometer(self,dev):
        return WebSpectrometer(self.sb.Spectrometer(dev))
    
class WebSpectrometer:
    def __init__(self,sbSpecObj):
        self.specObj = sbSpecObj
        self.set_it(100)
        self.set_ave(1)
        self.__wave = self.specObj.wavelengths()
        self.__dark = 0*self.__wave
        self.__white = np.ones_like(self.__wave)
        
        self.x = self.wavelengths
        def y():
            return self.intensities()
        self.y = y
        
    def close(self):
        self.specObj.close()
        
    def set_it(self,it):
        self.__it = int(it)
        self.specObj.integration_time_micros(self.__it*1000)
        
    def set_ave(self,ave):
        self.__ave = int(np.clip(ave,1,1000))
        
    def get_state(self):
        return self.__it,self.__ave
    
    def wavelengths(self):
        return self.specObj.wavelengths()
    
    def intensities(self,zeroed=False):
        res = 0*self.specObj.wavelengths()
        for _ in range(self.__ave):
            res = res + self.specObj.intensities()
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
                
#%%
# Create Spectrometer Emulators
class FakeSeabreezeSpectrometer:
    def __init__(self,dev):
        self.__w = np.arange(300,1001,0.17)
        self.__it = 100*1000#us
        self.__s = np.exp(-((self.__w - 500)/100)**2)
        self.connected = True
    
    def close(self):
        self.connected = False
    
    def wavelengths(self):
        if not self.connected:
            raise Exception("Devcie is disconncted")
        return self.__w
    
    def integration_time_micros(self,it):
        if not self.connected:
            raise Exception("Devcie is disconncted")
        self.__it = int(np.clip(it,3*1000,10*1000*1000))
        
    def intensities(self):
        if not self.connected:
            raise Exception("Devcie is disconncted")
        res = 100 + self.__it*self.__s/100 + np.random.normal(scale=20,size=len(self.__s))
        time.sleep(self.__it/10**6)
        return np.clip(res,0,4001)
    
class FakeSeaBreeze:
    def __init__(self):
        pass
    
    def device_list(self):
        return ["<Fake Spectrometer>"]
    
    def Spectrometer(self,dev):
        return FakeSeabreezeSpectrometer(dev)