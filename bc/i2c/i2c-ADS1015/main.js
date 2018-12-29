"use strict";

const DEVICE_UUID     = "928a3d40-e8bf-4b2b-b443-66d2569aed50";
let connectButton;

var head;
window.addEventListener(
  "load",
  function() {
    head = document.querySelector("#head");
    connectButton = document.querySelector("#BLECONN");
    connectButton.addEventListener("click", mainFunction);
  },
  false
);

async function mainFunction() {

  // Initialize WebI2C
  var bleDevice = await navigator.bluetooth.requestDevice({
    filters: [{ services: [DEVICE_UUID] }] });
  var i2cAccess = await navigator.requestI2CAccess(bleDevice);
  connectButton.hidden = true;
  try {
    var port = i2cAccess.ports.get(1);
    var ads1015 = new ADS1015(port, 0x48);
    await ads1015.init();
    console.log("new");
    while (1) {
      try {
        var value = await ads1015.read(0);
        console.log("value:", value);
        head.innerHTML = value;
      } catch (error) {
        if (error.code != 4) {
          head.innerHTML = "ERROR";
        }
        console.log("error: code:" + error.code + " message:" + error.message);
      }
      await sleep(100);
    }
  } catch (error) {
    console.log("ADS1015.init error" + error.message);
  }
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
