'use strict';

const DEVICE_UUID     = "928a3d40-e8bf-4b2b-b443-66d2569aed50";
let connectButton;

window.addEventListener('load', function (){
    connectButton = document.querySelector("#BLECONN");
    connectButton.addEventListener("click", mainFunction);
}, false);

async function mainFunction(){
        var bleDevice = await navigator.bluetooth.requestDevice({
      filters: [{ services: [DEVICE_UUID] }] });
        var gpioAccess = await navigator.requestGPIOAccess(bleDevice); // thenの 前の関数をawait接頭辞をつけて呼び出します。
        connectButton.hidden = true;
	console.log("GPIO ready!");
	var port = gpioAccess.ports.get(5);
	await port.export("in");
	while ( true ){
		var value = await port.read();
		console.log("unixtime:"+new Date().getTime()+ "  gpio(5)= " + value);
		await sleep(500);
	}

};

function sleep(ms){
	return new Promise( function(resolve) {
		setTimeout(resolve, ms);
	});
}
