"use strict";

const DEVICE_UUID     = "928a3d40-e8bf-4b2b-b443-66d2569aed50";
let connectButton;

var valelem;
window.addEventListener(
  "load",
  function() {
    valelem = document.getElementById("distance");
    connectButton = document.querySelector("#BLECONN");
    connectButton.addEventListener("click", mainFunction);
  },
  false
);

async function mainFunction() {
  var sensor_unit;
  try {
    var bleDevice = await navigator.bluetooth.requestDevice({
      filters: [{ services: [DEVICE_UUID] }] });
    var i2cAccess = await navigator.requestI2CAccess(bleDevice);
    connectButton.hidden = true;
    var port = i2cAccess.ports.get(1);
    sensor_unit = new GP2Y0E03(port, 0x40);
    await sensor_unit.init();

    while (1) {
      try {
        var distance = await sensor_unit.read();
        if (distance != null) {
          valelem.innerHTML = "Distance:" + distance + "cm";
        } else {
          valelem.innerHTML = "out of range";
        }
      } catch (err) {
        console.log("READ ERROR:" + err);
      }
      await sleep(500);
    }
  } catch (err) {
    console.log("GP2Y0E03 init error");
  }
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
