'use strict';

var ledPort,switchPort; // LEDとスイッチの付いているポート

const DEVICE_UUID     = "928a3d40-e8bf-4b2b-b443-66d2569aed50";
let connectButton;

window.addEventListener('load', function (){
    connectButton = document.querySelector("#BLECONN");
    connectButton.addEventListener("click", initGPIO);
}, false);

function ledOnOff(v){
	if(v === 0){
		ledPort.write(0);
	} else {
		ledPort.write(1);
	}
}

async function initGPIO(){
        var bleDevice = await navigator.bluetooth.requestDevice({
      	  filters: [{ services: [DEVICE_UUID] }] });
	var gpioAccess = await navigator.requestGPIOAccess(bleDevice); // thenの 前の関数をawait接頭辞をつけて呼び出します。
	connectButton.hidden = true;
	ledPort = gpioAccess.ports.get(7); // LEDのPort
	await ledPort.export("out");
	switchPort = gpioAccess.ports.get(5); // タクトスイッチのPort
	await switchPort.export("in");
	switchPort.onchange = function(val){
		// Port 5の状態を読み込む  
		val ^= 1; // switchはPullupなのでOFFで1。LEDはOFFで0なので反転させる
		ledOnOff(val);
	}
}
