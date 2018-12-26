# chirimen-TY51822r3

install:
download "Raspbian Stretch with desktop"
extract 2018-11-13-raspbian-stretch.zip
write microSD card
boot RaspberryPi (3B or 3B+)
setup network

setup:
$ cd /home/pi/
$ wget https://raw.githubusercontent.com/chirimen-oh/chirimen-TY51822r3/master/setup.sh
$ chmod +x setup.sh
$ ./setup.sh

