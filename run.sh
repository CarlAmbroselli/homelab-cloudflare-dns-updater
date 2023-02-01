#!/bin/bash

set -eou
source $HOME/.profile

cd "$(dirname "$0")"
source ./secrets.env

SECRET_FILE=./secrets.env
if [ ! -f "$SECRET_FILE" ]; then
    echo "Error. Please initialize $SECRET_FILE first using the template."
    exit 1
fi

VERSION=$(git rev-list --count main)
TAG=$(basename $(pwd))

if [[ "$(docker images -q $TAG:$VERSION 2> /dev/null)" == "" ]]; then
  docker build -t $TAG:$VERSION .
fi

CURRENT_IP=$(dig $CLOUDFLARE_DNS_RECORD +short A @8.8.8.8)
MY_IP=$(curl -s -4 ifconfig.co)

if [ "$CURRENT_IP" == "$MY_IP" ]; then
    echo "IP up-to-date: $MY_IP. Doing nothing."
else
    docker run --env-file $SECRET_FILE --rm $TAG:$VERSION
fi

