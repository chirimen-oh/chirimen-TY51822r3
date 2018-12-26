/*
 * Chirimen TY51822r3 BLE farmware
 * copylight KDDI Technorogy
 *
 * change log
 * 2018/11/28 初回リリース
 * 2018/12/03 GPIO端子の初期値不定を修正
 * 2018/12/19 GPIO ドライブ能力変更 (0.5mA -> 5mA)
 * 2018/12/20 nRF51ライブラリのバグ対策 -- RTS/CTSの割り当て禁止
 *            送信出力を +4dBmに規定
 */


#include "mbed.h"
#include "BLE.h"

#include "board.h"

#define VERSION_NUM 1 // 2018-11-28
const static char  DEVICE_NAME[] = "btGPIO2";

#define NEED_CONSOLE_OUTPUT 1 
/* Set this if you need debug messages on the console;
 * it will have an impact on code-size and power consumption. */

#if NEED_CONSOLE_OUTPUT
Serial  pc(DBG_TX, DBG_RX); // TX,RX default 9600bps
#define DEBUG(...) { pc.printf(__VA_ARGS__); }
#else
#define DEBUG(...) /* nothing */
#endif /* #if NEED_CONSOLE_OUTPUT */

#ifdef MICROBIT
// micro:bit matrix-led
DigitalOut col0(P0_4, 0);
#endif
DigitalOut LED_CONNECT(GPIO_LED_CONNECT);

#define CMD_EXPORT      0x10
#define CMD_GPIO_WRITE  0x11
#define CMD_GPIO_READ   0x12
#define CMD_UNEXPORT    0x13
#define CMD_GPIO_EVENT  0x14
#define CMD_I2C_INIT    0x20
#define CMD_I2C_WRITE   0x21
#define CMD_I2C_RDBYTE  0x22
#define CMD_I2C_READ    0x23
#define CMD_ADC_INPUT   0x30
#define CMD_ADC_READ    0x31

// Bluetooth Low Energy
BLE ble;
static Gap::ConnectionParams_t connectionParams;

// I2C 2-waire
I2C i2c(I2C_SDA,I2C_SCL);
#define MAX_I2C_TRANSFAR_SIZE 10

// Timer
Ticker timerTask;

/*
 * gpio bridge used UUID
 * ServiceUUID:    928a3d40-e8bf-4b2b-b443-66d2569aed50
 * NotifyDataUUID: 928a3d41-e8bf-4b2b-b443-66d2569aed50
 * WriteDataUUID:  928a3d42-e8bf-4b2b-b443-66d2569aed50
 */
static const uint8_t UUID_GPIO_SERVICE[]  = {0x92,0x8a,0x3d,0x40,0xe8,0xbf,0x4b,0x2b,0xb4,0x43,0x66,0xd2,0x56,0x9a,0xed,0x50};
static const uint8_t UUID_ADV_SERVICE[]   = {0x50,0xed,0x9a,0x56,0xd2,0x66,0x43,0xb4,0x2b,0x4b,0xbf,0xe8,0x40,0x3d,0x8a,0x92};
static const uint8_t UUID_NOTIFY_DATA[]   = {0x92,0x8a,0x3d,0x41,0xe8,0xbf,0x4b,0x2b,0xb4,0x43,0x66,0xd2,0x56,0x9a,0xed,0x50};
static const uint8_t UUID_WRITE_DATA[]    = {0x92,0x8a,0x3d,0x42,0xe8,0xbf,0x4b,0x2b,0xb4,0x43,0x66,0xd2,0x56,0x9a,0xed,0x50};
static const uint8_t UUID_STAT_DATA[]     = {0x92,0x8a,0x3d,0x43,0xe8,0xbf,0x4b,0x2b,0xb4,0x43,0x66,0xd2,0x56,0x9a,0xed,0x50};

uint8_t wrtData[20] = {0,};
GattCharacteristic  gWrtCharacteristic (UUID_WRITE_DATA, wrtData, sizeof(wrtData), sizeof(wrtData),
        GattCharacteristic::BLE_GATT_CHAR_PROPERTIES_WRITE);

