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
    var pca9685 = new PCA9685(port, 0x40);
    var angle = 0;
    // console.log("angle"+angle);
    // servo setting for sg90
    // Servo PWM pulse: min=0.0011[sec], max=0.0019[sec] angle=+-60[deg]
    await pca9685.init(0.001, 0.002, 30);
    while (1) {
      angle = angle <= -30 ? 30 : -30;
      // console.log("angle"+angle);
      await pca9685.setServo(0, angle);
      // console.log('value:', angle);
      head.innerHTML = angle;
      await sleep(1000);
    }
  } catch (e) {
    console.error("error", e);
  }
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
