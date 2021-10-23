#!/bin/bash

set -eou

cd "$(dirname "$0")"

VERSION=$(git rev-list --count main)
TAG=$(basename $(pwd))

if [[ "$(docker images -q $TAG:$VERSION 2> /dev/null)" == "" ]]; then
  docker build -t $TAG:$VERSION .
fi

CURRENT_IP=$(dig mothership.pinivo.com +short A)
MY_IP=$(curl -s -4 ifconfig.co)

if [ "$CURRENT_IP" == "$MY_IP" ]; then
    echo "IP up-to-date: $MY_IP. Doing nothing."
else
    docker run -it --env-file ./secrets.env --rm $TAG:$VERSION
fi

