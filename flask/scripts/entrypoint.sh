#!/usr/bin/env bash

gunicorn wsgi --worker-class eventlet --bind 0.0.0.0:8000