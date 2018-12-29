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
  try {
    var port = i2cAccess.ports.get(1);
    var veml6070 = new VEML6070(port);
    await veml6070.init();
    while (1) {
      var value = await veml6070.read();
      // console.log('value2:', value);
      head.innerHTML = value;
      await sleep(200);
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
