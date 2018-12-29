/* for switch science TY51822 */

#define DBG_TX P0_9
#define DBG_RX P0_11

#define I2C_SDA P0_30
#define I2C_SCL P0_29
#define I2C_SPEED 100000

#define GPIO_LED_CONNECT P0_21

// user GPIO table
static const uint8_t validGpioPins[]  = {0,1,2,3,4,5,6,7,8,10,12};
uint8_t eventGpioPins[]                 = {0,0,0,0,0,0,0,0,0,0,0};
uint8_t currentGpioLevel[]              = {0,0,0,0,0,0,0,0,0,0,0};
DigitalInOut gports[] = { // 実際の動作モードはinitGpio()で指定している
    DigitalInOut(P0_0,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_1,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_2,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_3,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_4,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_5,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_6,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_7,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_8,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_10,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_12,PIN_INPUT,PullNone,0),
    };

