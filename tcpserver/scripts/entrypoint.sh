#!/usr/bin/env bash
udevadm control --reload-rules

python TCP/server.py
