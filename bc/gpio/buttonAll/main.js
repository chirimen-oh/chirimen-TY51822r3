'use strict';

var portAddrs = [0,1,2,3,4,5,6,7];

const DEVICE_UUID     = "928a3d40-e8bf-4b2b-b443-66d2569aed50";
let connectButton;

window.addEventListener(
  "load",
  function() {
    connectButton = document.querySelector("#BLECONN");
    connectButton.addEventListener("click", mainFunction);
  },
  false
);

async function mainFunction(){
  var bleDevice = await navigator.bluetooth.requestDevice({
    filters: [{ services: [DEVICE_UUID] }] });
  var gpioAccess = await navigator.requestGPIOAccess(bleDevice);
  connectButton.hidden = true;

//    console.log("GPIO ready!");
  var ports = [];
  for ( var i = 0 ; i < portAddrs.length ; i++){ 
    ports[i] = gpioAccess.ports.get(portAddrs[i]);
    await ports[i].export("in");
    ports[i].onchange = function(prt){
        return function(v){
      console.log("Catch event : button:",prt," addr:",portAddrs[prt]," val:",v);
      document.getElementById("statusDisp").innerHTML="Catch event : button:"+prt+"  addr:"+portAddrs[prt]+" val:"+v;
/**
      setTimeout(function(){
        document.getElementById("statusDisp").innerHTML="--";
      },500);
**/
			}
    }(i);
  }
}
