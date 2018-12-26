#!/bin/bash
# version 2018/12/25 9:30
# cd /home/pi/
# wget https://raw.githubusercontent.com/chirimen-oh/chirimen-TY51822r3/master/setup.sh
# chmod +x setup.sh
# ./setup.sh
#
# 一時的にスリープを無効
sudo xset s off
sudo xset -dpms
sudo xset s noblank
# スリープを無効
sudo sed '1s/$/ consoleblank=0/' /boot/cmdline.txt | sudo tee /tmp/cmdline && sudo cat /tmp/cmdline | sudo tee /boot/cmdline.txt && sudo rm -f /tmp/cmdline
sudo sh -c "echo '@xset s off' >> /etc/xdg/lxsession/LXDE/autostart"
sudo sh -c "echo '@xset -dpms' >> /etc/xdg/lxsession/LXDE/autostart"
sudo sh -c "echo '@xset s noblank' >> /etc/xdg/lxsession/LXDE/autostart"
# 軽量化
sudo apt-get -y purge wolfram-engine
sudo apt-get -y purge minecraft-pi
sudo apt-get -y purge scratch
sudo apt-get -y purge scratch2
sudo apt-get -y remove --purge libreoffice*
sudo apt-get -y clean
sudo apt-get -y autoremove

sudo apt-get -y update
sudo apt-get -y upgrade

# raspiはupgrade失敗しやすいので念の為2回
sudo apt-get -y update
sudo apt-get -y upgrade

# 各種ツールをインストール
sudo apt-get -y install ttf-kochi-gothic fonts-noto uim uim-mozc nodejs npm apache2 vim emacs libnss3-tools
# インストール失敗しやすいので2回
sudo apt-get -y install ttf-kochi-gothic fonts-noto uim uim-mozc nodejs npm apache2 vim emacs libnss3-tools
sudo apt-get -y autoremove

# ディスプレイ解像度設定
echo -e 'hdmi_force_hotplug=1\nhdmi_group=2\nhdmi_mode=85\nhdmi_drive=2\n' | sudo tee -a /boot/config.txt

# 日本語設定
sudo sed 's/#\sen_GB\.UTF-8\sUTF-8/en_GB\.UTF-8 UTF-8/g' /etc/locale.gen | sudo tee /tmp/locale && sudo cat /tmp/locale | sudo tee /etc/locale.gen && sudo rm -f /tmp/locale
sudo sed 's/#\sja_JP\.EUC-JP\sEUC-JP/ja_JP\.EUC-JP EUC-JP/g' /etc/locale.gen  | sudo tee /tmp/locale && sudo cat /tmp/locale | sudo tee /etc/locale.gen && sudo rm -f /tmp/locale
sudo sed 's/#\sja_JP\.UTF-8\sUTF-8/ja_JP\.UTF-8 UTF-8/g' /etc/locale.gen  | sudo tee /tmp/locale && sudo cat /tmp/locale | sudo tee /etc/locale.gen && sudo rm -f /tmp/locale
sudo locale-gen ja_JP.UTF-8
sudo update-locale LANG=ja_JP.UTF-8

# 時間設定
sudo raspi-config nonint do_change_timezone Japan

# キーボード設定
sudo raspi-config nonint do_configure_keyboard jp

# パスワードの変更
echo 'pi:rasp' | sudo chpasswd

# ダウンロード、展開
wget https://github.com/chirimen-oh/chirimen-TY51822r3/archive/master.zip 
unzip ./master.zip

# ブラウザ設定
mkdir /home/pi/.config/chromium/
mkdir /home/pi/.config/chromium/Default/
mv /home/pi/chirimen-TY51822r3-master/_gc/bookmark/Bookmarks /home/pi/.config/chromium/Default/Bookmarks

# gc設定
chromium-browser &
cd /home/pi/
mv /home/pi/chirimen-TY51822r3-master/gc  /home/pi/Desktop
mv /home/pi/chirimen-TY51822r3-master/_gc  /home/pi

# chromiumの起動待ち>>apache2 settings
sleep 120s
sudo sed 's/\/var\/www\/html/\/home\/pi\/Desktop\/gc/g' /etc/apache2/sites-available/000-default.conf  | sudo tee /tmp/apache-default
sudo cat /tmp/apache-default | sudo tee /etc/apache2/sites-available/000-default.conf
sudo rm -f /tmp/apache-default
sudo sed 's/\/var\/www\//\/home\/pi\/Desktop\/gc/g' /etc/apache2/apache2.conf | sudo tee /tmp/apache
sudo cat /tmp/apache | sudo tee /etc/apache2/apache2.conf
sudo rm -f /tmp/apache
sudo cp /etc/apache2/sites-available/default-ssl.conf /etc/apache2/sites-available/vhost-ssl.conf
sudo sed 's/\/var\/www\/html/\/home\/pi\/Desktop\/gc/g' /etc/apache2/sites-available/vhost-ssl.conf  | sudo tee /tmp/vhost
sudo cat /tmp/vhost | sudo tee /etc/apache2/sites-available/vhost-ssl.conf && sudo rm -f /tmp/vhost
sudo sed 's/\/etc\/ssl\/certs\/ssl-cert-snakeoil\.pem/\/home\/pi\/_gc\/srv\/crt\/server\.crt/g' /etc/apache2/sites-available/vhost-ssl.conf | sudo tee /tmp/vhost && sudo cat /tmp/vhost | sudo tee /etc/apache2/sites-available/vhost-ssl.conf && sudo rm -f /tmp/vhost
sudo sed 's/\/etc\/ssl\/private\/ssl-cert-snakeoil\.key/\/home\/pi\/_gc\/srv\/crt\/server\.key/g' /etc/apache2/sites-available/vhost-ssl.conf | sudo tee /tmp/vhost && sudo cat /tmp/vhost | sudo tee /etc/apache2/sites-available/vhost-ssl.conf && sudo rm -f /tmp/vhost
sudo a2ensite vhost-ssl
sudo a2enmod ssl
sudo systemctl restart apache2

sudo sed 's/Exec=\/usr\/bin\/x-www-browser\s%u/Exec=\/usr\/bin\/x-www-browser --enable-experimental-web-platform-features %u/g' /usr/share/raspi-ui-overrides/applications/lxde-x-www-browser.desktop | sudo tee /tmp/xbrowser && sudo cat /tmp/xbrowser | sudo tee /usr/share/raspi-ui-overrides/applications/lxde-x-www-browser.desktop && sudo rm -f /tmp/xbrowser
sudo sed 's/Exec=chromium-browser/Exec=chromium-browser --enable-experimental-web-platform-features/g' /usr/share/applications/chromium-browser.desktop | sudo tee /tmp/chbrowser && sudo cat /tmp/chbrowser | sudo tee /usr/share/applications/chromium-browser.desktop && sudo rm -f /tmp/chbrowser

# 証明書追加
certfile="/home/pi/_gc/srv/crt/ca.crt"
certname="org-TripArts"

for certDB in $(find ~/ -name "cert9.db")
do
    certdir=$(dirname ${certDB});
    certutil -A -n "${certname}" -t "TCu,Cu,Tu" -i ${certfile} -d sql:${certdir}
done

# 掃除
rm -rf /home/pi/chirimen-TY51822r3-master
rm master.zip

reboot
