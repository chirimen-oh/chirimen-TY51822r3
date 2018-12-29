# chirimen-TY51822r3 `LIVE` examples

## GPIO examples:

|LINK|Description|
|:---|:----|
|[button](./gpio/button/)|タクトスイッチを押すとLEDが点灯、離すと消灯します。<br>このサンプルでは、GPIOポートの読み込みに、<b>onchange()</b> を用いています。|
|[LEDblink](./gpio/LEDblink/)|LEDを点滅させます。|
|[MultiBlinkAll](./gpio/MultiBlinkAll/)|RGB LEDを2つ使ったLチカの例です。|
|[readGpioValue](./gpio/readGpioValue/)|タクトスイッチの状態（押されているか、押されていないか）を読み込みコンソールへLog出力します。<br>このサンプルでは、GPIOポートの読み込みを<b>read()</b>を用いたポーリング処理で実現しています。|

## I2C examples:

|LINK|Description|
|:---|:----|
|[i2c-ADS1015](./i2c/i2c-ADS1015/)|I2C接続のADC（アナログ・デジタルコンバータ）経由で可変抵抗器の値を表示します。|
|[i2c-ADT7410](./i2c/i2c-ADT7410/)|I2C接続の温度センサー「ADT7410」を用いて温度を計測し表示します。（このセンサーは4本のピンヘッダ経由で接続します。あらかじめピンヘッダをハンダ付けしておいてください。。|
|[i2c-generic](./i2c/i2c-generic/)|I2C Slaveデバイスを[ATmega328](http://akizukidenshi.com/catalog/g/gI-12775/)を用いて作成する場合の利用例です。Slaveデバイスは[I2Cslave1.ino](./i2c/i2c-generic/I2Cslave1.ino)を書き換えて自由に作成できます。|
|[i2c-GP2Y0E03](./i2c/i2c-GP2Y0E03/)|I2C接続の赤外線測距センサー（センサーから障害物までの距離を測るセンサー）の値を表示します。（このセンサーはGroveケーブル経由で接続します）|
|[i2c-grove-accelerometer](./i2c/i2c-grove-accelerometer/)|I2C接続の3軸加速度センサーで取得した値を表示します。（このセンサーはGroveケーブル経由で接続します）|
|[i2c-grove-gesture](./i2c/i2c-grove-gesture/)|I2C接続のジェスチャーセンサー（センサーの前で手などを動かすと動かした方向などのモーションを検出するセンサー）の検出結果を表示します。（このセンサーはGroveケーブル経由で接続します）|
|[i2c-grove-light](./i2c/i2c-grove-light/)|I2C接続の光センサーで取得した明るさを表示します。（このセンサーはGroveケーブル経由で接続します）|
|[i2c-grove-touch](./i2c/i2c-grove-touch/)|I2C接続のタッチセンサー（静電容量式タッチキー）によるタッチ検出をおこないます。（このセンサーはGroveケーブル経由で接続します）|
|[i2c-multi-sensors](./i2c/i2c-multi-sensors/)|複数のセンサーを組み合わせて利用する場合のサンプルです。ここでは、ADT7410（温度センサー）と、Grove I2C デジタル光センサを接続し、それぞれのセンサーから取得した値を表示しています。複数のセンサーを接続する場合、Grove I2C ハブを利用すると便利です。|
|[i2c-PCA9685](./i2c/i2c-PCA9685/)|I2C接続のPWMドライバー経由でサーボモーターを駆動します。（TY51822r3からPWMドライバーをI2C接続し、 PWMドライバとサーボモータ、外部電源を接続します。詳細は回路図を参照ください）
|
|[i2c-S11059](./i2c/i2c-S11059/)|I2C接続のRGBカラーセンサーで取得した値を表示します。（このセンサーは4本のピンヘッダ経由で接続します。あらかじめピンヘッダをハンダ付けしておいてください。|
|[i2c-VEML6070](./i2c/i2c-VEML6070/)|I2C接続のUVセンサー（紫外線の強さを測定することができるセンサー）で取得した値を表示します。（このセンサーは4本のピンヘッダ経由で接続します。あらかじめピンヘッダをハンダ付けしておいてください）<br>なお、必須ではありませんが紫外線ライトがあるとテストが捗ります。|