uint8_t notifyData[20] = {0,};
GattCharacteristic  gNotifyCharacteristic (UUID_NOTIFY_DATA, notifyData, sizeof(notifyData), sizeof(notifyData),
        GattCharacteristic::BLE_GATT_CHAR_PROPERTIES_NOTIFY);

uint8_t statData[20] = {0,0};
GattCharacteristic  gStatCharacteristic (UUID_STAT_DATA, statData, sizeof(statData), sizeof(statData),
        GattCharacteristic::BLE_GATT_CHAR_PROPERTIES_READ | GattCharacteristic::BLE_GATT_CHAR_PROPERTIES_WRITE);

GattCharacteristic *gGpioChars[] = {&gNotifyCharacteristic,&gWrtCharacteristic,&gStatCharacteristic};
GattService gGpioService = GattService(UUID_GPIO_SERVICE, gGpioChars, sizeof(gGpioChars) / sizeof(GattCharacteristic *));

int gConnect = 0;

int gCmdLen = 0;
uint8_t gCmdData[20] = {0,};

int gNotifyLen = 0;
uint8_t gNotifyData[6] = {0x2,0x0,0x0,0x14,0,0};
int gScanGPIO = 0;

/* ----GPIO Task----------------------------------------------------------------------- */
void gpioTask() {
            
//    LED_CONNECT = !LED_CONNECT;
    
    if (gNotifyLen >0) {  // busy
        return;
    }

    for (int i=0; i<sizeof(validGpioPins); i++) {
        if (eventGpioPins[gScanGPIO] != 0) { // is event pins
            uint8_t rdGpio = gports[gScanGPIO];
            if ( currentGpioLevel[gScanGPIO] != rdGpio) {
                DEBUG("GPIO status chenged port%d:%d\r\n",validGpioPins[gScanGPIO],rdGpio);
                currentGpioLevel[gScanGPIO] = rdGpio;
                gNotifyData[4] = gScanGPIO;
                gNotifyData[5] = rdGpio;
                gNotifyLen = 6;
                continue;
            }
        }
        gScanGPIO++;
        if (gScanGPIO > sizeof(validGpioPins)) {
            gScanGPIO = 0;
        }
    }
}

void reloadGpioCondition() {
    for (int i=0; i<sizeof(validGpioPins); i++) {
        if (eventGpioPins[i] != 0) { // is event pins
            uint8_t rdGpio = gports[i];
            currentGpioLevel[i] = rdGpio;
        }
    }
}

void clearEventLists() {
    for (int i=0; i<sizeof(validGpioPins); i++) {
        eventGpioPins[i] = 0;
    }
}

void initGpio() {
    for (int i=0; i<sizeof(validGpioPins); i++) {
        int gpioNum = validGpioPins[i];
        DEBUG("initGpio() 0x%x\r\n", gpioNum);
        gports[gpioNum].input();        // 端子を入力モード
        gports[gpioNum].mode(PullNone); // pullアップ/ダウンなし
        eventGpioPins[gpioNum] = 0;     // イベント監視対象外
        reloadGpioCondition(); // 設定を更新
    }
    
    // nRF51ライブラリのバグ対策 -- RTS/CTSの割り当て禁止
    NRF_UART0->PSELRTS = 0xFFFFFFFF;
    NRF_UART0->PSELCTS = 0xFFFFFFFF;
}

// set high drive (Low/High 5mA)
void hiDriveGpio(int gpioNum) {
    NRF_GPIO->PIN_CNF[gpioNum] =
        (NRF_GPIO->PIN_CNF[gpioNum] & ~GPIO_PIN_CNF_DRIVE_Msk) |
        (GPIO_PIN_CNF_DRIVE_H0H1 << GPIO_PIN_CNF_DRIVE_Pos);
}
/* --- BLE callbacks ------------------------------------------------------------------- */
void onDisconnectionCallback(const Gap::DisconnectionCallbackParams_t *params)    // Mod
{
    DEBUG("Disconnected handle %u, reason %u\r\n", params->handle, params->reason);
    DEBUG("Restarting the advertising process\r\n");
    DEBUG("Disconnected!\n\r");
    timerTask.detach(); // stop timer
    gConnect = 0;
    clearEventLists();
    
    LED_CONNECT = 0;
    ble.startAdvertising();
}

