const DEVICE_UUID     = "928a3d40-e8bf-4b2b-b443-66d2569aed50";
let connectButton;
var gpioAccess;

var portPromise;
onload =function(){
  console.log("onload");
  connectButton = document.querySelector("#BLECONN");
  connectButton.addEventListener("click", mainFunction);
}

async function mainFunction(){
  var bleDevice = await navigator.bluetooth.requestDevice({
    filters: [{ services: [DEVICE_UUID] }] });
  gpioAccess = await navigator.requestGPIOAccess(bleDevice);
  connectButton.hidden = true;
  portPromise = getPort();
}

async function getPort(){ // ポートを初期化するための非同期関数
  var ports = [];
  var Vs        = [0,0,0,0,0,0,0,0]; // ALL 8 ports
  var portAddrs = [0,1,2,3,4,5,6,7];
  
  for ( var i = 0 ; i < 8 ; i++ ){
    ports[i] = gpioAccess.ports.get(portAddrs[i]);
    await ports[i].export("out");
  }
  for ( var i = 0 ; i < 8 ; i++ ){
    await ports[i].write(Vs[i]);
  }
  return ( ports );
}

var flash = false;
var busy = false;

async function startFlash(){
  if (portPromise == null) {
    return (0);
  }
  var ports = await portPromise;
  var Vs = [0,0,0,0,0,0,0,0];
  flash = true;
  busy = true;
  var i = 0;
  while ( flash ){ // 無限ループ
    await sleep(100); // 1000ms待機する
    Vs[i] ^= 1; // v = v ^ 1 (XOR 演算)の意。　vが1の場合はvが0に、0の場合は1に変化する。1でLED点灯、0で消灯するので、1秒間隔でLEDがON OFFする。
    await ports[i].write(Vs[i]);
    ++i;
    if ( i > 7 ){
      i=0;
    }
  }
  console.log("exit loop");
}

async function allOn(){
  if (portPromise == null) {
    return (0);
  }
  var ports = await portPromise;
  flash = false;
  await sleep(100); // 100ms待機する
  for ( var i = 0 ; i < 8 ; i++ ){
    await ports[i].write(1);
  }
}

async function allOff(){
  if (portPromise == null) {
    return (0);
  }
  var ports = await portPromise;
  flash = false;
  await sleep(100); // 100ms待機する
  for ( var i = 0 ; i < 8 ; i++ ){
    await ports[i].write(0);
  }
}

async function setLed(chFlags){
  if (portPromise == null) {
    return (0);
  }
  var chFlag = chFlags.split(",");
  console.log(chFlag);
  var ports = await portPromise;
  flash = false;
  await sleep(100); // 100ms待機する
  for ( var i = 0 ; i < 8 ; i++){
    if ( chFlag[i]=="1" ){
      await ports[i].write(1);
    } else {
      await ports[i].write(0);
    }
  }
}

// 単に指定したms秒スリープするだけの非同期処理関数
// この関数の定義方法はとりあえず気にしなくて良いです。コピペしてください。
function sleep(ms){
  return new Promise( function(resolve) {
    setTimeout(resolve, ms);
  });
}

