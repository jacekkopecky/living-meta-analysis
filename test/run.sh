#!/bin/bash

cd `dirname $0`/..

usage() {
  echo "usage: $0 [--gui]" >/dev/stderr
  exit -1
}

if [ -z `which gemini-gui` -o -z `which selenium-standalone` ]
then
  echo "error: this script requires gemini-gui and selenium-standalone to work" >/dev/stderr
  exit -1
fi

if [ $# -gt 1 ]
then
  echo "error: too many arguments" >/dev/stderr
  usage
fi

if [ $# = 1 -a "$1" != "--gui" ]
then
  echo "error: unrecognized argument $1" >/dev/stderr
  usage
fi

# start a server only for testing

echo "starting server, selenium, gemini(-gui)..."

PORT=8081 TESTING=1 node server &
server_pid=$$

sleep 2

selenium-standalone start &
selenium_pid=$$

sleep 2

cd test

if [ "$1" = '--gui' ]
then
  trap "kill -9 $server_pid $selenium_pid $gemini_pid" EXIT SIGINT SIGTERM

  gemini-gui &
  gemini_pid=$$
  sleep 2
  echo "test GUI running, interrupt to end"
  while sleep 100000; do true; done
else
  gemini test
  kill -9 $server_pid $selenium_pid
fi
