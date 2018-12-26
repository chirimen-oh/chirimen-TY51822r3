var GENERIC_I2C = function(i2cPort,slaveAddress) {
  this.i2cPort = i2cPort;
  this.i2cSlave = null;
  this.slaveAddress = slaveAddress;
}

GENERIC_I2C.prototype = {
  sleep: function(ms){
    return new Promise((resolve)=>{setTimeout(resolve,ms);});
  },
  init: function() {
    return new Promise((resolve, reject)=>{
      this.i2cPort.open(this.slaveAddress).then(async (i2cSlave)=>{
        this.i2cSlave = i2cSlave;
//        await this.sleep(10);
        resolve();
      }).catch((reason)=>{
        reject(reason);
      });
    });
  },

  // read array data
  readArray: function(length) {
    return new Promise(async (resolve, reject)=>{
      try {
        if(this.i2cSlave == null){
          reject("i2cSlave Address does'nt yet open!");
        }else{
          var readData = await this.i2cSlave.readBytes(length);
          resolve(readData);
        }
      } catch(e) {
        reject(e);
      }
    });
  },

  // read data with subaddress(8bit)
  read8SA: function(subaddress) {
    return new Promise(async (resolve, reject)=>{
      try {
        if(this.i2cSlave == null){
          reject("i2cSlave Address does'nt yet open!");
        }else{
          var readData = await this.i2cSlave.read8(subaddress);
          resolve(readData);
        }
      } catch(e) {
        reject(e);
      }
    });
  },

  // read data with subaddress(16bit)
  read16SA: function(subaddress) {
    return new Promise(async (resolve, reject)=>{
      try {
      	  if(this.i2cSlave == null){
          reject("i2cSlave Address does'nt yet open!");
        }else{
          var readData = await this.i2cSlave.read16(subaddress);
          resolve(readData);
        }
      } catch(e) {
        reject(e);
      }
    });
  },

  // write array data
  writeArray: function(dataArray) {
    return new Promise(async (resolve, reject)=>{
      try {
        if(this.i2cSlave == null){
          reject("i2cSlave Address does'nt yet open!");
        }else{
          var resolveData = await this.i2cSlave.writeBytes(dataArray); 
          resolve(resolveData);
        }
      } catch(e) {
        reject(e);
      }
    });
  },

  // write data with subaddress(8bit)
  write8SA: function(subaddress,data) {
    return new Promise(async (resolve, reject)=>{
      try {
        if(this.i2cSlave == null){
          reject("i2cSlave Address does'nt yet open!");
        }else{
          var resolveData = await this.i2cSlave.write8(subaddress,data);
          resolve(resolveData);
        }
      } catch(e) {
        reject(e);
      }
    });
  },

  // write data with subaddress(16bit)
  write16SA: function(subaddress,data) {
    return new Promise(async (resolve, reject)=>{
      try {
        if(this.i2cSlave == null){
          reject("i2cSlave Address does'nt yet open!");
        }else{
          var resolveData = await this.i2cSlave.write16(subaddress,data);
          resolve(resolveData);
        }
      } catch(e) {
        reject(e);
      }

    });
  }

}
