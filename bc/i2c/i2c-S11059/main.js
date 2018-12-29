"use strict";

const DEVICE_UUID     = "928a3d40-e8bf-4b2b-b443-66d2569aed50";
let connectButton;

window.addEventListener(
  "load",
  function() {
    connectButton = document.querySelector("#BLECONN");
    connectButton.addEventListener("click", mainFunction);
//    mainFunction();
  },
  false
);

async function mainFunction() {
  var bleDevice = await navigator.bluetooth.requestDevice({
    filters: [{ services: [DEVICE_UUID] }] });
  var i2cAccess = await navigator.requestI2CAccess(bleDevice);
  connectButton.hidden = true;
  var port = i2cAccess.ports.get(1);
  try {
    var s11059 = new S11059(port, 0x2a);
    await s11059.init();
    while (1) {
      try {
        var values = await s11059.readR8G8B8();
        var red = values[0] & 0xff;
        var green = values[1] & 0xff;
        var blue = values[2] & 0xff;
        var gain_level = values[3];
        // console.log("red:" + red + " green:" + green + " blue:" + blue);
        document.getElementById("sensor").textContent =
          "R:" + red + " G:" + green + " B:" + blue + " GAIN:" + gain_level;
        document.getElementById("color").style.backgroundColor =
          "rgb(" + red + ", " + green + "," + blue + ")";
      } catch (error) {
        console.log("READ ERROR:" + error);
      }
      await sleep(1000);
    }
  } catch (error) {
    console.log("requestI2CAccess error");
  }
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
