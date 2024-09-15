#!/bin/bash

set -eou pipefail

cd "$(dirname "$0")"
source ./secrets.env

SECRET_FILE=./secrets.env
if [ ! -f "$SECRET_FILE" ]; then
    echo "Error. Please initialize $SECRET_FILE first using the template."
    exit 1
fi

VERSION=latest # $(git rev-list --count main)
TAG=$(basename $(pwd))

docker build -t $TAG:$VERSION .
docker run -p 3000:3000 --env-file $SECRET_FILE --rm $TAG:$VERSION
