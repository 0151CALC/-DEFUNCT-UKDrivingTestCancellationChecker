#!/usr/bin/env bash
SLEEP_MINUTES=5
while true
do
    echo "Run at $(date)"
    node app.js
    echo "Waiting for $SLEEP_MINUTES mins"
    sleep (($SLEEP_MINUTES*60))
done
