#!/usr/bin/env bash

docker run -d -v /dev:/dev --privileged --env EMULATE=0 -p 8002:8002 tcpserver
