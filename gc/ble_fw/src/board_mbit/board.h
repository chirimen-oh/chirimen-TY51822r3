/* for micro:bit */

#define MICROBIT

#define DBG_TX P0_24
#define DBG_RX P0_25

#define I2C_SCL P0_0
#define I2C_SDA P0_30
#define I2C_SPEED 100000

#define LED_COL1 P0_4
#define LED_COL2 P0_5
#define LED_COL3 P0_6
#define LED_COL4 P0_7
#define LED_COL5 P0_8
#define LED_COL6 P0_9
#define LED_COL7 P0_10
#define LED_COL8 P0_11
#define LED_COL9 P0_12
#define LED_RAW1 P0_13
#define LED_RAW2 P0_14
#define LED_RAW3 P0_15

// GPIO assigne
static const uint8_t validGpioPins[]    = {1,2,3,17,18,20,26};
uint8_t eventGpioPins[]                 = {0,0,0,0 ,0 ,0 ,0, 0};
uint8_t currentGpioLevel[]              = {0,0,0,0 ,0 ,0 ,0, 0};

DigitalInOut gports[] = {
    DigitalInOut(P0_1,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_2,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_3,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_17,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_18,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_20,PIN_INPUT,PullNone,0),
    DigitalInOut(P0_26,PIN_INPUT,PullNone,0),
    };
#define GPIO_LED_CONNECT P0_16

