"use strict";

const DEVICE_UUID     = "928a3d40-e8bf-4b2b-b443-66d2569aed50";
let connectButton;

var ax, ay, az;
window.addEventListener(
  "load",
  function() {
    ax = document.querySelector("#ax");
    ay = document.querySelector("#ay");
    az = document.querySelector("#az");
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
  var groveAccelerometer = new GROVEACCELEROMETER(port, 0x53);
  await groveAccelerometer.init();

  while (1) {
    try {
      var values = await groveAccelerometer.read();
      ax.innerHTML = values.x ? values.x : ax.innerHTML;
      ay.innerHTML = values.y ? values.y : ay.innerHTML;
      az.innerHTML = values.z ? values.z : az.innerHTML;
    } catch (err) {
      console.log("READ ERROR:" + err);
    }

    await sleep(1000);
  }
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
