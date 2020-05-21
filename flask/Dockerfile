# This tells docker how to construct our flask container

# Start with python 3.3.7
FROM python:3.7.7-slim-buster
MAINTAINER Jonathan D. B. Van Schenck <vanschej@oreongstate.edu>

# Set the working directory of the app
WORKDIR /usr/src/app

# set environment variables
# No pyc write and no buffering STDOUT
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install requirements (do this before copying source files
#  for faster re-compiles)
RUN pip install --upgrade pip
COPY ./requirements.txt /usr/src/app/requirements.txt
RUN pip install -r requirements.txt

# Copy source into container
COPY . /usr/src/app/

ENTRYPOINT ./scripts/entrypoint.sh
