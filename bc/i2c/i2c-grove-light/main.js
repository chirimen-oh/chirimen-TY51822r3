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
  var bleDevice = await navigator.bluetooth.requestDevice({
    filters: [{ services: [DEVICE_UUID] }] });
  var i2cAccess = await navigator.requestI2CAccess(bleDevice);
  connectButton.hidden = true;
  var port = i2cAccess.ports.get(1);
  var groveLight = new GROVELIGHT(port, 0x29);

  await groveLight.init();

  while (1) {
    try {
      var value = await groveLight.read();
      // console.log('value:', value);
      head.innerHTML = value ? value : head.innerHTML;
      await sleep(200);
    } catch (error) {
      console.log(" Error : ", error);
    }
  }
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