#define BLE_INTERVAL_10MS   8
#define BLE_INTERVAL_12MS   10
#define BLE_INTERVAL_20MS   15
#define BLE_INTERVAL_30MS   23
#define BLE_INTERVAL_50MS   39
#define BLE_INTERVAL_62MS   50
#define BLE_INTERVAL_100MS  78
#define BLE_INTERVAL_125MS  100

void onConnectionCallback(const Gap::ConnectionCallbackParams_t *params)   //Mod
{
    DEBUG("Connected!\n\r");
    LED_CONNECT = 1;
    ble.getPreferredConnectionParams(&connectionParams);
//    connectionParams.minConnectionInterval        = BLE_INTERVAL_10MS;
    connectionParams.minConnectionInterval        = BLE_INTERVAL_50MS;
//    connectionParams.minConnectionInterval        = INTERVAL_100MS;

//    connectionParams.maxConnectionInterval        = BLE_INTERVAL_12MS;
    connectionParams.maxConnectionInterval        = BLE_INTERVAL_62MS;
//    connectionParams.maxConnectionInterval        = BLE_INTERVAL_125MS;
    if (ble.updateConnectionParams(params->handle, &connectionParams) != BLE_ERROR_NONE) {
        DEBUG("failed to update connection paramter\r\n");
    }
    gConnect = 1;
    timerTask.attach(&gpioTask, 0.1f); // start interval 100mS timer 
    
    // set ready flag
    statData[0] = 0;
    statData[1] = VERSION_NUM;
    ble.gattServer().write(gStatCharacteristic.getValueAttribute().getHandle(), statData, 4);
}

void ConnectTimeoutCallback(Gap::TimeoutSource_t source)
{
    ble.setAdvertisingTimeout(0); /* 0 is disable the advertising timeout. */
    ble.startAdvertising();
}

void DataWrittenCallback(const GattWriteCallbackParams *params)
{
    uint8_t *wrtData = (uint8_t *)params->data;
    uint16_t wrtLen = params->len;
        
    memcpy(gCmdData,wrtData,wrtLen);
    gCmdLen = wrtLen;
    LED_CONNECT = 0; // busy condition

    DEBUG("rcv\r\n");
//    DEBUG("DataWrittenCallback() len=%u data=", wrtLen);
//    for (int i=0; i< wrtLen; i++) {
//        DEBUG("0x%x,", *wrtData++);
//    }
//    DEBUG("\r\n");

}

void UpdatesEnabledCallBack(Gap::Handle_t handle)
{
    DEBUG("UpdatesEnabled\n\r");
    // ユーザ処理コード
}
 
void UpdatesDisabledCallBack(Gap::Handle_t handle)
{
    DEBUG("UpdatesDisabled\n\r");
    // ユーザ処理コード
}
 
void DataSentCallback(unsigned count)
{
//    DEBUG("DataSentCallback\n\r");
    // ユーザ処理コード
}

/* --- test code ----------------------------------------------------------------------- */
int tako() {
    i2c.frequency(I2C_SPEED);
    char wReg[2] = {0x0,0x0};
    char rReg[2] = {0,0};
    
    i2c.start();
    int val = i2c.write(0x48<<1);
    i2c.stop();
    DEBUG("write val %d\r\n",val);
    
#if 1
    if (i2c.write(0x48<<1, wReg, 0) == 0) {
        DEBUG("write ok\r\n");
    } else {
        DEBUG("write NG\r\n");
    }
#endif    
//    i2c.write(0x48, wReg, 1);
#if 1
    if (i2c.read(0x48<<1, rReg, 2) == 0) {
        DEBUG("read ok\r\n");
    } else {
        DEBUG("read ng\r\n");
    }

    DEBUG("read sensor data=");
    for (int i=0; i< 2; i++) {
      DEBUG("0x%x,", rReg[i]);
    }
    DEBUG("\r\n");
#endif
    return 0;
}

/* --- user task ----------------------------------------------------------------------- */
int checkGPIO(int gpioNum) {
    for (int i=0; i<sizeof(validGpioPins); i++) {
        if (validGpioPins[i] == gpioNum) {
            return i;
        }
    }
    DEBUG("Invalid GPIO number %d\r\n",gpioNum);
    return -1;    
}

