#!/bin/bash
while true;
do
    id=`ps aux | grep Server.js | grep -v grep | awk '{print $2}'`
    sleep 30
    if [ -z $id ]; then 
        :   
    else
        node /home/Justin/OkeyUnityServer/src/Server.js &
    fi
    #echo $id
done
