#!/bin/sh
cd /home/afabbri/PROYECTOS/IONIC/SANTI/docker
docker-compose up

cd /home/afabbri/PROYECTOS/IONIC/SANTI/relevamiento-vs/platforms/android/app/build/outputs/apk/debug/
adb install app-debug.apk