// ホストからのコマンドを処理
void commandTask() {
    uint8_t response[20] = {1,2,3,4};
    int responseSize = 5;
    int gpioNum = -1;
    char i2cWrBuf[MAX_I2C_TRANSFAR_SIZE] = {0,};
    char i2cRdBuf[MAX_I2C_TRANSFAR_SIZE] = {0,};

    memcpy(response,gCmdData,4); // コマンドヘッダ部分をレスポンスデータにコピー

    switch (gCmdData[3]) {
      case CMD_EXPORT: // use GPIO port
        // input:
        //  gCmdData[4] : target port number
        //  gCmdData[5] : 0=outpt 1=input
        // output:
        //  response[4] : 1=accept 1=reject
        gpioNum = checkGPIO(gCmdData[4]);
        if (gpioNum < 0) {
            response[4] = 0; // error
        } else {
            if (gCmdData[5] == 0) {
                DEBUG("set GPIO output  %d\r\n",gCmdData[4]);
                gports[gpioNum] = 0; // inital state low
                gports[gpioNum].output();
                hiDriveGpio(gpioNum); // set high drive (Low/High 5mA)


            } else {
                DEBUG("set GPIO input %d\r\n",gCmdData[4]);
                gports[gpioNum].input();
                gports[gpioNum].mode(PullUp);  // 内蔵プルアップを使う
                // gports[gpioNum].mode( PullDown );    /  内蔵プルダウンを使う
                eventGpioPins[gpioNum] = 1; // イベント監視対象
                reloadGpioCondition();
            }
            response[4] = 1; // OK
        }
        break;

      case CMD_UNEXPORT: // GPIO port input
        // input:
        //  gCmdData[4] : target port number
        // output:
        //  response[4] : 1=accept 1=reject
        gpioNum = checkGPIO(gCmdData[4]);
        if (gpioNum < 0) {
            response[4] = 0; // error
        } else {
            gports[gpioNum].input(); // 端子を入力として解放
            gports[gpioNum].mode(PullNone);
            eventGpioPins[gpioNum] = 0; // イベント監視対象外
            reloadGpioCondition();
            response[4] = 1; // OK
        }
        break;

      case CMD_GPIO_WRITE: // GPIO port write
        // input:
        //  gCmdData[4] : target port number
        //  gCmdData[5] : 0=low 1=high
        // output:
        //  response[4] : 1=accept 0=reject
        gpioNum = checkGPIO(gCmdData[4]);
        if (gpioNum < 0) {
            response[4] = 0; // error
        } else {
            gports[gpioNum] = gCmdData[5];
            response[4] = 1; // OK
        }                
        break;

      case CMD_GPIO_READ: // GPIO port write
        // input:
        //  gCmdData[4] : target port number
        // output:
        //  response[4] : 1=accept 0=reject
        //  response[5] : port condition 0=low 1=high
        gpioNum = checkGPIO(gCmdData[4]);
        if (gpioNum < 0) {
            response[4] = 0; // error
        } else {
            gports[gpioNum] = gCmdData[5];
            if (gports[gpioNum] ==0) {
                response[5] = 0; // Low
            } else {
                response[5] = 1; // High
            }
            response[4] = 1; // OK
            responseSize += 1;
        }                
        break;

      case CMD_I2C_INIT: // I2C test access
        // input:
        //  gCmdData[4] : slave I2C address
        // output:
        //  response[4] : 1=accept 1=reject
        i2cWrBuf[0] =0;
        if (i2c.write(gCmdData[4]<<1, i2cWrBuf, 0) == 0) {
            response[4] = 1; // OK
        } else {
            DEBUG("I2C write error address=%x\r\n",gCmdData[4]);
            response[4] = 0; // error
        }
        break;

      case CMD_I2C_READ: // I2C read
        // input:
        //  gCmdData[4] : slave I2C address
        //  gCmdData[5] : sub-address
        //  gCmdData[6] : length
        // output:
        //  response[4] : read data length / 0=reject
        //  response[5] : read data
        if ((gCmdData[6] > MAX_I2C_TRANSFAR_SIZE) || (gCmdData[6] < 1)) {
            DEBUG("I2C write error invalid length=%d\r\n",gCmdData[6]);
            response[4] = 0; // error
            break;
        }
        i2cWrBuf[0] = gCmdData[5];
        if (i2c.write(gCmdData[4]<<1, i2cWrBuf, 1, true) != 0) { // Repeat condision
            DEBUG("I2C write error address=%x\r\n",gCmdData[4]);
            response[4] = 0; // error
            break;
        }
        if (i2c.read(gCmdData[4]<<1, i2cRdBuf, gCmdData[6]) != 0) {
            DEBUG("I2C read error address=%x\r\n",gCmdData[4]);
            response[4] = 0; // error
            break;
        }
//        DEBUG("I2C read ok\r\n");
        memcpy(&response[5],i2cRdBuf,gCmdData[6]);
        response[4] = gCmdData[6]; // read size
        responseSize += gCmdData[6];
        break;

      case CMD_I2C_RDBYTE:
        // input:
        //  gCmdData[4] : slave I2C address
        //  gCmdData[5] : length
        // output:
        //  response[4] : read data length / 0=reject
        //  response[5] : read data
        if ((gCmdData[5] > MAX_I2C_TRANSFAR_SIZE) || (gCmdData[5] < 1)) {
            DEBUG("I2C write error invalid length=%d\r\n",gCmdData[5]);
            response[4] = 0; // error
            break;
        }
        if (i2c.read(gCmdData[4]<<1, i2cRdBuf, gCmdData[5]) != 0) {
            DEBUG("I2C read error address=%x\r\n",gCmdData[4]);
            response[4] = 0; // error
            break;
        }
//        DEBUG("read ok\r\n");
        memcpy(&response[5],i2cRdBuf,gCmdData[5]);
        response[4] = gCmdData[5]; // read size
        responseSize += gCmdData[5];
        break;

      case CMD_I2C_WRITE: // I2C write
        // input:
        //  gCmdData[4] : slave I2C address
        //  gCmdData[5] : length
        //  gCmdData[6] : write data
        //  gCmdData[7] ...
        // output:
        //  response[4] : 1=accept 1=reject
        if ((gCmdData[5] > MAX_I2C_TRANSFAR_SIZE) || (gCmdData[5] < 1)) {
            DEBUG("I2C write error invalid length=%d\r\n",gCmdData[5]);
            response[4] = 0; // error
            break;
        }
        memcpy(i2cWrBuf,&gCmdData[6],gCmdData[5]);
        if (i2c.write(gCmdData[4]<<1, i2cWrBuf, gCmdData[5]) != 0) { // Repeat condision
            DEBUG("I2C write error address=%x\r\n",gCmdData[4]);
            response[4] = 0; // error
            break;
        }

        response[4] = gCmdData[5]; // return complite transfar size
        break;

#if 0
      case CMD_ADC_INPUT:
        // input:
        //  gCmdData[4] : target port number
        // output:
        //  response[4] : 1=accept 1=reject
        gpioNum = checkGPIO(gCmdData[4]);
        if ((gpioNum < 1) || (gpioNum > 6)) {
            response[4] = 0; // error
        } else {
            gports[gpioNum].input(); // 端子を入力として解放
            gports[gpioNum].mode(PullNone);
            eventGpioPins[gpioNum] = 0; // イベント監視対象外
            reloadGpioCondition();
            
            // ADC setting
            // 10bit Reference internal Bandcap(1.2V)
            NRF_ADC->CONFIG = (ADC_CONFIG_RES_10bit << ADC_CONFIG_RES_Pos) |
                (ADC_CONFIG_INPSEL_AnalogInputOneThirdPrescaling << ADC_CONFIG_INPSEL_Pos) |
                (ADC_CONFIG_REFSEL_VBG << ADC_CONFIG_REFSEL_Pos) |
                (ADC_CONFIG_EXTREFSEL_None << ADC_CONFIG_EXTREFSEL_Pos);
            response[4] = 1; // OK
        }
        break;
        
      case CMD_ADC_READ:
        // input:
        //  gCmdData[4] : target port number
        // output:
        //  response[4] : read data length(fixed 2) / 0=reject
        //  response[5] : read data(MSB)
        //  response[6] : read data(LSB)
        gpioNum = gCmdData[4];
        if ((gpioNum < 1) || (gpioNum > 6)) {
            response[4] = 0; // error
        } else {
            NRF_ADC->CONFIG     &= ~ADC_CONFIG_PSEL_Msk;
            NRF_ADC->CONFIG     |= (4 << gpioNum) << ADC_CONFIG_PSEL_Pos;
            NRF_ADC->TASKS_START = 1;
            while (((NRF_ADC->BUSY & ADC_BUSY_BUSY_Msk) >> ADC_BUSY_BUSY_Pos) == ADC_BUSY_BUSY_Busy) {
            }
            uint16_t advalue = (uint16_t)NRF_ADC->RESULT; // 10 bit
            DEBUG("read adc %d =%x\r\n",gpioNum, advalue);
            response[5] = advalue >> 8;
            response[6] = advalue && 0xff;
            responseSize += 2;
        }
        break;
#endif
              
      default:
        DEBUG("unknonwn command =%x\r\n",gCmdData[3]);
        response[4] = 0; // error
        break;    
                
    }

    DEBUG("reply\r\n");
//    DEBUG("send Notify len=%u data=", responseSize);
//    for (int i=0; i< responseSize; i++) {
//        DEBUG("0x%x,", response[i]);
//    }
//    DEBUG("\r\n");

    // send response (notify)
    ble.gattServer().write(gNotifyCharacteristic.getValueAttribute().getHandle(), response, responseSize);
    LED_CONNECT = 1; // ready

}

