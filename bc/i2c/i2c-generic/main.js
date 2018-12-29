"use strict";

const DEVICE_UUID     = "928a3d40-e8bf-4b2b-b443-66d2569aed50";
let connectButton;

var head;
window.addEventListener(
  "load",
  function() {
    connectButton = document.querySelector("#BLECONN");
    connectButton.addEventListener("click", mainFunction);
    head = document.querySelector("#head");
//    mainFunction();
  },
  false
);

async function mainFunction() {
  try {
    var bleDevice = await navigator.bluetooth.requestDevice({
      filters: [{ services: [DEVICE_UUID] }] });
    var i2cAccess = await navigator.requestI2CAccess(bleDevice);
    connectButton.hidden = true;
    var port = i2cAccess.ports.get(1);
    var generic = new GENERIC_I2C(port, 0x10);
    await generic.init();
    while (1) {
      // test1: read 8byte (BLE max size)
      var value1 = await generic.readArray(8);
      console.log('test1 value:', value1);
//      await sleep(10);

      // test2: read with subaddress
      var value2 = await generic.read8SA(0x1);
      console.log('test2 value:', value2);
//      await sleep(10);

      // test3: read word with subaddress
      var value3 = await generic.read16SA(0x2);
      console.log('test3 value:', value3);
//      await sleep(10);

      // test4: write 8byte (BLE max size)
      var wrData = new Uint8Array([0x11,0x22,0x33,0x44,0x55,0x66,0x77,0x88]);
      await generic.writeArray(wrData);
      console.log('test4 OK');
//      await sleep(10);

      // test5: write with subaddress
      var value5 = await generic.write8SA(0x3,0xaa);
      console.log('test5 OK');
//      await sleep(10);

      // test6: write with subaddress
      var value6 = await generic.write16SA(0x4,0x1234);
      console.log('test6 OK');
//      await sleep(10);

    }
  } catch (error) {
    console.error("error", error);
  }
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
