var VEML6070 = function(i2cPort){
  this.i2cPort = i2cPort;
  this.slaveAddressLSB = 0x38;
  this.slaveAddressMSB = 0x39;
  this.i2cSlaveLSB = null;
  this.i2cSlaveMSB = null;
};

VEML6070.prototype = {
  init:function(){
    return new Promise((resolve, reject)=>{
      this.i2cPort.open(this.slaveAddressLSB).then((i2cSlaveLSB)=>{
        this.i2cSlaveLSB = i2cSlaveLSB;
        this.i2cPort.open(this.slaveAddressMSB).then((i2cSlaveMSB)=>{
          this.i2cSlaveMSB = i2cSlaveMSB;
          this.i2cSlaveLSB.writeByte(0x06).then(()=>{
            resolve();
          });
        });
      });
    });
  },
  read:function(){
    return new Promise(async(resolve, reject)=>{
        var LSB = await this.i2cSlaveLSB.readByte();
        var MSB = await this.i2cSlaveMSB.readByte();
        var value = (MSB << 8) + LSB;
        resolve(value);
    });  
  }
};
