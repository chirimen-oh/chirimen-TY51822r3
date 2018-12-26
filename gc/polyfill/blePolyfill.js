// Version 2018.12.26

(function(){

const SERVICE_UUID     = "928a3d40-e8bf-4b2b-b443-66d2569aed50";
const NOTIFY_CHAR_UUID = "928a3d41-e8bf-4b2b-b443-66d2569aed50";
const WRITE_CHAR_UUID  = "928a3d42-e8bf-4b2b-b443-66d2569aed50";
const STAT_CHAR_UUID   = "928a3d43-e8bf-4b2b-b443-66d2569aed50";

function infoLog(str){
// console.log("info: "+str);
}

function errLog(str){
  console.log("error: "+str);
}

bone = (()=> {
  function bleComm(){}
  bleComm.prototype = {
    bleDevice : null,
    notifyChar : null,
    writeChar : null,
    statChar : null,
    wss : null,
    send: null,
    queue: null,        // function queue
    onevents: null,     // onevent queue
    waitQueue: null,
    status: 0,  // 0: init 1: wait connection 2: connected 3: active
    session: 0,
    busy: 0,

    init: function (bleDevice) {
      return new Promise((resolve, reject)=>{
        infoLog("bone.init()");
        if (this.status == 3) {
	  // すでに初期化済み
          resolve(1);
        }
        this.waitQueue = new Array();
        this.queue = new Map();
        this.onevents = new Map();

        this.status = 1;
        console.log(bleDevice.name + "デバイスとの接続を行います");
        bleDevice.gatt.connect().then((bleServer)=>{
          console.log("デバイスとの接続成功");
          bleServer.getPrimaryService(SERVICE_UUID).then((bleService)=>{
            console.log("BLEサービスが見つかりました");
            bleService.getCharacteristic(NOTIFY_CHAR_UUID).then((notifyChar)=>{
              bleService.getCharacteristic(WRITE_CHAR_UUID).then((writeChar)=>{
                bleService.getCharacteristic(STAT_CHAR_UUID).then((statChar)=>{
                  console.log("キャラクタリスティックの取得に成功しました。");
                  this.bleDevice = bleDevice;
                  this.writeChar = writeChar;
                  this.notifyChar = notifyChar;
                  this.statChar = statChar;

                  // デバイスのビジーチェック
                  statChar.readValue().then((stat)=>{
//                    console.log("busy status" + stat.getInt8(0));
                    console.log("Device version" + stat.getInt8(1)); 
                    if (stat.getInt8(0) == 0) { // not busy
                      notifyChar.oncharacteristicvaluechanged = this.bleEvent;
                      notifyChar.startNotifications();
                      console.log("BLEデバイスとの接続に成功");
                      this.status = 2;
                      resolve(1);
                    } else { // busy
          	       console.log("device is busy");
          	       reject("device is busy");
                    }
                  });

                }).catch(e=>{
                  bleDevice.gatt.disconnect();
                  reject("BLEデバイス異常(3)、再度お試しください");
                });
              }).catch(e=>{
                bleDevice.gatt.disconnect();
                reject("BLEデバイス異常(2)、再度お試しください");
              });
            }).catch(e=>{
              bleDevice.gatt.disconnect();
              reject("BLEデバイス異常(1)、再度お試しください");
            });
          }).catch(e=>{
            bleDevice.gatt.disconnect();
            reject("BLEデバイスとの接続失敗、再度お試しください");
          });
        }).catch(e=>{
          console.log("BLEデバイスとの接続に失敗しました");
          reject(e);
        });
      });
    },
    deInit: function() {
      if (this.bleDevice != null) {
        this.bleDevice.gatt.disconnect();
      }

    },
    bleEvent: function(event) {  //ArrayBuffer
      var len = event.currentTarget.value.byteLength;
      var buffer = new Uint8Array(len);
      for (var cnt=0;cnt<len;cnt++) {
        buffer[cnt] = event.currentTarget.value.getInt8(cnt);
      }

      if (bone.status == 2) {
        // set busy
        var buf = new Uint8Array(2);
        buf[0] = 55;
        buf[1] = 0;
        bone.statChar.writeValue(buf);
        bone.status = 3;
      }

      if (buffer[0] == 1) {
        bone.receive(buffer);
      } else {
        bone.onEvent(buffer);
      }
    },

    bleWrite: function(buffer){
      return new Promise((resolve,reject)=>{
        this.writeChar.writeValue(buffer).then(()=> {
          resolve(0);
        }).catch(e=>{
          console.log(e);
          resolve(buffer);
        });
      });

    },

    send: function(func,data){
      return new Promise((resolve, reject)=>{
        if(this.busy != 0) {
	  console.log("bone.send() -- busy");
          return;
	}
	this.busy=1;

        if(!(data instanceof Uint8Array)){
          reject("type error: Please using with Uint8Array buffer.");
          return;
        }
        var length = data.length + 4;
        var buf = new Uint8Array(length);

        buf[0] = 1; // 1: API Request
        buf[1] = (this.session) & 0x00ff;  // session LSB
        buf[2] = (this.session >> 8);      // session MSB
        buf[3] = func;

        for(var cnt=0;cnt<data.length;cnt++){
          buf[4+cnt] = data[cnt];
        }
       
        this.queue.set(this.session,(data)=>{
	  this.busy=0;
          resolve(data);
        });
        
        this.bleWrite(buf).then((retval)=> {
          if (retval == 0) {
          } else {
            console.log("Retry BLE write");
            this.writeChar.writeValue(retval).then(()=>{
            }).catch(error=>{
              bone.deInit();
              reject("通信異常が発生しました -- 接続解除します");
            });
          }
        });

        buf=null;
        this.session ++;
        if(this.session > 0xffff){
          this.session = 0;
        }
      });
    },

    receive: function(mes){
      if(!(mes instanceof Uint8Array)){
        errLog("type error: Please using with Uint8Array buffer.");
        return;
      }
      var session = ((mes[1] & 0x00ff) | (mes[2] << 8));
      var func = this.queue.get(session);
      if(typeof func === 'function'){
        infoLog("result");
        var data = new Array();
        for(var cnt=0;cnt < (mes.length-4);cnt++){
          data.push(mes[4+cnt]);
        }
        func(data);
        this.queue.delete(session);
      }else{
        console.log("bone.receive() -- error");
        errLog("func type error: session="+session+" func="+func);
      }

    },

    registerEvent: function(f,port,func){
      var key = (f << 8) | port;
      this.onevents.set(key,func);
    },

    removeEvent: function(f,port){
      var key = (f << 8) | port;
      this.onevents.delete(key);
    },

    onEvent: function(data){
      if(!(data instanceof Uint8Array)){
        errLog("type error: Please using with Uint8Array buffer.");
        return;
      }

    // [0] Change Callback (2)
    // [1] session id LSB (0)
    // [2] session id MSB (0)
    // [3] function id (0x14)
    // [4] Port Number 
    // [5] Value (0:LOW 1:HIGH)
      var key = data[3];
      key = (key << 8)| data[4];

      var func = this.onevents.get(key);
      if(typeof func === 'function'){
        infoLog("onevent");
        func(data);
      } else {
      }
    },


    waitConnection: function(func){
      return new Promise((resolve, reject)=>{
        if(this.status == 2){
          resolve();
        }else if(this.status == 0){
          reject();
        }else{
          this.waitQueue.push((result)=>{
            if(result == true){
              resolve();
            }else{
              reject();
            }
          });
        }
      });
    }
  };

  var bc = new bleComm();
//  rt.init(serverURL);
  return bc;
})();


//////////////////////////////////////////////////////////////////////////
// GPIOAccess 
// Raspberry Pi GPIO Port Number

// todo: add portName and pinName 
var gpioPorts = [0,1,2,3,4,5,6,7,8,9,10,11,12]; 

var GPIOAccess = function () {
  this.init();
};

GPIOAccess.prototype = {
  init: function(){
    this.ports = new Map();
    for(var cnt = 0;cnt < gpioPorts.length;cnt++){
      this.ports.set(gpioPorts[cnt],new GPIOPort(gpioPorts[cnt]));
    }
  },
  ports: new Map(),
  unexportAll: null,
  onchange: null,
};

var GPIOPort = function (portNumber) {
  infoLog("GPIOPort:"+portNumber);
  this.init(portNumber);
};

GPIOPort.prototype = {
  init: function (portNumber) {
    this.portNumber = portNumber;
    this.portName = '';
    this.pinName = '';
    this.direction = '';
    this.exported = false;
    this.value = null;
    this.onchange = null;
  },

  export : function(direction){
    return new Promise((resolve,reject)=>{
      var dir = -1;
      if(direction === 'out'){
        dir = 0;
        bone.removeEvent(0x14,this.portNumber);
      }else if(direction === 'in'){
        dir = 1;
//        console.dir(bone);
        bone.registerEvent(0x14,this.portNumber,(buf)=>{
          if(typeof this.onchange === 'function'){
            infoLog("onchange");
            this.onchange(buf[5]);
          }
        });
      }else{
        reject("export:direction not valid! ["+direction+"]");
      }
      infoLog("export: Port:"+this.portNumber+" direction="+direction);
      var data = new Uint8Array([this.portNumber,dir]);
      bone.send(0x10,data).then((result)=>{
        if(result[0]==0){
          reject("GPIOPort("+this.portNumber+").export() error");
        }else{
          resolve(); 
        }
      },(error)=>{
        reject(error);
      });
    });
  },
  read : function(){
    return new Promise((resolve,reject)=>{
      infoLog("read: Port:"+this.portNumber);
      var data = new Uint8Array([this.portNumber]);
      bone.send(0x12,data).then((result)=>{
        if(result[0]==0){
          reject("GPIOPort("+this.portNumber+").read() error");
        }else{
          resolve(result[1]); 
        }
      },(error)=>{
        reject(error);
      });
    });
  },
  write : function(value){
    return new Promise((resolve,reject)=>{
      infoLog("write: Port:"+this.portNumber+" value="+value);
      var data = new Uint8Array([this.portNumber,value]);
      bone.send(0x11,data).then((result)=>{
        if(result[0]==0){
          reject("GPIOPort("+this.portNumber+").write() error");
        }else{
          resolve(); 
        }
      },(error)=>{
        reject(error);
      });
    });
  },
  onchange : null,
  unexport : function(){
    return new Promise((resolve,reject)=>{
      infoLog("unexport: Port:"+this.portNumber);
      var data = new Uint8Array([this.portNumber,value]);
      bone.send(0x13,data).then((result)=>{
        if(result[0]==0){
          reject("GPIOPort("+this.portNumber+").unexport() error");
        }else{
          resolve(); 
        }
      },(error)=>{
        reject(error);
      });
    });
  }
};

//////////////////////////////////////////////////////////////////////////
// I2CAccess 

var i2cPorts = [1]; 

var I2CAccess = function () {
  this.init();
};

I2CAccess.prototype = {
  init: function(){
    this.ports = new Map();
    for(var cnt = 0;cnt < i2cPorts.length;cnt++){
      this.ports.set(i2cPorts[cnt],new I2CPort(i2cPorts[cnt]));
    }
  },
  ports: new Map()
};

function I2CPort(portNumber) {
  this.init(portNumber);
}

I2CPort.prototype = {
  init: function (portNumber) {
    this.portNumber = portNumber;
  },

  portNumber: 0,
  open: function (slaveAddress){
    return new Promise((resolve,reject)=>{
      new I2CSlaveDevice(this.portNumber, slaveAddress).then((i2cslave)=>{
        resolve(i2cslave);
      },(err)=>{
        reject(err);
      });
    });
  },
};

function I2CSlaveDevice(portNumber,slaveAddress){
  return new Promise((resolve,reject)=>{
    this.init(portNumber, slaveAddress).then(()=>{
      resolve(this);
    },(err)=>{
      reject(err);
    });
  });
}

I2CSlaveDevice.prototype = {
  portNumber:null,
  slaveAddress:null,
  slaveDevice:null,

  init: function (portNumber,slaveAddress) {
    return new Promise((resolve,reject)=>{
      this.portNumber = portNumber;
      this.slaveAddress = slaveAddress;
      var data = new Uint8Array([this.slaveAddress,1]);
      bone.send(0x20,data).then((result)=>{
        if(result[0] != 0){
          infoLog("I2CSlaveDevice.init() result OK");
          resolve(this); 
        }else{
          errLog("I2CSlaveDevice.init() result NG");
          reject("I2CSlaveDevice.init() result NG:");
        }
      },(error)=>{
        reject(error);
      });
    });
  },

  read8: function (registerNumber) {
    return new Promise((resolve, reject)=>{
      var data = new Uint8Array([this.slaveAddress,registerNumber,1]);
      bone.send(0x23,data).then((result)=>{
        infoLog("I2CSlaveDevice.read8() result value="+result);
        var readSize = result[0];
        if(readSize == 1){
          resolve(result[1]); 
        }else{
          reject("read8() readSize unmatch : "+readSize);
        }
      },(error)=>{
        console.log("i2c.read8() error: ",error);
        reject(error);
      });
    },(error)=>{
        console.log("error: ",error);
    });
  },

  read16: function (registerNumber) {
    return new Promise((resolve, reject)=>{
      infoLog("I2CSlaveDevice.read16() registerNumber="+registerNumber);
      var data = new Uint8Array([this.slaveAddress,registerNumber,2]);
      bone.send(0x23,data).then((result)=>{
        infoLog("I2CSlaveDevice.write8() result value="+result);
        var readSize = result[0];
        if(readSize == 2){
          var res_l = result[1];
          var res_h = result[2];
          var res = res_l + (res_h << 8);
          resolve(res); 
        }else{
          reject("read16() readSize unmatch : "+readSize);
        }
      },(error)=>{
        reject(error);
      });
    });
  },

  write8: function (registerNumber, value) {
    return new Promise((resolve, reject)=>{
      infoLog("I2CSlaveDevice.write8() registerNumber="+registerNumber," value="+value);
      var size = 2;
      var data = new Uint8Array([this.slaveAddress,size,registerNumber,value]);
      bone.send(0x21,data).then((result)=>{
        infoLog("I2CSlaveDevice.write8() result value="+result);
        if(result[0] != size){
          reject("I2CSlaveAddress("+this.slaveAddress+").write8():error")          
        }else{
          resolve();
        }
      },(error)=>{
        reject(error);
      });
    });
  },

  write16: function (registerNumber, value) {
    return new Promise((resolve, reject)=>{
      infoLog("I2CSlaveDevice.write16() registerNumber="+registerNumber," value="+value);
      var value_L = value & 0x00ff;
      var value_H = (value >> 8) & 0x00ff;
      var size = 3;
      var data = new Uint8Array([this.slaveAddress,size,registerNumber,value_L,value_H]);
      bone.send(0x21,data).then((result)=>{
        infoLog("I2CSlaveDevice.write16() result value="+result);
        if(result[0] != size){
          reject("I2CSlaveAddress("+this.slaveAddress+").write16():error")          
        }else{
          resolve();
        }
      },(error)=>{
        reject(error);
      });
    });
  },

  readByte: function () {
    return new Promise((resolve, reject)=>{
      var data = new Uint8Array([this.slaveAddress,1]);
      bone.send(0x22,data).then((result)=>{
        infoLog("I2CSlaveDevice.readByte() result value="+result);
        var readSize = result[0];
        if(readSize == 1){
          resolve(result[1]); 
        }else{
          reject("readByte() readSize unmatch : "+readSize);
        }
      },(error)=>{
        reject(error);
      });
    });
  },

  readBytes: function (length) {
    return new Promise((resolve, reject)=>{
      if((typeof length !== 'number')||(length > 127)){
        reject("readBytes() readSize error : "+length);
      }
      var data = new Uint8Array([this.slaveAddress,length]);
      bone.send(0x22,data).then((result)=>{
        infoLog("I2CSlaveDevice.readBytes() result value="+result);
        var readSize = result[0];
        if(readSize == length){
          var buffer = result;
          buffer.shift();  // readSizeを削除
          resolve(buffer); 
        }else{
          reject("readBytes() readSize unmatch : "+readSize);
        }
      },(error)=>{
        reject(error);
      });
    });
  },

  writeByte: function (value) {
    return new Promise((resolve, reject)=>{
      infoLog("I2CSlaveDevice.writeByte() value="+value);
      var size = 1;
      var data = new Uint8Array([this.slaveAddress,size,value]);
      bone.send(0x21,data).then((result)=>{
        infoLog("I2CSlaveDevice.writeByte() result"+result);
        if(result[0] != size){
          reject("I2CSlaveAddress("+this.slaveAddress+").writeByte():error")          
        }else{
          resolve();
        }
      },(error)=>{
        reject(error);
      });
    });
  },

  writeBytes: function (buffer) {
    return new Promise((resolve, reject)=>{
      if(buffer.length == null){
        reject("readBytes() parameter error : "+buffer);
      }
      var arr = [this.slaveAddress,buffer.length];
      for(var cnt=0;cnt < buffer.length;cnt ++){
        arr.push(buffer[cnt]);
      }
      var data = new Uint8Array(arr);
      bone.send(0x21,data).then((result)=>{
        infoLog("I2CSlaveDevice.writeBytes() result value="+result);
        if(result[0] == buffer.length){
          var resbuffer = result;
          resbuffer.shift();  // readSizeを削除
          resolve(resbuffer); 
        }else{
          reject("writeBytes() writeSize unmatch : "+result[0]);
        }
      },(error)=>{
        reject(error);
      });
    });
  }

};


//////////////////////////////////////////////////////////////////////////
// navigator 
if (!navigator.requestI2CAccess) {
  navigator.requestI2CAccess = function (bleDevice) {
    return new Promise(function(resolve,reject){
      bone.init(bleDevice).then((result)=>{
        var i2cAccess = new I2CAccess();
        infoLog("i2cAccess.resolve");
        resolve(i2cAccess);
      }).catch(e=>{
        reject(e);
      });
    });
  };
}

if (!navigator.requestGPIOAccess) {
  navigator.requestGPIOAccess = function (bleDevice) {
    return new Promise(function(resolve,reject){
      bone.init(bleDevice).then((result)=>{
        var gpioAccess = new GPIOAccess();
        infoLog("gpioAccess.resolve");
        resolve(gpioAccess);
      }).catch(e=>{
        reject(e);
      });
    });
  };
}

})()

//////////////////////////////////////////////////////////////////////////
// common utility functions

/**
 * Utility function for async/await code.
 * @param {number} ms - milliseconds to wait
 * @return {Promise} A promise to be resolved after ms milliseconds later.
 */
function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
