"use strict";
const DEVICE_UUID     = "928a3d40-e8bf-4b2b-b443-66d2569aed50";
let connectButton;

var head1, head2;
window.addEventListener(
  "load",
  function() {
    head1 = document.querySelector("#head1");
    head2 = document.querySelector("#head2");
    connectButton = document.querySelector("#BLECONN");
    connectButton.addEventListener("click", mainFunction);
  },
  false
);

async function mainFunction() {
  var bleDevice = await navigator.bluetooth.requestDevice({
    filters: [{ services: [DEVICE_UUID] }] });
  var i2cAccess = await navigator.requestI2CAccess(bleDevice);
  connectButton.hidden = true;
  try {
    var port = i2cAccess.ports.get(1);
    var groveLight = new GROVELIGHT(port, 0x29);
    var adt7410 = new ADT7410(port, 0x48);
    await groveLight.init();
    await adt7410.init();

    while (1) {
      try {
        var lightValue = await groveLight.read();
        // console.log('lightValue:', lightValue);
        head1.innerHTML = lightValue;
      } catch (error) {
        console.log("groveLight error:" + error);
      }

      try {
        var tempValue = await adt7410.read();
        // console.log('tempValue:', tempValue);
        head2.innerHTML = tempValue;
      } catch (error) {
        console.log("adt7410 error:" + error);
      }
      sleep(500);
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
