/*
 * chirimen BLE/RPi I2C test slave
 */
 #include <Wire.h>

unsigned char rcvBuff[256];
unsigned char sndBuff[16] = {1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16};
int rcv_len;

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);

  Wire.begin(0x10);               // join i2c bus with address 0x10
  Wire.onReceive(receiveEvent);   // I2C write
  Wire.onRequest(requestEvent);   // I2C read

  Serial.begin(115200);            // start serial for output
  Serial.println("start");       // print the character

  // finish
  digitalWrite(LED_BUILTIN, LOW);
}


void requestEvent() { // I2C read
  digitalWrite(LED_BUILTIN, HIGH);
  Serial.print("send");
  int size = Wire.write((char*)sndBuff);
//  Serial.print(size);
//  Serial.print(" bytes");
  Serial.println("");
}

void receiveEvent(int howMany) {
  int rdCount = 0;
  digitalWrite(LED_BUILTIN, HIGH);
  while (0 < Wire.available()) { // loop through all but the last
    rcvBuff[rdCount++] = Wire.read(); // receive byte as a character
  }
  Serial.print("receive ");
  Serial.print(rdCount);
  Serial.print(" bytes :");

  for (int i=0;i<rdCount;i++) {
    Serial.print(rcvBuff[i],HEX);
    Serial.print(",");
  }
  Serial.println("");
}

void loop() {
//  digitalWrite(LED_BUILTIN, HIGH);
  delay(100);
  digitalWrite(LED_BUILTIN, LOW);
//  delay(500);
}