/* --- main code ----------------------------------------------------------------------- */
int main() {
    LED_CONNECT = 1;
    gCmdLen = 0;
    gConnect = 0;
    gScanGPIO = 0;

    initGpio();
    hiDriveGpio(GPIO_LED_CONNECT);
    DEBUG("PowerON version %d\n\r",VERSION_NUM);
    
    /* Initialise the nRF51822 */
    ble.init();

    /* Setup The event handlers */
    ble.onConnection(onConnectionCallback);
    ble.onDisconnection(onDisconnectionCallback);
    ble.onTimeout(ConnectTimeoutCallback);

    ble.onDataWritten(DataWrittenCallback);
    ble.onDataSent(DataSentCallback);
    ble.onUpdatesEnabled(UpdatesEnabledCallBack);
    ble.onUpdatesDisabled(UpdatesDisabledCallBack);
    
    // set TX power
    // Valid values are -40, -20, -16, -12, -8, -4, 0, 4)
    ble.setTxPower(4);

    /* setup advertising */
    ble.gap().setAdvertisingType(GapAdvertisingParams::ADV_CONNECTABLE_UNDIRECTED);
    ble.gap().accumulateAdvertisingPayload(GapAdvertisingData::BREDR_NOT_SUPPORTED | GapAdvertisingData::LE_GENERAL_DISCOVERABLE);

    ble.gap().accumulateAdvertisingPayload(GapAdvertisingData::COMPLETE_LIST_128BIT_SERVICE_IDS,
                                     (const uint8_t *)UUID_ADV_SERVICE, sizeof(UUID_ADV_SERVICE));
    ble.gap().accumulateAdvertisingPayload(GapAdvertisingData::COMPLETE_LOCAL_NAME,
                                     (const uint8_t *)DEVICE_NAME,
                                     strlen(DEVICE_NAME));
    ble.gap().setAdvertisingInterval(80); /* 50ms; in multiples of 0.625ms. */
    ble.gap().startAdvertising();
    DEBUG("Start Advertising\r\n");

    ble.addService(gGpioService);

    LED_CONNECT = 0;
    for (;; ) {
        ble.waitForEvent();
        if (gCmdLen > 0) {
            commandTask();
            gCmdLen =0;
        } else if (gNotifyLen > 0) {
            ble.gattServer().write(gNotifyCharacteristic.getValueAttribute().getHandle(), gNotifyData, gNotifyLen);
            gNotifyLen = 0;
        }
    }

}

