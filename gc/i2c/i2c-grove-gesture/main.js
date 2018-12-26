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
  head.innerHTML = "started";
  try {
    var bleDevice = await navigator.bluetooth.requestDevice({
      filters: [{ services: [DEVICE_UUID] }] });
    var i2cAccess = await navigator.requestI2CAccess(bleDevice);
    connectButton.hidden = true;

    var port = i2cAccess.ports.get(1);
    var gesture = new PAJ7620(port, 0x73);
    head.innerHTML = "initializing...";
    await gesture.init();
    // console.log("gesture.init done");

    head.innerHTML = "run";
    while (1) {
      var v = await gesture.read();
      head.innerHTML = v;
      await sleep(250);
    }
  } catch (error) {
    console.error("I2C bus error!", error);
    head.innerHTML = error;
  }
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
