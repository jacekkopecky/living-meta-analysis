#!/bin/bash
# default-config.sh: default configuration for monitor.sh and config-to-json.sh
# DON'T CHANGE THIS FILE

# custom config should be in the following file:
config_filename=statsd-server-conf.sh

config_path1="$dir/../../../$config_filename"
config_path2="$dir/$config_filename"

# configure the statsd server in living-meta-analysis/statsd-server-conf.sh
# provide STATSD_HOST, STATSD_PORT, and STATSD_PREFIX
if [ -f "$config_path1" ]
then
  . "$config_path1"
elif [ -f "$config_path2" ]
then
  . "$config_path2"
else
  echo "using default configuration, missing $config_filename in ../../.. or ."
fi

host=${STATSD_HOST:-localhost}
port=${STATSD_PORT:-8125}
prefix=${STATSD_PREFIX:-test.}
