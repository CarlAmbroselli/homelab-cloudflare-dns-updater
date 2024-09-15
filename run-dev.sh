#!/bin/bash

cd "$(dirname "$0")"
source ./secrets.env

SECRET_FILE=./secrets.env
if [ ! -f "$SECRET_FILE" ]; then
    echo "Error. Please initialize $SECRET_FILE first using the template."
    exit 1
fi

# TAG=$(basename $(pwd))
# docker build -t $TAG:latest .
# docker run -p 3000:3000 --env-file $SECRET_FILE --rm $TAG:$VERSION

node --env-file=secrets.env app.js
